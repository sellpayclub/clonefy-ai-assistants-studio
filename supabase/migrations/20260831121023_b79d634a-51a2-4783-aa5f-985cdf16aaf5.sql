CREATE INDEX IF NOT EXISTS idx_conversations_user_active_updated
ON public.conversations (user_id, is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON public.messages (conversation_id, created_at DESC);