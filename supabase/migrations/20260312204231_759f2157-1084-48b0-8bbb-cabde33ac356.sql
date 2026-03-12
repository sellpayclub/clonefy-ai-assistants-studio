-- Fix 1: Permitir 'telegram' em live_chat_sessions.source
ALTER TABLE public.live_chat_sessions
  DROP CONSTRAINT IF EXISTS live_chat_sessions_source_check;

ALTER TABLE public.live_chat_sessions
  ADD CONSTRAINT live_chat_sessions_source_check
  CHECK (source = ANY (ARRAY['whatsapp'::text, 'widget'::text, 'telegram'::text]));

-- Fix 2: Permitir 'telegram' em live_chat_messages.source
ALTER TABLE public.live_chat_messages
  DROP CONSTRAINT IF EXISTS live_chat_messages_source_check;

ALTER TABLE public.live_chat_messages
  ADD CONSTRAINT live_chat_messages_source_check
  CHECK (source = ANY (ARRAY['whatsapp'::text, 'widget'::text, 'telegram'::text]));

-- Fix 3: Criar unique index em crm_leads(user_id, whatsapp_number) para o upsert funcionar
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_user_id_whatsapp_number_key
  ON public.crm_leads (user_id, whatsapp_number);