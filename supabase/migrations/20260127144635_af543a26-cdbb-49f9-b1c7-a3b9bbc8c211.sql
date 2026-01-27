-- Adicionar coluna human_takeover_until na tabela n8n_fluxogpt para controle de pausa da IA
ALTER TABLE public.n8n_fluxogpt 
ADD COLUMN IF NOT EXISTS human_takeover_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar coluna last_sender para saber quem foi o último a enviar
ALTER TABLE public.n8n_fluxogpt 
ADD COLUMN IF NOT EXISTS last_sender TEXT DEFAULT NULL;

-- Criar índice para consultas mais rápidas de takeover ativo
CREATE INDEX IF NOT EXISTS idx_n8n_fluxogpt_takeover 
ON public.n8n_fluxogpt(nomeinstancia, whatsappuser, human_takeover_until) 
WHERE human_takeover_until IS NOT NULL;