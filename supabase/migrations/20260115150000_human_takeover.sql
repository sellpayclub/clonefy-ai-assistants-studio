-- Migration: Human Takeover - Pausa a IA quando humano assume conversa
-- Quando o usuário envia mensagem (fromMe: true), a IA pausa por 2 horas

ALTER TABLE public.n8n_fluxogpt 
ADD COLUMN IF NOT EXISTS human_takeover_until TIMESTAMPTZ DEFAULT NULL;

-- Índice para performance nas verificações
CREATE INDEX IF NOT EXISTS idx_n8n_fluxogpt_takeover 
ON public.n8n_fluxogpt (whatsappuser, human_takeover_until)
WHERE whatsappuser IS NOT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.n8n_fluxogpt.human_takeover_until 
IS 'Timestamp até quando a IA deve ficar pausada para este contato (human takeover - 2 horas)';
