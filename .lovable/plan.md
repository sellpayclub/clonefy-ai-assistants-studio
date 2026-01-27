
## Objetivo (o que vai ficar pronto)
1) Quando você “assumir” (Human Takeover) no **Chat ao Vivo**, a IA **não vai mais responder no WhatsApp**, mesmo que o cliente mande mensagem.
2) Melhorar performance geral: **menus, navegação e carregamento** muito mais rápidos, reduzindo chamadas repetidas ao Supabase e evitando remontar sidebar a cada página.

---

## 1) Correção definitiva: IA não pode responder quando você assumiu (WhatsApp)
### Problema real (por que aconteceu)
- O **Live Chat** já está marcando a sessão como `human_takeover` e setando `human_takeover_until` (isso aparece nos seus logs).
- Porém o `whatsapp-webhook` estava decidindo “pausar IA” olhando o estado no `n8n_fluxogpt`.
- Esse estado pode ficar inconsistente (ex.: `whatsapp-evolution` sobrescreve `whatsappuser` com “Conectado”, e o registro do contato pode não ser encontrado), então o webhook não detecta a pausa e responde mesmo assim.

### Solução (sem nada “novo”, usando o que já existe)
**Padronizar a fonte da verdade do takeover para WhatsApp: `live_chat_sessions`.**  
(É exatamente o que o `widget-chat` já faz e funciona bem.)

### Implementação
No `supabase/functions/whatsapp-webhook/index.ts`:
1) **Antes de iniciar a geração de resposta da IA**, buscar a sessão no `live_chat_sessions` por:
   - `instance_name = payload.instance`
   - `contact_number = contactNumber`
2) Se encontrar:
   - Se `status === 'human_takeover'` e `human_takeover_until` > agora:
     - **Salvar mensagem do cliente no Live Chat** (isso já acontece)
     - **Retornar early-exit** e **não chamar OpenAI** nem enviar resposta pelo Evolution.
   - Se `human_takeover_until` expirou:
     - atualizar sessão para `ai_active` e `human_takeover_until = null` e seguir normalmente.

3) Manter o check no `n8n_fluxogpt` como fallback, mas **não depender mais dele** para bloquear IA.

### Resultado esperado
- Se você apertar “Pausar IA” no Live Chat: qualquer mensagem do cliente no WhatsApp **entra no painel**, mas **a IA não responde**.
- Quando você apertar “Reativar IA”: no próximo input do cliente, a IA volta a responder.

---

## 2) Performance: “tudo lento” (menu, navegação, telas)
Pelos network logs, está acontecendo **muita chamada repetida** para:
- `GET /auth/v1/user` (várias vezes em sequência)
- e vários componentes montando/desmontando juntos a cada troca de rota.

### 2.1. Parar de remontar Sidebar / Layout em toda página (grande ganho)
Hoje: quase toda página faz:
- `<SidebarProvider><AppSidebar /> ...</SidebarProvider>`
Isso significa que ao navegar:
- Sidebar desmonta e monta de novo
- Recria listeners
- Rebusca usuário
- Re-renderiza mais do que precisa

**Solução**
Criar um layout único (ex.: `AppLayout`) com:
- `<SidebarProvider>`
- `<AppSidebar />`
- `<Outlet />` do React Router

E no `App.tsx`:
- agrupar rotas internas dentro desse layout
- páginas “internas” (Dashboard, WhatsApp, LiveChat, etc.) passam a renderizar **só o conteúdo**, sem repetir sidebar.

Impacto:
- Sidebar fica estável
- Navegação fica instantânea (principalmente “menu lento”)

---

### 2.2. Centralizar autenticação (remover “spam” de getUser)
Hoje vários lugares chamam `supabase.auth.getUser()` ao mesmo tempo:
- AppSidebar
- BrandingProvider
- useLiveChat
- useUserLimits
- várias páginas com “checkAuth”

Isso multiplica requests e deixa a UI pesada.

**Solução**
Criar um `AuthContext` (ex.: `src/contexts/AuthContext.tsx`) que:
- chama `supabase.auth.getSession()` 1 vez ao iniciar
- mantém `session` e `user` em memória
- escuta `onAuthStateChange` para atualizar
- fornece hook `useAuth()`

Então substituir `getUser()` por `useAuth()` nesses pontos:
- `src/components/AppSidebar.tsx`
- `src/contexts/BrandingContext.tsx`
- `src/hooks/useLiveChat.ts`
- `src/hooks/useUserLimits.ts`
- guardas de páginas (trocar por um `ProtectedRoute`)

Impacto:
- reduz drasticamente requests
- menos travadas ao abrir telas

---

### 2.3. Live Chat mais leve (sem “travadas” ao selecionar sessão/enviar)
Ajustes planejados no `src/hooks/useLiveChat.ts`:
1) **Não recriar subscriptions** quando `selectedSessionId` muda:
   - hoje o `useEffect` de realtime depende de `selectedSessionId`
   - isso pode resubscrever e gerar custo extra
   - vamos trocar para usar `useRef` do `selectedSessionId` (ou separar efeitos)
2) `loadMessages()`:
   - fazer `update is_read` e `update unread_count` em paralelo (não sequencial)
   - opcional: debouncer para evitar spam de updates quando o usuário clica rápido
3) `SessionsList`:
   - `filteredSessions` virar `useMemo` (reduz CPU em listas maiores)

Impacto:
- menos “lag” ao trocar de conversa
- UI mais fluida

---

## 3) Passo a passo de implementação (ordem)
1) Ajustar `whatsapp-webhook` para checar takeover no `live_chat_sessions` e bloquear OpenAI quando ativo.
2) Criar `AuthContext` + `useAuth` + `ProtectedRoute`.
3) Criar `AppLayout` (SidebarProvider + Sidebar + Outlet).
4) Refatorar páginas principais para remover wrappers duplicados:
   - Dashboard, Assistants, WhatsApp, Conversations, LiveChat, CRMLeads, Admin, Followup, Commerce etc.
5) Otimizações no `useLiveChat` e `SessionsList`.
6) Testes guiados:
   - Navegar entre telas (menu) e verificar tempo/fluidez.
   - Assumir conversa no Live Chat e mandar mensagem do cliente no WhatsApp:
     - deve entrar no painel
     - IA não pode responder
   - Reativar IA e mandar nova mensagem:
     - IA deve responder normalmente.

---

## Riscos e como vamos evitar quebrar
- Refatorar layout pode quebrar padding/altura em algumas páginas.
  - Vamos ajustar cada página para manter o mesmo visual (paddings e `h-screen` onde necessário).
- Human takeover no WhatsApp precisa funcionar mesmo se houver inconsistências em `n8n_fluxogpt`.
  - Por isso o bloqueio principal será `live_chat_sessions`.

---

## Critérios de “deu certo”
- Ao “assumir”, a IA não responde no WhatsApp até o término do `human_takeover_until` (ou até você reativar).
- Network: requests repetidos para `/auth/v1/user` caem drasticamente (ideal: 1 no início, não dezenas).
- Troca de página pelo menu fica perceptivelmente mais rápida (sidebar não remonta).
