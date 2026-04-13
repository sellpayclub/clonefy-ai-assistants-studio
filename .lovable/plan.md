

## Plano: Corrigir fluxo CRM-only ponta a ponta

### Problemas encontrados (3 bugs)

**Bug 1: Mensagens não salvas durante Human Takeover**
- Linha 620: `select('userId')` — mas a tabela `n8n_fluxogpt` **não tem coluna `userId`**
- Resultado: `instanceConfigForMsg?.userId` é sempre `undefined`
- Mensagens do cliente durante takeover NÃO são salvas no Live Chat
- Correção: usar RPC `get_user_id_by_email` com o `emailuser` da instância

**Bug 2: CRM lead nunca criado durante Human Takeover**
- Quando takeover está ativo, o webhook retorna na linha 656 (early return)
- O bloco CRM-only (linha 1026) **nunca é alcançado**
- Resultado: lead nunca aparece no CRM enquanto operador atende
- Correção: adicionar upsert de CRM lead no bloco de takeover (linhas 616-654)

**Bug 3: Human takeover N8N também bloqueia CRM lead**
- Segundo check de takeover (linha 868) também faz early return antes do CRM-only block
- Mesmo problema: lead não é criado
- Correção: mover CRM upsert para ANTES dos early returns, ou duplicar no bloco de takeover

### Correções no webhook (3 alterações cirúrgicas)

**Alteração 1** — Bloco takeover live_chat_sessions (linhas 616-654):
- Resolver userId via RPC `get_user_id_by_email` em vez de `select('userId')`
- Adicionar upsert de CRM lead antes do return

**Alteração 2** — Bloco takeover n8n_fluxogpt (linhas 867-896):
- Adicionar upsert de CRM lead antes do early return (usa `userId` já resolvido na linha 740-757)

**Alteração 3** — Nenhuma mudança nos blocos existentes que já funcionam (live chat session creation, CRM-only block)

### O que NÃO muda
- Fluxo de conexões com agente IA (userId vem de assistantData)
- Live Chat session creation (funciona)
- Buffer de mensagens
- Lógica de follow-up
- Frontend (CRM, Live Chat, hooks)
- Nenhuma migration necessária

### Arquivos
| Arquivo | Alteração |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | 3 blocos corrigidos |
| Deploy | `whatsapp-webhook` |

### Risco: mínimo
- Alterações apenas em blocos de early-return que hoje já falham silenciosamente
- Conexões com agente IA nunca entram nesses blocos
- Adiciona funcionalidade onde antes não havia nenhuma

