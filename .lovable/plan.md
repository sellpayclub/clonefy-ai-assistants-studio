
## Diagnóstico completo confirmado

### Problema isolado ao Telegram — WhatsApp 100% intacto

**WhatsApp já funciona porque:**
- Usa `source: 'whatsapp'` → está na lista permitida do CHECK constraint
- Tem lógica própria no `whatsapp-webhook` que **nunca menciona 'telegram'** (confirmado por busca)
- A tabela `n8n_fluxogpt` é exclusiva do WhatsApp

**Telegram está falhando por 3 bloqueios no banco de dados:**

| Problema | Onde | Detalhe |
|---|---|---|
| 1 | `live_chat_sessions.source` | CHECK constraint só permite `'whatsapp'` ou `'widget'` — bloqueia `'telegram'` |
| 2 | `live_chat_messages.source` | Mesmo CHECK — bloqueia INSERT com `source: 'telegram'` |
| 3 | `crm_leads` | Não tem unique index em `(user_id, whatsapp_number)` — o `upsert` no webhook falha silenciosamente |

**Código do `telegram-webhook` já está correto** — o problema é 100% no banco.

### A migração (único arquivo a criar)

```sql
-- Fix 1: live_chat_sessions aceitar 'telegram'
ALTER TABLE public.live_chat_sessions
  DROP CONSTRAINT live_chat_sessions_source_check;
ALTER TABLE public.live_chat_sessions
  ADD CONSTRAINT live_chat_sessions_source_check
  CHECK (source = ANY (ARRAY['whatsapp'::text, 'widget'::text, 'telegram'::text]));

-- Fix 2: live_chat_messages aceitar 'telegram'
ALTER TABLE public.live_chat_messages
  DROP CONSTRAINT live_chat_messages_source_check;
ALTER TABLE public.live_chat_messages
  ADD CONSTRAINT live_chat_messages_source_check
  CHECK (source = ANY (ARRAY['whatsapp'::text, 'widget'::text, 'telegram'::text]));

-- Fix 3: Unique index para o upsert de crm_leads funcionar
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_user_id_whatsapp_number_key
  ON public.crm_leads (user_id, whatsapp_number);
```

### Garantia de não interferência no WhatsApp

- O WhatsApp continua usando `source: 'whatsapp'` — valor **já permitido** pelo novo constraint (só adicionamos, não removemos nada)
- O unique index no `crm_leads` beneficia o WhatsApp também (evita duplicatas — atualmente o upsert do WhatsApp também dependia desse index)
- **Zero alterações** em `whatsapp-webhook`, `live-chat-send`, frontend ou qualquer outro arquivo
- Único arquivo criado: 1 migration SQL

### O que muda na prática
Após a migration, toda mensagem recebida pelo bot Telegram vai:
1. Criar sessão no Live Chat com badge "✈️ Telegram" (frontend já trata isso)
2. Salvar mensagens em `live_chat_messages`
3. Criar/atualizar lead no CRM com `source: 'telegram'`
4. IA responder normalmente via OpenAI

### Resumo de arquivos
| Arquivo | Ação |
|---|---|
| Nova migration SQL | CRIAR — adiciona 'telegram' aos constraints + unique index |
| `whatsapp-webhook` | NÃO TOCA |
| `telegram-webhook` | NÃO TOCA |
| `live-chat-send` | NÃO TOCA |
| Frontend | NÃO TOCA |
