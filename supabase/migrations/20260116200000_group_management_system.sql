-- =====================================================
-- WHATSAPP GROUP MANAGEMENT SYSTEM
-- Migration: Tables for group monitoring, messages, reports and alerts
-- =====================================================

-- 1. Tabela principal de grupos monitorados
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    group_jid TEXT NOT NULL,
    group_name TEXT NOT NULL,
    group_description TEXT,
    group_picture_url TEXT,
    
    -- Configurações de monitoramento
    is_active BOOLEAN DEFAULT true,
    keywords TEXT[] DEFAULT '{}',  -- Palavras-chave para alertas
    report_time TIME DEFAULT '18:00',  -- Horário do relatório diário
    report_enabled BOOLEAN DEFAULT true,
    alerts_enabled BOOLEAN DEFAULT true,
    
    -- Estatísticas
    total_messages INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_report_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Índices únicos
    UNIQUE(user_id, group_jid)
);

-- 2. Mensagens de grupos (retenção de 30 dias)
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    
    -- Dados da mensagem
    message_id TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',  -- text, image, audio, video, document
    
    -- Timestamp
    message_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Evitar duplicatas
    UNIQUE(group_id, message_id)
);

-- Índice para busca por data (crucial para limpeza de 30 dias)
CREATE INDEX IF NOT EXISTS idx_group_messages_timestamp ON group_messages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);

-- 3. Relatórios gerados pela IA
CREATE TABLE IF NOT EXISTS group_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    
    -- Dados do relatório
    report_date DATE NOT NULL,
    content TEXT NOT NULL,  -- Resumo em markdown gerado pela IA
    topics TEXT[] DEFAULT '{}',  -- Tópicos identificados
    active_participants TEXT[] DEFAULT '{}',  -- Participantes ativos do dia
    message_count INTEGER DEFAULT 0,  -- Quantidade de mensagens resumidas
    
    -- Status de envio
    was_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Um relatório por grupo por dia
    UNIQUE(group_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_group_reports_date ON group_reports(report_date);

-- 4. Alertas disparados por palavras-chave
CREATE TABLE IF NOT EXISTS group_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    
    -- Dados do alerta
    keyword TEXT NOT NULL,  -- Palavra-chave que disparou
    message_content TEXT NOT NULL,
    sender_jid TEXT NOT NULL,
    sender_name TEXT,
    
    -- Status
    was_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    
    triggered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_alerts_triggered ON group_alerts(triggered_at);

-- 5. Participantes do grupo (cache)
CREATE TABLE IF NOT EXISTS group_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    
    participant_jid TEXT NOT NULL,
    participant_name TEXT,
    is_admin BOOLEAN DEFAULT false,
    
    -- Estatísticas
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(group_id, participant_jid)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_groups
CREATE POLICY "Users can view their own groups" ON whatsapp_groups
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own groups" ON whatsapp_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own groups" ON whatsapp_groups
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own groups" ON whatsapp_groups
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para group_messages (via grupo)
CREATE POLICY "Users can view messages from their groups" ON group_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM whatsapp_groups WHERE id = group_id AND user_id = auth.uid())
    );

-- Políticas para group_reports (via grupo)
CREATE POLICY "Users can view reports from their groups" ON group_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM whatsapp_groups WHERE id = group_id AND user_id = auth.uid())
    );

-- Políticas para group_alerts (via grupo)
CREATE POLICY "Users can view alerts from their groups" ON group_alerts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM whatsapp_groups WHERE id = group_id AND user_id = auth.uid())
    );

-- Políticas para group_participants (via grupo)
CREATE POLICY "Users can view participants from their groups" ON group_participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM whatsapp_groups WHERE id = group_id AND user_id = auth.uid())
    );

-- =====================================================
-- FUNCTION: Limpar mensagens com mais de 30 dias
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_group_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM group_messages
    WHERE message_timestamp < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Cleaned up group messages older than 30 days';
END;
$$;

-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_groups_updated_at
    BEFORE UPDATE ON whatsapp_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_participants_updated_at
    BEFORE UPDATE ON group_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
