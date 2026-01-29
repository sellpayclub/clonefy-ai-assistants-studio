-- ============================================
-- Integração Agendify - Configurações por Assistente
-- ============================================

-- Tabela para armazenar configurações do Agendify por assistente
CREATE TABLE IF NOT EXISTS public.agendify_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    api_base_url TEXT NOT NULL DEFAULT 'https://agendamento-agendify.com',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Garantir que cada assistente só tenha uma configuração
    CONSTRAINT unique_assistant_agendify UNIQUE (assistant_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendify_configs_user_id ON public.agendify_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agendify_configs_assistant_id ON public.agendify_configs(assistant_id);

-- Enable RLS
ALTER TABLE public.agendify_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own agendify configs"
    ON public.agendify_configs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agendify configs"
    ON public.agendify_configs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agendify configs"
    ON public.agendify_configs
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agendify configs"
    ON public.agendify_configs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_agendify_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agendify_configs_updated_at
    BEFORE UPDATE ON public.agendify_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agendify_configs_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.agendify_configs IS 'Configurações de integração com o sistema Agendify por assistente';
COMMENT ON COLUMN public.agendify_configs.tenant_id IS 'UUID do tenant no Agendify (x-tenant-id)';
COMMENT ON COLUMN public.agendify_configs.api_base_url IS 'URL base da API Agendify';