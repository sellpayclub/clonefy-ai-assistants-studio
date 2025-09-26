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
    const body = await req.json();
    const { 
      assistantId, 
      action, 
      sessionId,
      conversationId,
      visitorIp,
      userAgent
    } = body;

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

    // Buscar o user_id do assistente
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error('Erro ao buscar assistente:', assistantError);
      return new Response(
        JSON.stringify({ error: 'Assistente não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = assistant.user_id;
    const today = new Date().toISOString().split('T')[0];

    switch (action) {
      case 'start_session':
        console.log('Iniciando sessão:', { sessionId, assistantId });
        
        // Registrar nova sessão
        const { error: sessionError } = await supabase
          .from('widget_sessions')
          .insert({
            session_id: sessionId,
            assistant_id: assistantId,
            user_id: userId,
            conversation_id: conversationId || null,
            visitor_ip: visitorIp || null,
            user_agent: userAgent || null,
            messages_count: 0
          });

        if (sessionError) {
          console.error('Erro ao criar sessão:', sessionError);
        }

        // Incrementar visitantes únicos do dia
        const { data: existingAnalytics } = await supabase
          .from('widget_analytics')
          .select('*')
          .eq('assistant_id', assistantId)
          .eq('date', today)
          .single();

        if (existingAnalytics) {
          await supabase
            .from('widget_analytics')
            .update({
              unique_visitors: existingAnalytics.unique_visitors + 1,
              updated_at: new Date().toISOString()
            })
            .eq('assistant_id', assistantId)
            .eq('date', today);
        } else {
          await supabase
            .from('widget_analytics')
            .insert({
              assistant_id: assistantId,
              user_id: userId,
              date: today,
              unique_visitors: 1,
              total_conversations: 0,
              total_messages: 0,
              total_user_messages: 0,
              total_bot_messages: 0
            });
        }

        break;

      case 'end_session':
        console.log('Finalizando sessão:', { sessionId });
        
        // Atualizar sessão com fim
        const { error: endSessionError } = await supabase
          .from('widget_sessions')
          .update({
            end_time: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('assistant_id', assistantId);

        if (endSessionError) {
          console.error('Erro ao finalizar sessão:', endSessionError);
        }

        break;

      case 'new_conversation':
        console.log('Nova conversa:', { conversationId, assistantId });
        
        // Incrementar conversas do dia
        const { data: convAnalytics } = await supabase
          .from('widget_analytics')
          .select('*')
          .eq('assistant_id', assistantId)
          .eq('date', today)
          .single();

        if (convAnalytics) {
          await supabase
            .from('widget_analytics')
            .update({
              total_conversations: convAnalytics.total_conversations + 1,
              updated_at: new Date().toISOString()
            })
            .eq('assistant_id', assistantId)
            .eq('date', today);
        } else {
          await supabase
            .from('widget_analytics')
            .insert({
              assistant_id: assistantId,
              user_id: userId,
              date: today,
              unique_visitors: 0,
              total_conversations: 1,
              total_messages: 0,
              total_user_messages: 0,
              total_bot_messages: 0
            });
        }

        break;

      case 'new_message':
        const messageType = body.messageType || 'user';
        console.log('Nova mensagem:', { messageType, assistantId });
        
        // Incrementar mensagens do dia
        const { data: msgAnalytics } = await supabase
          .from('widget_analytics')
          .select('*')
          .eq('assistant_id', assistantId)
          .eq('date', today)
          .single();

        if (msgAnalytics) {
          await supabase
            .from('widget_analytics')
            .update({
              total_messages: msgAnalytics.total_messages + 1,
              total_user_messages: msgAnalytics.total_user_messages + (messageType === 'user' ? 1 : 0),
              total_bot_messages: msgAnalytics.total_bot_messages + (messageType === 'assistant' ? 1 : 0),
              updated_at: new Date().toISOString()
            })
            .eq('assistant_id', assistantId)
            .eq('date', today);
        } else {
          await supabase
            .from('widget_analytics')
            .insert({
              assistant_id: assistantId,
              user_id: userId,
              date: today,
              unique_visitors: 0,
              total_conversations: 0,
              total_messages: 1,
              total_user_messages: messageType === 'user' ? 1 : 0,
              total_bot_messages: messageType === 'assistant' ? 1 : 0
            });
        }

        // Atualizar contagem na sessão se existir
        if (sessionId) {
          const { data: sessionData } = await supabase
            .from('widget_sessions')
            .select('messages_count')
            .eq('session_id', sessionId)
            .eq('assistant_id', assistantId)
            .single();

          if (sessionData) {
            await supabase
              .from('widget_sessions')
              .update({
                messages_count: sessionData.messages_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
              .eq('assistant_id', assistantId);
          }
        }

        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na função widget-analytics:', error);
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