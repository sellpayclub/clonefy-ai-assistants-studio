
## Diagnóstico Completo

### Problema raiz identificado nos logs:
```
❌ Instância não encontrada: secretaria_IA
The result contains 2 rows
```

O webhook usa `.single()` para buscar a instância na tabela `n8n_fluxogpt`, mas essa tabela tem **um registro por contato por instância**. Quando mais de 1 cliente conversa com a mesma instância, `.single()` retorna erro e o webhook para completamente.

### Estrutura da tabela `n8n_fluxogpt`:
- Registro "base" da instância: `nomeinstancia=secretaria_IA, emailuser=comercial@..., whatsappuser=Conectado`
- Registro por contato: `nomeinstancia=secretaria_IA, whatsappuser=5515991573135`

O webhook busca configuração da instância com `.single()` mas recebe 2 linhas → erro → 404 → IA para de responder.

### Dois arquivos precisam de correção:

**`supabase/functions/whatsapp-webhook/index.ts`** — 3 pontos críticos:

1. **Linha 644-649**: Busca de configuração da instância com `.single()`:
   ```ts
   .eq('nomeinstancia', instanceName).single()
   ```
   Deve mudar para buscar o registro base (com emailuser preenchido e whatsappuser = 'Conectado' ou sem whatsappuser de número):
   ```ts
   .eq('nomeinstancia', instanceName)
   .not('emailuser', 'is', null)
   .limit(1)
   .maybeSingle()
   ```

2. **Linha 779-784**: Busca de contato existente com `.single()`:
   ```ts
   .eq('nomeinstancia', instanceName).eq('whatsappuser', contactNumber).single()
   ```
   Deve usar `.maybeSingle()` (já que pode não existir).

3. **Linha 585-588**: Outra busca com `.single()` no bloco de human takeover.

**Também há buscas com `.single()` nas linhas 225-231 e 584-588** que podem falhar igualmente.

### Plano de correção:

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**

- **Fix 1** (linha ~644): Trocar a busca de configuração da instância de `.single()` para `.maybeSingle()` + filtro `emailuser IS NOT NULL` para pegar somente o registro base (não os registros de contatos específicos)
- **Fix 2** (linha ~779): Trocar `.single()` por `.maybeSingle()` na busca do contato existente
- **Fix 3** (linha ~585): Trocar `.single()` por `.maybeSingle()` na busca dentro do bloco de human takeover
- **Fix 4** (linha ~225): Trocar `.single()` por `.maybeSingle()` na busca de contato existente quando a mensagem é `fromMe`

Depois: **redeploy da função** `whatsapp-webhook`.

### Live Chat também parou?
O Live Chat depende dos dados salvos pelo webhook. Com o webhook quebrando, nenhuma sessão nova é criada → Live Chat fica vazio. Corrigir o webhook resolve os dois problemas.

### Arquivos afetados:
- `supabase/functions/whatsapp-webhook/index.ts` — 4 substituições de `.single()` por `.maybeSingle()` com filtros corretos
