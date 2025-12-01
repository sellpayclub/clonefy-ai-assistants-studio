-- Script para verificar se a migration de widget_template foi aplicada
-- e para diagnosticar problemas com estilos de chat

-- 1. Verificar se a coluna widget_template existe
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'widget_customizations' 
  AND column_name IN ('widget_template', 'bubble_message', 'quick_questions', 'action_buttons', 'show_status_indicator', 'status_text')
ORDER BY column_name;

-- 2. Ver todas as customizações salvas
SELECT 
    assistant_id,
    widget_name,
    widget_template,
    bubble_message,
    show_status_indicator,
    status_text,
    is_active,
    created_at,
    updated_at
FROM widget_customizations
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Contar quantas customizações existem por template
SELECT 
    widget_template,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM widget_customizations
GROUP BY widget_template
ORDER BY total DESC;

-- 4. Ver valores NULL ou vazios
SELECT 
    assistant_id,
    widget_name,
    widget_template,
    CASE 
        WHEN widget_template IS NULL THEN 'NULL'
        WHEN widget_template = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE'
    END as template_status
FROM widget_customizations
WHERE is_active = true;
