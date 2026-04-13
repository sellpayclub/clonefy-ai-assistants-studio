

## Plano: Painel Admin Global (Proprietário)

### O que será criado

**1. Funções SQL para acesso admin (migration)**

Criar funções `SECURITY DEFINER` que verificam se o chamador é admin (`personaldann@gmail.com`) e retornam dados de todos os usuários:

- `admin_get_global_stats()` → totais: usuários, leads, sessões ativas, conexões, assistentes
- `admin_get_all_leads(target_user_id?)` → leads de todos ou de um usuário específico  
- `admin_get_all_sessions(target_user_id?)` → sessões live chat de todos ou de um usuário

**2. Painel Admin expandido (`Admin.tsx`)**

Nova aba "Painel Global" com:
- Cards de métricas: Total Usuários, Total Leads, Sessões Ativas, Conexões WhatsApp, Assistentes
- Tabela de "leads recentes" de todos os usuários
- Botão "Ver dados" em cada usuário → filtra CRM/Live Chat desse usuário

**3. Filtro admin no CRM (`useCRMLeads.ts` + `CRMLeads.tsx`)**

- Novo parâmetro opcional `adminViewUserId` no hook
- Quando admin: dropdown no topo da página para selecionar usuário (ou "Todos")
- Dados vêm via RPC `admin_get_all_leads`

**4. Filtro admin no Live Chat (`useLiveChat.ts` + `LiveChat.tsx`)**

- Mesmo padrão: dropdown para selecionar usuário
- Dados vêm via RPC `admin_get_all_sessions`

### Segurança
- Todas as funções SQL verificam `auth.uid()` = ID do personaldann@gmail.com
- Nenhuma tabela tem RLS alterada
- Acesso apenas leitura (view-only)

### Arquivos
| Arquivo | Alteração |
|---|---|
| Nova migration | 3 funções SQL admin |
| `src/pages/Admin.tsx` | Nova aba "Painel Global" com métricas |
| `src/hooks/useCRMLeads.ts` | Suporte a `adminViewUserId` |
| `src/pages/CRMLeads.tsx` | Dropdown de usuário para admin |
| `src/hooks/useLiveChat.ts` | Suporte a `adminViewUserId` |
| `src/pages/LiveChat.tsx` | Dropdown de usuário para admin |
| Novo: `src/hooks/useAdminData.ts` | Hook para dados globais admin |

### O que NÃO muda
- Fluxo normal de usuários comuns
- RLS das tabelas
- Edge functions
- Nenhuma lógica de negócio existente
