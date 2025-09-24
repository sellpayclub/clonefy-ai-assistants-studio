import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { 
      assistantId, 
      action, 
      sessionId,
      conversationId,
      visitorIp,
      userAgent,
      messagesCount 
    } = await req.json();

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
        // Registrar nova sessão
        const { data: session, error: sessionError } = await supabase
          .from('widget_sessions')
          .insert({
            session_id: sessionId,
            assistant_id: assistantId,
            user_id: userId,
            conversation_id: conversationId || null,
            visitor_ip: visitorIp || null,
            user_agent: userAgent || null,
            messages_count: 0
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Erro ao criar sessão:', sessionError);
        }

        // Atualizar analytics diários - incrementar visitantes únicos
        await supabase
          .from('widget_analytics')
          .upsert({
            assistant_id: assistantId,
            user_id: userId,
            date: today,
            unique_visitors: 1
          }, {
            onConflict: 'assistant_id,date'
          });

        break;

      case 'end_session':
        // Atualizar sessão com fim e contagem de mensagens
        const { error: endSessionError } = await supabase
          .from('widget_sessions')
          .update({
            end_time: new Date().toISOString(),
            messages_count: messagesCount || 0
          })
          .eq('session_id', sessionId)
          .eq('assistant_id', assistantId);

        if (endSessionError) {
          console.error('Erro ao finalizar sessão:', endSessionError);
        }

        break;

      case 'new_conversation':
        // Incrementar conversas do dia
        const { error: convError } = await supabase
          .rpc('increment_daily_stat', {
            p_assistant_id: assistantId,
            p_user_id: userId,
            p_date: today,
            p_field: 'total_conversations',
            p_increment: 1
          });

        if (convError) {
          console.error('Erro ao incrementar conversas:', convError);
          // Fallback manual se a função RPC não existir
          await supabase
            .from('widget_analytics')
            .upsert({
              assistant_id: assistantId,
              user_id: userId,
              date: today,
              total_conversations: 1
            }, {
              onConflict: 'assistant_id,date'
            });
        }

        break;

      case 'new_message':
        const { messageType } = await req.json();
        
        // Incrementar mensagens totais
        await supabase
          .from('widget_analytics')
          .upsert({
            assistant_id: assistantId,
            user_id: userId,
            date: today,
            total_messages: 1,
            total_user_messages: messageType === 'user' ? 1 : 0,
            total_bot_messages: messageType === 'assistant' ? 1 : 0
          }, {
            onConflict: 'assistant_id,date'
          });

        // Atualizar contagem na sessão
        if (sessionId) {
          await supabase
            .rpc('increment_session_messages', {
              p_session_id: sessionId,
              p_assistant_id: assistantId
            });
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
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});