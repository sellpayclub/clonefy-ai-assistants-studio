-- =====================================================
-- ADIÇÃO DE COLUNAS DE CONEXÃO WHATSAPP PARA GRUPOS
-- Conexão isolada independente de IA e Follow-up
-- =====================================================

ALTER TABLE whatsapp_groups 
ADD COLUMN IF NOT EXISTS connection_instance TEXT,
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';

-- Índice para buscar por instância
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_connection 
ON whatsapp_groups(connection_instance);

COMMENT ON COLUMN whatsapp_groups.connection_instance IS 'Nome da instância Evolution API exclusiva para grupos (formato: group_[user_id])';
COMMENT ON COLUMN whatsapp_groups.connection_status IS 'Status: disconnected, connecting, connected';
