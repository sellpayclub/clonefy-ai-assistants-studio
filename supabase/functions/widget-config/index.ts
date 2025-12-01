import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assistantId } = await req.json();

    if (!assistantId) {
      return new Response(
        JSON.stringify({ error: 'Assistant ID é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração do widget
    const { data: config, error: configError } = await supabase
      .from('widget_customizations')
      .select('*')
      .eq('assistant_id', assistantId)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('Erro ao buscar configuração:', configError);
    }

    // Buscar informações do assistente
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('name, description')
      .eq('id', assistantId)
      .eq('is_active', true)
      .maybeSingle();

    if (assistantError) {
      console.error('Erro ao buscar assistente:', assistantError);
    }

    // Retornar configuração padrão se não encontrar personalização
    const defaultConfig = {
      widget_name: assistant?.name || 'Assistente Virtual',
      avatar_url: '',
      button_icon_url: '',
      welcome_message: 'Olá! Como posso ajudar você hoje?',
      primary_color: '#0066cc',
      secondary_color: '#f8f9fa',
      text_color: '#333333',
      button_position: 'right',
      is_active: true,
      // PADRÃO ALTERADO: agent_card ao invés de classic
      widget_template: 'agent_card',
      bubble_message: 'Oi! Como posso te ajudar?',
      quick_questions: [],
      action_buttons: [],
      show_status_indicator: true,
      status_text: 'Online agora'
    };

    // Validar templates válidos
    const validTemplates = ['classic', 'bubble', 'agent_card', 'quick_questions'];
    const isValidTemplate = (template: any) =>
      template && typeof template === 'string' && validTemplates.includes(template);

    const finalConfig = config ? {
      widget_name: config.widget_name || defaultConfig.widget_name,
      avatar_url: config.avatar_url || defaultConfig.avatar_url,
      button_icon_url: config.button_icon_url || defaultConfig.button_icon_url,
      welcome_message: config.welcome_message || defaultConfig.welcome_message,
      primary_color: config.primary_color || defaultConfig.primary_color,
      secondary_color: config.secondary_color || defaultConfig.secondary_color,
      text_color: config.text_color || defaultConfig.text_color,
      button_position: config.button_position || defaultConfig.button_position,
      is_active: config.is_active !== false,
      // New template fields - usar valor do banco se for válido, senão usar default
      widget_template: isValidTemplate(config.widget_template)
        ? config.widget_template
        : defaultConfig.widget_template,
      bubble_message: config.bubble_message || defaultConfig.bubble_message,
      quick_questions: config.quick_questions || defaultConfig.quick_questions,
      action_buttons: config.action_buttons || defaultConfig.action_buttons,
      show_status_indicator: config.show_status_indicator !== false,
      status_text: config.status_text || defaultConfig.status_text
    } : defaultConfig;

    // Log detalhado para debug
    console.log('=== WIDGET CONFIG DEBUG ===');
    console.log('Assistant ID:', assistantId);
    console.log('Config exists in DB:', !!config);
    console.log('Widget Template from DB:', config?.widget_template, '(type:', typeof config?.widget_template, ')');
    console.log('Is Valid Template:', isValidTemplate(config?.widget_template));
    console.log('Final Widget Template:', finalConfig.widget_template);
    console.log('Bubble Message:', finalConfig.bubble_message);
    console.log('Action Buttons:', finalConfig.action_buttons);
    console.log('Quick Questions:', finalConfig.quick_questions);
    console.log('==========================');

    return new Response(
      JSON.stringify({
        success: true,
        config: finalConfig,
        assistant: {
          name: assistant?.name || 'Assistente Virtual',
          description: assistant?.description || ''
        },
        // Incluir timestamp para cache busting
        timestamp: Date.now()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Erro na função widget-config:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});