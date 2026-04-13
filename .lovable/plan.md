

## Plano: Implementar integracao Facebook Messenger + Instagram Direct

### Informacoes recebidas

- **App ID Instagram**: 888623730888263
- **App Secret Instagram**: bbd0b5f83f6d3f435dd0f4aba7b067a0
- Permissoes: `instagram_business_basic`, `instagram_manage_comments`, `instagram_business_manage_messages`
- Precisa configurar webhook URL + verify token para Instagram e Messenger

### URLs para voce configurar no Meta

Apos implementacao, voce vai preencher nos formularios do Meta:

| Campo | Valor |
|---|---|
| **URL de callback (Webhook)** — Instagram e Messenger | `https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/meta-webhook` |
| **Verificar token** | `clonefy_meta_verify_2024` |
| **URL de redirecionamento** (Login Instagram) | `https://clonefy-ai-assistants-studio.lovable.app/meta-channels` |

### O que sera implementado

#### 1. Secrets — `META_APP_SECRET`
Adicionar o app secret como secret do Supabase para validacao de webhooks.

#### 2. Migration SQL — Tabela `meta_connections`
Tabela isolada com: `user_id`, `platform` (messenger/instagram), `page_id`, `page_access_token`, `instagram_account_id`, `assistant_id`, `is_active`, `webhook_verify_token`. RLS por `user_id`.

#### 3. Edge Function — `meta-webhook/index.ts`
Seguindo exatamente o mesmo padrao do `telegram-webhook`:

- **GET**: Responde ao Meta Webhook Verification (`hub.verify_token` → retorna `hub.challenge`)
- **POST**: Processa mensagens recebidas
  - Identifica platform pelo campo `object` (`page` = messenger, `instagram` = instagram)
  - Busca `meta_connections` pelo `page_id` extraido do webhook
  - Cria/atualiza `live_chat_session` (source = `messenger` ou `instagram`)
  - Salva `live_chat_message` (sender_type = customer)
  - Upsert `crm_leads`
  - Verifica human_takeover — se ativo, para aqui
  - Se IA ativa, chama OpenAI Assistants API (mesmo runAssistant do telegram-webhook)
  - Envia resposta via Graph API `POST https://graph.facebook.com/v19.0/me/messages`
  - Salva resposta IA em `live_chat_messages`

#### 4. Edge Function — Atualizar `live-chat-send/index.ts`
Adicionar bloco para `source === 'messenger'` e `source === 'instagram'`:
- Busca `page_access_token` em `meta_connections` pelo `user_id` + `page_id` (extraido de `instance_name` formato `meta_{page_id}`)
- Envia via Graph API `POST /v19.0/me/messages`

Bonus: remover o bloco duplicado de Telegram que existe nas linhas 168-210 (bug existente).

#### 5. Frontend — Pagina `MetaChannels.tsx`
Seguindo padrao da pagina `Telegram.tsx`:
- Tutorial passo-a-passo
- Campo para Page Access Token
- Selecao de plataforma (Messenger / Instagram)
- Selecao de assistente IA vinculado
- Botao ativar/desativar
- URL do webhook e verify token para copiar
- Lista de conexoes ativas

#### 6. Frontend — Sidebar e Rotas
- Adicionar item "Meta Channels" no `AppSidebar.tsx` (icone Messenger/Instagram)
- Rota `/meta-channels` no `App.tsx` com lazy load

#### 7. Frontend — Badges no `SessionsList.tsx`
Adicionar identificacao visual para sources `messenger` e `instagram` na lista de sessoes do Live Chat.

---

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `meta_connections` com RLS |
| `supabase/functions/meta-webhook/index.ts` | Criar |
| `supabase/functions/live-chat-send/index.ts` | Adicionar blocos messenger/instagram + remover duplicata telegram |
| `src/pages/MetaChannels.tsx` | Criar |
| `src/App.tsx` | Adicionar rota |
| `src/components/AppSidebar.tsx` | Adicionar item menu |
| `src/components/live-chat/SessionsList.tsx` | Adicionar badges |

### Risco
Zero impacto em WhatsApp/Telegram/Widget existentes. Tabela e webhook totalmente isolados.

