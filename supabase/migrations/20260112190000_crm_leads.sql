-- Migração para criação do CRM Leads inteligente
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
    whatsapp_number TEXT NOT NULL,
    name TEXT,
    email TEXT,
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'aberto',
    intent_summary TEXT,
    tags TEXT[],
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Users can view their own leads" 
ON public.crm_leads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" 
ON public.crm_leads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.crm_leads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.crm_leads FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_leads_updated_at
    BEFORE UPDATE ON public.crm_leads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_user_id ON public.crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_whatsapp_number ON public.crm_leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_score ON public.crm_leads(lead_score);
