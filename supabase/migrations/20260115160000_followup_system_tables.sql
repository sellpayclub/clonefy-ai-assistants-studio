-- =====================================================
-- SISTEMA DE FOLLOW-UP AUTOMATIZADO COM IA
-- Migração: Criar tabelas principais
-- =====================================================

-- 1. TABELA: Campanhas de Follow-up
CREATE TABLE IF NOT EXISTS public.followup_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuração do Negócio (para gerar IA)
    business_name TEXT,
    business_description TEXT,
    value_proposition TEXT,
    common_objections JSONB DEFAULT '[]'::jsonb, -- [{objection, response}]
    tone_of_voice TEXT DEFAULT 'friendly', -- friendly, professional, casual
    important_links JSONB DEFAULT '[]'::jsonb, -- [{label, url}]
    
    -- IA Gerada
    assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
    openai_assistant_id TEXT,
    
    -- WhatsApp
    whatsapp_instance TEXT,
    is_connected BOOLEAN DEFAULT false,
    
    -- Sequência de Mensagens
    message_sequence JSONB DEFAULT '[]'::jsonb, -- [{step, delay_hours, message_template}]
    max_followups INTEGER DEFAULT 3,
    
    -- Controle Anti-Spam
    min_interval_minutes INTEGER DEFAULT 30,
    max_daily_messages INTEGER DEFAULT 50,
    start_hour INTEGER DEFAULT 9,
    end_hour INTEGER DEFAULT 18,
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    random_delay_seconds INTEGER DEFAULT 60,
    
    -- Status
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    
    -- Estatísticas
    total_leads INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: Leads de Follow-up
CREATE TABLE IF NOT EXISTS public.followup_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.followup_campaigns(id) ON DELETE SET NULL,
    
    -- Dados do Lead
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    
    -- Status e Progresso
    status TEXT DEFAULT 'new', -- new, contacted, interested, converted, lost, paused
    current_step INTEGER DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    
    -- Controle de Disparos
    last_message_at TIMESTAMPTZ,
    last_response_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    total_messages_sent INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    
    -- Human Takeover
    human_takeover_until TIMESTAMPTZ,
    
    -- Thread OpenAI (para contexto da conversa)
    openai_thread_id TEXT,
    
    -- Metadados
    source TEXT DEFAULT 'manual', -- manual, csv, api
    custom_data JSONB DEFAULT '{}'::jsonb,
    intent_summary TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: WhatsApp único por campanha
    UNIQUE(campaign_id, whatsapp_number)
);

-- 3. TABELA: Histórico de Mensagens
CREATE TABLE IF NOT EXISTS public.followup_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.followup_leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.followup_campaigns(id) ON DELETE CASCADE,
    
    -- Mensagem
    direction TEXT NOT NULL, -- sent, received
    content TEXT NOT NULL,
    step_number INTEGER,
    
    -- Status de Entrega
    status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
    
    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Análise IA
    intent_detected TEXT,
    sentiment TEXT, -- positive, neutral, negative
    lead_score_change INTEGER DEFAULT 0
);

-- 4. TABELA: Agendamentos de Disparo
CREATE TABLE IF NOT EXISTS public.followup_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.followup_leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.followup_campaigns(id) ON DELETE CASCADE,
    
    scheduled_at TIMESTAMPTZ NOT NULL,
    step_number INTEGER NOT NULL,
    message_template TEXT,
    
    status TEXT DEFAULT 'pending', -- pending, processing, sent, cancelled, failed
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Campanhas
CREATE INDEX IF NOT EXISTS idx_followup_campaigns_user ON public.followup_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_campaigns_status ON public.followup_campaigns(status);

-- Leads
CREATE INDEX IF NOT EXISTS idx_followup_leads_user ON public.followup_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_leads_campaign ON public.followup_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_followup_leads_status ON public.followup_leads(status);
CREATE INDEX IF NOT EXISTS idx_followup_leads_whatsapp ON public.followup_leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_followup_leads_next_followup ON public.followup_leads(next_followup_at) 
    WHERE next_followup_at IS NOT NULL AND status IN ('new', 'contacted', 'interested');

-- Mensagens
CREATE INDEX IF NOT EXISTS idx_followup_messages_lead ON public.followup_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_messages_campaign ON public.followup_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_followup_messages_sent_at ON public.followup_messages(sent_at DESC);

-- Agendamentos
CREATE INDEX IF NOT EXISTS idx_followup_schedules_pending ON public.followup_schedules(scheduled_at)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_followup_schedules_lead ON public.followup_schedules(lead_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Ativar RLS
ALTER TABLE public.followup_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas: Campanhas
CREATE POLICY "Users can view own campaigns" ON public.followup_campaigns
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.followup_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.followup_campaigns
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.followup_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas: Leads
CREATE POLICY "Users can view own leads" ON public.followup_leads
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own leads" ON public.followup_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.followup_leads
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.followup_leads
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas: Mensagens (via lead)
CREATE POLICY "Users can view messages of own leads" ON public.followup_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.followup_leads WHERE id = lead_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can create messages for own leads" ON public.followup_messages
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.followup_leads WHERE id = lead_id AND user_id = auth.uid())
    );

-- Políticas: Agendamentos (via lead)
CREATE POLICY "Users can view schedules of own leads" ON public.followup_schedules
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.followup_leads WHERE id = lead_id AND user_id = auth.uid())
    );
CREATE POLICY "Users can manage schedules of own leads" ON public.followup_schedules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.followup_leads WHERE id = lead_id AND user_id = auth.uid())
    );

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função genérica (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Campanhas
DROP TRIGGER IF EXISTS update_followup_campaigns_updated_at ON public.followup_campaigns;
CREATE TRIGGER update_followup_campaigns_updated_at
    BEFORE UPDATE ON public.followup_campaigns
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger: Leads
DROP TRIGGER IF EXISTS update_followup_leads_updated_at ON public.followup_leads;
CREATE TRIGGER update_followup_leads_updated_at
    BEFORE UPDATE ON public.followup_leads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Disparador de Follow-ups
-- =====================================================

CREATE OR REPLACE FUNCTION disparar_followups_automaticos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r record;
    agora timestamptz := now();
BEGIN
    -- Buscar agendamentos pendentes que estão no horário
    FOR r IN
        SELECT 
            s.id as schedule_id,
            s.lead_id,
            s.campaign_id,
            s.step_number,
            s.message_template,
            l.name as lead_name,
            l.whatsapp_number,
            l.openai_thread_id,
            l.human_takeover_until,
            c.whatsapp_instance,
            c.openai_assistant_id,
            c.min_interval_minutes,
            c.max_daily_messages,
            c.start_hour,
            c.end_hour,
            c.working_days,
            c.random_delay_seconds
        FROM public.followup_schedules s
        JOIN public.followup_leads l ON s.lead_id = l.id
        JOIN public.followup_campaigns c ON s.campaign_id = c.id
        WHERE 
            s.status = 'pending'
            AND s.scheduled_at <= agora
            AND c.status = 'active'
            AND l.status IN ('new', 'contacted', 'interested')
            AND (l.human_takeover_until IS NULL OR l.human_takeover_until < agora)
            AND EXTRACT(HOUR FROM agora) >= c.start_hour
            AND EXTRACT(HOUR FROM agora) < c.end_hour
            AND EXTRACT(DOW FROM agora)::int = ANY(c.working_days)
        ORDER BY s.scheduled_at
        LIMIT 10 -- Processar em lotes
    LOOP
        -- Marcar como processando
        UPDATE public.followup_schedules 
        SET status = 'processing', attempts = attempts + 1
        WHERE id = r.schedule_id;
        
        -- Chamar edge function de disparo
        PERFORM net.http_post(
            url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/followup-dispatcher',
            headers := jsonb_build_object('Content-Type', 'application/json'),
            body := jsonb_build_object(
                'schedule_id', r.schedule_id,
                'lead_id', r.lead_id,
                'campaign_id', r.campaign_id,
                'lead_name', r.lead_name,
                'whatsapp_number', r.whatsapp_number,
                'whatsapp_instance', r.whatsapp_instance,
                'assistant_id', r.openai_assistant_id,
                'thread_id', r.openai_thread_id,
                'step_number', r.step_number,
                'message_template', r.message_template
            )
        );
    END LOOP;
END;
$$;

COMMENT ON FUNCTION disparar_followups_automaticos() IS 'Dispara follow-ups agendados automaticamente via cron';

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE public.followup_campaigns IS 'Campanhas de follow-up automatizado com IA';
COMMENT ON TABLE public.followup_leads IS 'Leads importados para campanhas de follow-up';
COMMENT ON TABLE public.followup_messages IS 'Histórico de mensagens enviadas/recebidas';
COMMENT ON TABLE public.followup_schedules IS 'Agendamentos de disparo de mensagens';
