-- =====================================================
-- FOLLOW-UP ISOLADO - Campos adicionais
-- Migração: Adicionar suporte a conexão WhatsApp exclusiva
-- =====================================================

-- Adicionar campos para conexão WhatsApp isolada
ALTER TABLE public.followup_campaigns 
ADD COLUMN IF NOT EXISTS whatsapp_instance_key TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_qrcode TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'disconnected';

-- Comentários
COMMENT ON COLUMN public.followup_campaigns.whatsapp_instance_key IS 'Chave única da instância Evolution API (para conexão exclusiva)';
COMMENT ON COLUMN public.followup_campaigns.whatsapp_qrcode IS 'QR Code base64 para conexão';
COMMENT ON COLUMN public.followup_campaigns.whatsapp_status IS 'Status da conexão: disconnected, connecting, connected';
