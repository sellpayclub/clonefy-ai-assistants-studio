import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseServiceKey } from '../_shared/openai-responses.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = getSupabaseServiceKey();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, run_id, thread_id, tool_call_id, function_name, arguments: functionArgs, ...data } = await req.json();
    
    console.log(`Chat API - Action: ${action}, Function: ${function_name}`);

    // Se for uma chamada de função de calendário, interceptar e adicionar assistant_id
    if (function_name && ['check_availability', 'create_appointment', 'list_appointments', 'cancel_appointment', 'reschedule_appointment', 'update_appointment'].includes(function_name)) {
      
      // Buscar o assistant_id através do thread_id
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('assistant_id')
        .eq('openai_thread_id', thread_id)
        .single();

      if (conversationError || !conversation) {
        console.error('Assistant not found for thread:', thread_id);
        return new Response(JSON.stringify({
          error: 'Assistant não encontrado para este thread'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const assistant_id = conversation.assistant_id;
      console.log(`Adding assistant_id ${assistant_id} to function call ${function_name}`);

      // Parsear os argumentos da função
      let parsedArgs;
      try {
        parsedArgs = typeof functionArgs === 'string' ? JSON.parse(functionArgs) : functionArgs;
      } catch (e) {
        parsedArgs = {};
      }

      // Adicionar assistant_id aos argumentos
      parsedArgs.assistant_id = assistant_id;

      // Chamar a edge function de gerenciamento de calendário
      const calendarResponse = await supabase.functions.invoke('calendar-management', {
        body: {
          action: function_name,
          ...parsedArgs
        }
      });

      let result;
      if (calendarResponse.error) {
        result = `Erro ao executar ${function_name}: ${calendarResponse.error.message}`;
      } else {
        result = JSON.stringify(calendarResponse.data);
      }

      // Responses API tool outputs are submitted by the caller. This proxy now
      // only executes the tool and returns its result.
      return new Response(JSON.stringify({
        success: true,
        call_id: tool_call_id,
        output: result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se não for uma função de calendário, passar para o endpoint original
    return new Response(JSON.stringify({ 
      error: 'Função não suportada por este proxy' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-proxy function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
