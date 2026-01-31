-- Criar bucket para arquivos de leads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lead-files', 'lead-files', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela para metadados dos anexos
CREATE TABLE IF NOT EXISTS public.crm_lead_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document')),
  mime_type TEXT,
  file_size INTEGER,
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'widget')),
  ai_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_lead_attachments_lead_id ON public.crm_lead_attachments(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_attachments_user_id ON public.crm_lead_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_attachments_created_at ON public.crm_lead_attachments(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.crm_lead_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para crm_lead_attachments
CREATE POLICY "Users can view their own lead attachments"
ON public.crm_lead_attachments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead attachments"
ON public.crm_lead_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead attachments"
ON public.crm_lead_attachments FOR DELETE
USING (auth.uid() = user_id);

-- Políticas de storage para o bucket lead-files
CREATE POLICY "Anyone can view lead files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-files');

CREATE POLICY "Authenticated users can upload lead files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lead-files' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage lead files"
ON storage.objects FOR ALL
USING (bucket_id = 'lead-files');