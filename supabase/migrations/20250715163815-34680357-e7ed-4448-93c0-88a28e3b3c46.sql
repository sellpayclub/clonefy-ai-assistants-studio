-- Criar tabela para conexões WhatsApp via Evolution API
CREATE TABLE public.n8n_fluxogpt (
  id bigint NOT NULL PRIMARY KEY,
  NomeInstancia text,
  IDAssistentGPT text,
  EmailUSER text,
  created_at timestamp with time zone DEFAULT now(),
  ThreadID text,
  WhatsAppUSER text,
  timeout text,
  message text
);

-- Criar índices para melhor performance
CREATE INDEX idx_n8n_fluxogpt_nome_instancia ON public.n8n_fluxogpt(NomeInstancia);
CREATE INDEX idx_n8n_fluxogpt_assistente ON public.n8n_fluxogpt(IDAssistentGPT);

-- Enable Row Level Security
ALTER TABLE public.n8n_fluxogpt ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (assumindo que o EmailUSER corresponde ao email do usuário logado)
CREATE POLICY "Users can view their own WhatsApp connections" 
ON public.n8n_fluxogpt 
FOR SELECT 
USING (auth.jwt() ->> 'email' = EmailUSER);

CREATE POLICY "Users can create their own WhatsApp connections" 
ON public.n8n_fluxogpt 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = EmailUSER);

CREATE POLICY "Users can update their own WhatsApp connections" 
ON public.n8n_fluxogpt 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = EmailUSER);

CREATE POLICY "Users can delete their own WhatsApp connections" 
ON public.n8n_fluxogpt 
FOR DELETE 
USING (auth.jwt() ->> 'email' = EmailUSER);