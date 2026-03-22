
## Problemas identificados na ferramenta de Grupos

### 1. QR Code não renderiza corretamente
**Problema**: O QR Code retornado pela Evolution API pode vir como string base64 pura ou como URL `data:image/...`. O código atual tenta tratar isso:
```tsx
src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
```
Mas a Evolution API retorna o QR como `base64` ou como texto/SVG ou como URL de imagem — pode vir em formatos diferentes. Além disso, na `group-connection`, o campo retornado é `data.base64 || data.code`, mas o campo correto na Evolution v2 é `data.qrcode.base64`. O frontend recebe `qr_code` mas pode receber `null` sem tratamento visual adequado.

### 2. "Adicionar Grupo" depende de instâncias do n8n_fluxogpt em vez da instância dedicada
**Problema crítico**: `loadAvailableGroups()` busca instâncias da tabela `n8n_fluxogpt` (sistema principal WhatsApp), mas o sistema de grupos tem sua **própria instância exclusiva** via `group-connection`. O usuário deveria usar a instância `group_{userId}` para buscar grupos, não as instâncias da IA principal. Isso faz com que "Adicionar Grupo" sempre falhe com "Nenhuma instância encontrada".

### 3. Sem polling de reconexão automática / refresh do QR
**Problema**: O QR Code expira em ~60 segundos. Não há botão de "Atualizar QR" nem refresh automático. O usuário fica preso com QR expirado sem conseguir reconectar.

### 4. Desconexão não está implementada
**Problema**: Não há botão para desconectar a instância de grupos. Quando conectado, o único estado é ver "Conectado" mas não tem opção de trocar de número ou desconectar.

### 5. Configurações do grupo: palavras-chave não podem ser editadas
**Problema**: Na aba "Configurações" do grupo selecionado, as palavras-chave são exibidas como badges somente leitura. Não há como adicionar ou remover palavras-chave de um grupo já monitorado — apenas ao adicionar.

### 6. Fluxo "Adicionar Grupo" quebrado por design
**Problema de UX/lógica**: O botão "Adicionar Grupo" dispara `loadAvailableGroups()` que busca grupos via instâncias do sistema principal. Deveria usar a instância `group_{userId}` (já conectada via QR dedicado). O fluxo correto: conectar WhatsApp dedicado → buscar grupos dessa instância → adicionar ao monitoramento.

---

## O que vai ser corrigido

### Arquivo 1 — `supabase/functions/group-connection/index.ts`
- Corrigir `get_qr`: O campo retornado pela Evolution API v2 vem como `data.qrcode.base64` não `data.base64`. Garantir que retorna o formato correto.
- Adicionar nova action `fetch_groups_dedicated`: busca grupos da instância dedicada `group_{userId}` para usar no "Adicionar Grupo".

### Arquivo 2 — `src/pages/GroupManagement.tsx`
- **QR Code**: Melhorar exibição, adicionar botão "Atualizar QR" e timeout visual de 60s.
- **Adicionar Grupo**: Corrigir `loadAvailableGroups()` para usar a instância dedicada `group_{userId}` via `group-connection` (nova action `fetch_groups_dedicated`), em vez de buscar `n8n_fluxogpt`.
- **Desconectar**: Adicionar botão "Desconectar" quando status = connected.
- **Palavras-chave editáveis**: Na aba Configurações do grupo, adicionar input para adicionar/remover palavras-chave e salvar no banco.
- **Guard**: Mostrar mensagem clara "Conecte o WhatsApp primeiro" quando clicar em Adicionar Grupo sem estar conectado.

---

## Resumo dos arquivos

| Arquivo | Mudanças |
|---|---|
| `supabase/functions/group-connection/index.ts` | Corrigir campo QR da Evolution API + nova action `fetch_groups_dedicated` |
| `src/pages/GroupManagement.tsx` | QR refresh + Adicionar Grupo corrigido + Desconectar + Editar keywords |

Zero mudanças no banco, webhooks ou outros arquivos.
