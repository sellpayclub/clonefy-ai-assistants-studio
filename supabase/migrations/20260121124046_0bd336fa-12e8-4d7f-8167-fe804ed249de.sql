-- Expandir tabela crm_leads com campos para análise detalhada
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS conversation_analysis TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS key_topics TEXT[];
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS customer_questions TEXT[];
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS objections TEXT[];
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS products_mentioned TEXT[];
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'baixa';
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutro';

-- Adicionar índice para busca por urgência e sentiment
CREATE INDEX IF NOT EXISTS idx_crm_leads_urgency ON public.crm_leads(urgency_level);
CREATE INDEX IF NOT EXISTS idx_crm_leads_sentiment ON public.crm_leads(sentiment);