

## Plano: Corrigir itens funcionais 4-7 do painel admin

### 4. Sessoes ativas contadas incorretamente
A funcao `admin_get_global_stats` conta TODAS sessoes com status `ai_active`/`human_takeover`, incluindo sessoes antigas. Correcao: filtrar por `last_message_at > now() - interval '24 hours'`.

### 5. Tabela de sessoes sem filtro por usuario
A tabela de leads ja tem dropdown de filtro por usuario, mas a de sessoes nao. Adicionar o mesmo dropdown com lista de emails unicos extraidos das sessoes.

### 6. Indicacao de erro no painel global
Quando `adminData.error` existir, mostrar um alerta vermelho no topo do painel global.

### 7. Data de criacao nas sessoes
Adicionar coluna "Criado em" na tabela de sessoes mostrando `created_at` formatado.

---

### Alteracoes

| Arquivo | O que muda |
|---|---|
| Migration SQL | `CREATE OR REPLACE` de `admin_get_global_stats` — adicionar filtro `last_message_at > now() - interval '24 hours'` na contagem de sessoes ativas |
| `src/pages/Admin.tsx` | (1) Adicionar state `sessionFilterUser` + dropdown na tabela de sessoes, (2) Adicionar alerta de erro quando `adminData.error`, (3) Adicionar coluna "Criado em" na tabela de sessoes |

### Risco: zero
- Apenas 1 funcao SQL atualizada (read-only, SECURITY DEFINER)
- Frontend: adicoes visuais no painel admin, nenhuma logica existente alterada

