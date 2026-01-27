

# Correção: Bucket de Storage para Upload de Logos

## Problema Identificado

O upload de logos na página de Personalização está falhando porque o bucket `avatars` **não existe** no Supabase Storage.

### Buckets existentes:
- `assistant-media`
- `assistant-knowledge`
- `assistant-files`
- `product-images`
- `imagens daniel`

### Bucket necessário (não existe):
- `avatars` ❌

---

## Solução

Criar o bucket `avatars` no Supabase Storage com as políticas de segurança (RLS) corretas para permitir:
1. Upload por usuários autenticados
2. Leitura pública (para exibir logos na interface)
3. Update/Delete apenas pelo proprietário

---

## Etapas da Correção

### 1. Criar o Bucket via Migração SQL

Criar migration que:
- Cria o bucket `avatars` como público
- Adiciona políticas de segurança RLS

```sql
-- Criar bucket avatars (público para exibição de logos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política: Qualquer pessoa pode visualizar
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: Usuários podem atualizar/deletar seus próprios arquivos
CREATE POLICY "Users can manage own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = owner_id);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = owner_id);
```

---

## Arquivos a Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `supabase/migrations/xxx_create_avatars_bucket.sql` | Script SQL para criar bucket e políticas |

---

## Resultado Esperado

Após a correção:
- Usuários poderão fazer upload de logos na página de Personalização
- Logos serão armazenados em `storage/avatars/{user_id}/widget_xxx.png`
- URLs públicas funcionarão corretamente para exibição

---

## Observação Técnica

O componente `ImageUpload.tsx` já está corretamente configurado para:
- Organizar arquivos por pasta do usuário: `{user_id}/widget_{timestamp}.{ext}`
- Validar tipo de arquivo (apenas imagens)
- Limitar tamanho a 5MB
- Gerar URL pública após upload

O único problema era a ausência do bucket no Storage.

