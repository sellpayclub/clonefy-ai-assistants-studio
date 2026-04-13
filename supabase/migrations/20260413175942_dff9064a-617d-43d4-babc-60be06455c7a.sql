
CREATE TABLE public.meta_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
  page_id TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  instagram_account_id TEXT,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_verify_token TEXT NOT NULL DEFAULT 'clonefy_meta_verify_2024',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, page_id)
);

ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meta connections"
  ON public.meta_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meta connections"
  ON public.meta_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta connections"
  ON public.meta_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meta connections"
  ON public.meta_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_meta_connections_updated_at
  BEFORE UPDATE ON public.meta_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
