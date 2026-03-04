-- Create telegram_connections table
CREATE TABLE public.telegram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_token TEXT NOT NULL,
  bot_name TEXT,
  bot_username TEXT,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram connections"
  ON public.telegram_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own telegram connections"
  ON public.telegram_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram connections"
  ON public.telegram_connections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram connections"
  ON public.telegram_connections FOR DELETE USING (auth.uid() = user_id);

-- Create telegram_threads table (thread isolation per chat_id)
CREATE TABLE public.telegram_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_chat_id BIGINT NOT NULL,
  bot_token TEXT NOT NULL,
  user_id UUID NOT NULL,
  assistant_id UUID,
  openai_thread_id TEXT NOT NULL,
  contact_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(telegram_chat_id, bot_token)
);

ALTER TABLE public.telegram_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram threads"
  ON public.telegram_threads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage telegram threads"
  ON public.telegram_threads FOR ALL TO service_role USING (true) WITH CHECK (true);