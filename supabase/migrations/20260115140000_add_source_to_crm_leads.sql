-- Migração para adicionar coluna 'source' na tabela crm_leads
-- Esta coluna identifica a origem do lead: 'whatsapp' ou 'widget'

ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'whatsapp';

-- Criar índice para performance em filtros por origem
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(source);

-- Comentário para documentação
COMMENT ON COLUMN public.crm_leads.source IS 'Origem do lead: whatsapp, widget';
