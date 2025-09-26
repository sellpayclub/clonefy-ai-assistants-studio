import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assistantId } = await req.json();

    if (!assistantId) {
      throw new Error('Assistant ID é obrigatório');
    }

    // Buscar o user_id do assistente
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError) throw assistantError;

    const userId = assistant.user_id;

    console.log(`Adicionando dados de exemplo para assistant: ${assistantId}, user: ${userId}`);

    // Gerar dados dos últimos 30 dias
    const today = new Date();
    const sampleData = [];
    const sampleSessions = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Gerar números aleatórios mais realistas
      const uniqueVisitors = Math.floor(Math.random() * 50) + 10; // 10-60 visitantes
      const totalConversations = Math.floor(uniqueVisitors * (0.1 + Math.random() * 0.4)); // 10-50% conversion
      const totalUserMessages = totalConversations * (2 + Math.floor(Math.random() * 5)); // 2-7 msgs por usuário
      const totalBotMessages = Math.floor(totalUserMessages * (0.8 + Math.random() * 0.4)); // 80-120% do usuário

      sampleData.push({
        assistant_id: assistantId,
        user_id: userId,
        date: dateStr,
        total_conversations: totalConversations,
        total_messages: totalUserMessages + totalBotMessages,
        total_user_messages: totalUserMessages,
        total_bot_messages: totalBotMessages,
        unique_visitors: uniqueVisitors,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Gerar algumas sessões de exemplo para esse dia
      for (let j = 0; j < totalConversations; j++) {
        const sessionStart = new Date(date);
        sessionStart.setHours(9 + Math.floor(Math.random() * 10)); // Entre 9h e 19h
        sessionStart.setMinutes(Math.floor(Math.random() * 60));

        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionStart.getMinutes() + 5 + Math.floor(Math.random() * 20)); // 5-25 min de duração

        const messagesCount = 2 + Math.floor(Math.random() * 8); // 2-10 mensagens por sessão

        sampleSessions.push({
          assistant_id: assistantId,
          user_id: userId,
          session_id: `session_${assistantId}_${i}_${j}`,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          messages_count: messagesCount,
          visitor_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Sample Data)',
          created_at: sessionStart.toISOString(),
          updated_at: sessionEnd.toISOString()
        });
      }
    }

    // Inserir dados de analytics
    const { error: analyticsError } = await supabase
      .from('widget_analytics')
      .upsert(sampleData, { 
        onConflict: 'assistant_id,date',
        ignoreDuplicates: false 
      });

    if (analyticsError) {
      console.error('Erro ao inserir analytics:', analyticsError);
      throw analyticsError;
    }

    // Inserir dados de sessões
    const { error: sessionsError } = await supabase
      .from('widget_sessions')
      .upsert(sampleSessions, { 
        onConflict: 'session_id',
        ignoreDuplicates: true 
      });

    if (sessionsError) {
      console.error('Erro ao inserir sessões:', sessionsError);
      throw sessionsError;
    }

    console.log(`Dados de exemplo adicionados: ${sampleData.length} dias de analytics, ${sampleSessions.length} sessões`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados de exemplo adicionados com sucesso',
        analytics_count: sampleData.length,
        sessions_count: sampleSessions.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});