
## Diagnóstico

**Problema central**: A página `/reset-password` não existe no projeto. Quando o Supabase envia o email de redefinição e o usuário clica no link, ele é redirecionado para `/auth/callback` — que só lida com `type=signup`, não com `type=recovery`. O usuário fica preso numa tela de erro ou é redirecionado para o dashboard SEM ter redefinido a senha.

**Fluxo atual (quebrado)**:
```
Email "esqueci senha" enviado
  ↓
Link no email → /auth/callback?type=recovery&access_token=...
  ↓
AuthCallback.tsx → não trata type=recovery → mostra "Link inválido"
```

**Fluxo correto (o que vamos fazer)**:
```
Email "esqueci senha" enviado
  ↓
Link no email → /reset-password#access_token=...&type=recovery
  (Supabase envia como HASH fragment, não query param)
  ↓
Nova página ResetPassword.tsx → detecta tipo recovery → mostra form de nova senha
  ↓
supabase.auth.updateUser({ password }) → atualiza senha
  ↓
Redireciona para /dashboard
```

**Também**: O logged-in user (dentro da plataforma) precisa poder trocar senha também — via botão no perfil/settings ou sidebar.

---

## O que vamos mudar (3 arquivos, 1 novo)

### 1. Nova página: `src/pages/ResetPassword.tsx`
- Rota pública `/reset-password`
- No `useEffect`, escuta `onAuthStateChange` para capturar o evento `PASSWORD_RECOVERY`
- Quando evento `PASSWORD_RECOVERY` é disparado, mostra o formulário de nova senha
- Formulário: "Nova senha" + "Confirmar nova senha"
- Chama `supabase.auth.updateUser({ password: newPassword })`
- Após sucesso: redireciona para `/dashboard`
- Se não veio via link de recovery (sem evento): mostra mensagem de erro/link expirado

### 2. Corrigir `src/pages/Auth.tsx` — `handleForgotPassword`
- Mudar `redirectTo` de `/auth/callback` para `/reset-password`
- Supabase vai redirecionar o usuário para essa URL com o token de recovery no hash

### 3. Corrigir `src/pages/AuthCallback.tsx`
- Adicionar tratamento para `type=recovery` — redireciona para `/reset-password` preservando os tokens no hash (ou deixa o Supabase lidar via `onAuthStateChange`)
- Garante que o callback não quebra para outros tipos

### 4. Registrar rota em `src/App.tsx`
- Adicionar `<Route path="/reset-password" element={<ResetPassword />} />` como rota **pública** (fora do AppLayout)

---

## Detalhe técnico importante (por que Supabase é chato nisso)

O Supabase envia o link de recovery com os tokens no **hash fragment** da URL (`#access_token=...&type=recovery`), não como query params. Por isso:
- `searchParams.get('type')` não funciona para recovery
- A forma correta é escutar `onAuthStateChange` que dispara `PASSWORD_RECOVERY` automaticamente quando detecta esse hash
- A página não pode estar protegida pelo `AppLayout` (pois o usuário ainda não está "logado" no sentido normal)

---

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/pages/ResetPassword.tsx` | Novo — página de redefinição de senha |
| `src/pages/Auth.tsx` | Fix `redirectTo` apontando para `/reset-password` |
| `src/pages/AuthCallback.tsx` | Fix para não quebrar no tipo recovery |
| `src/App.tsx` | + rota pública `/reset-password` |
