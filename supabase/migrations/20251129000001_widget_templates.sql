-- Add widget template fields to widget_customizations table
-- This migration adds support for multiple widget templates

-- Add widget_template column with check constraint
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS widget_template TEXT DEFAULT 'agent_card' 
CHECK (widget_template IN ('classic', 'bubble', 'agent_card', 'quick_questions'));

-- Add bubble_message for the bubble template
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS bubble_message TEXT DEFAULT 'Oi! Como posso te ajudar?';

-- Add quick_questions for quick questions template (array of strings)
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS quick_questions JSONB DEFAULT '[]'::jsonb;

-- Add action_buttons for agent_card template (array of {label, message})
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS action_buttons JSONB DEFAULT '[]'::jsonb;

-- Add show_status_indicator for templates that show online status
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS show_status_indicator BOOLEAN DEFAULT true;

-- Add status_text for custom status text
ALTER TABLE public.widget_customizations 
ADD COLUMN IF NOT EXISTS status_text TEXT DEFAULT 'Online agora';

-- Add comments for documentation
COMMENT ON COLUMN public.widget_customizations.widget_template IS 'Template style: classic, bubble, agent_card, quick_questions';
COMMENT ON COLUMN public.widget_customizations.bubble_message IS 'Message shown in bubble template';
COMMENT ON COLUMN public.widget_customizations.quick_questions IS 'Array of quick question strings for quick_questions template';
COMMENT ON COLUMN public.widget_customizations.action_buttons IS 'Array of action buttons {label, message} for agent_card template';
COMMENT ON COLUMN public.widget_customizations.show_status_indicator IS 'Whether to show online status indicator';
COMMENT ON COLUMN public.widget_customizations.status_text IS 'Custom status text (e.g., Online agora)';

