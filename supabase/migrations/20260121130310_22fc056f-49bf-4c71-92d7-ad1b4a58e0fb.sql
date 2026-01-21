-- Tabela para armazenar TODAS as mensagens em tempo real
CREATE TABLE public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  instance_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  contact_name TEXT,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'document', 'video')),
  media_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'widget')),
  assistant_id TEXT,
  assistant_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para gerenciar sessões de conversa ativas
CREATE TABLE public.live_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  contact_name TEXT,
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'widget')),
  status TEXT DEFAULT 'ai_active' CHECK (status IN ('ai_active', 'human_takeover', 'waiting', 'closed')),
  assistant_id TEXT,
  assistant_name TEXT,
  human_takeover_until TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  last_sender_type TEXT DEFAULT 'customer',
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, instance_name, contact_number)
);

-- Índices para performance
CREATE INDEX idx_live_messages_user ON public.live_chat_messages(user_id);
CREATE INDEX idx_live_messages_session ON public.live_chat_messages(session_id);
CREATE INDEX idx_live_messages_instance_contact ON public.live_chat_messages(instance_name, contact_number);
CREATE INDEX idx_live_messages_created ON public.live_chat_messages(created_at DESC);

CREATE INDEX idx_live_sessions_user ON public.live_chat_sessions(user_id);
CREATE INDEX idx_live_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX idx_live_sessions_updated ON public.live_chat_sessions(last_message_at DESC);

-- RLS para live_chat_messages
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own live messages"
ON public.live_chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own live messages"
ON public.live_chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own live messages"
ON public.live_chat_messages FOR UPDATE
USING (auth.uid() = user_id);

-- RLS para live_chat_sessions
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.live_chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.live_chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.live_chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Service role policies para edge functions
CREATE POLICY "Service role can manage all messages"
ON public.live_chat_messages FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all sessions"
ON public.live_chat_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at nas sessões
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON public.live_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Realtime para atualizações ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_sessions;

-- Adicionar foreign key de session_id após criar a tabela
ALTER TABLE public.live_chat_messages
ADD CONSTRAINT fk_live_messages_session
FOREIGN KEY (session_id) REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE;