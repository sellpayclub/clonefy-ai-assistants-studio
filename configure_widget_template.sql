-- Configurar o assistente 7a218984-6ada-4581-b1b6-2119b4771260 para usar "Card do Agente"
-- Inserir ou atualizar a configuração do widget

INSERT INTO widget_customizations (
  assistant_id,
  widget_name,
  widget_template,
  bubble_message,
  show_status_indicator,
  status_text,
  action_buttons,
  quick_questions,
  primary_color,
  secondary_color,
  text_color,
  button_position,
  is_active,
  welcome_message
)
VALUES (
  '7a218984-6ada-4581-b1b6-2119b4771260',
  'Assistente Clonefy',
  'agent_card',
  'Oi! Como posso te ajudar?',
  true,
  'Online agora',
  '[
    {"label": "Falar com vendas", "message": "Quero falar sobre os planos"},
    {"label": "Suporte técnico", "message": "Preciso de ajuda técnica"},
    {"label": "Ver demonstração", "message": "Quero ver uma demo do sistema"}
  ]'::jsonb,
  '[]'::jsonb,
  '#0066cc',
  '#f8f9fa',
  '#333333',
  'right',
  true,
  'Olá! Eu sou o assistente virtual da Clonefy. Como posso te ajudar hoje?'
)
ON CONFLICT (assistant_id)
DO UPDATE SET
  widget_template = 'agent_card',
  show_status_indicator = true,
  status_text = 'Online agora',
  action_buttons = '[
    {"label": "Falar com vendas", "message": "Quero falar sobre os planos"},
    {"label": "Suporte técnico", "message": "Preciso de ajuda técnica"},
    {"label": "Ver demonstração", "message": "Quero ver uma demo do sistema"}
  ]'::jsonb,
  is_active = true,
  updated_at = NOW();

-- Verificar se foi aplicado
SELECT 
  assistant_id,
  widget_name,
  widget_template,
  show_status_indicator,
  status_text,
  action_buttons,
  is_active
FROM widget_customizations
WHERE assistant_id = '7a218984-6ada-4581-b1b6-2119b4771260';
