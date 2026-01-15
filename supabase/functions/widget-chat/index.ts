import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Atualiza métricas de analytics em tempo real para o Widget
 */
async function updateAnalytics(assistantId: string, userId: string, type: 'user' | 'assistant' | 'conversation' | 'visitor') {
  if (!assistantId || !userId) return;

  const today = new Date().toISOString().split('T')[0];
  console.log(`📊 [Widget] Atualizando analytics: ${type} para assistente ${assistantId}`);

  try {
    // Tentar buscar registro hoje
    const { data: analytics, error: fetchError } = await supabase
      .from('widget_analytics')
      .select('*')
      .eq('assistant_id', assistantId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ [Widget] Erro ao buscar analytics:', fetchError);
      return;
    }

    if (!analytics) {
      // Criar novo registro para hoje
      const { error: insertError } = await supabase
        .from('widget_analytics')
        .insert({
          assistant_id: assistantId,
          user_id: userId,
          date: today,
          unique_visitors: type === 'visitor' ? 1 : 0,
          total_conversations: type === 'conversation' ? 1 : 0,
          total_messages: (type === 'user' || type === 'assistant') ? 1 : 0,
          total_user_messages: type === 'user' ? 1 : 0,
          total_bot_messages: type === 'assistant' ? 1 : 0
        });

      if (insertError) console.error('❌ [Widget] Erro ao criar analytics:', insertError);
    } else {
      // Atualizar existente
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (type === 'visitor') update.unique_visitors = (analytics.unique_visitors || 0) + 1;
      if (type === 'conversation') update.total_conversations = (analytics.total_conversations || 0) + 1;
      if (type === 'user' || type === 'assistant') {
        update.total_messages = (analytics.total_messages || 0) + 1;
        if (type === 'user') update.total_user_messages = (analytics.total_user_messages || 0) + 1;
        if (type === 'assistant') update.total_bot_messages = (analytics.total_bot_messages || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('widget_analytics')
        .update(update)
        .eq('id', analytics.id);

      if (updateError) console.error('❌ [Widget] Erro ao atualizar analytics:', updateError);
    }
  } catch (err) {
    console.error('❌ [Widget] Erro global no updateAnalytics:', err);
  }
}

/**
 * Processa a conversa para extrair informações do Lead para o CRM (Widget)
 */
async function processCRMLead(
  assistantId: string,
  userId: string,
  widgetSessionId: string,
  conversation: string,
  apiKey: string
) {
  if (!assistantId || !userId || !apiKey) return;

  try {
    console.log('🧠 [Widget] Extraindo dados do lead via IA...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo rápido e barato para extração
        messages: [
          {
            role: 'system',
            content: `Você é um analista de CRM. Sua tarefa é extrair informações de uma conversa de chat do site.
            Retorne APENAS um JSON plano com as seguintes chaves:
            - name: Nome do cliente (se identificado, senão deixe null)
            - email: Email do cliente (se identificado, senão deixe null)
            - lead_score: Um número de 0 a 100 baseado no interesse de compra (0=curioso, 100=pronto para comprar)
            - intent_summary: Um resumo de 1 frase do que o cliente quer.`
          },
          {
            role: 'user',
            content: `Conversa:\n${conversation}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error('Falha na extração GPT');

    const data = await response.json();
    const profiling = JSON.parse(data.choices[0].message.content);

    console.log('📊 [Widget] Dados extraídos p/ CRM:', profiling);

    // Upsert na tabela crm_leads
    // Procurar lead existente pelo session ID do widget
    const { data: existingLead } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('user_id', userId)
      .eq('whatsapp_number', widgetSessionId)
      .maybeSingle();

    const leadData: Record<string, unknown> = {
      user_id: userId,
      assistant_id: assistantId,
      whatsapp_number: widgetSessionId, // Usamos este campo para armazenar o ID da sessão do widget
      source: 'widget', // Novo campo para identificar a origem
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (profiling.name) leadData.name = profiling.name;
    if (profiling.email) leadData.email = profiling.email;
    if (profiling.lead_score !== undefined) leadData.lead_score = profiling.lead_score;
    if (profiling.intent_summary) leadData.intent_summary = profiling.intent_summary;

    if (existingLead) {
      console.log('📝 [Widget] Atualizando lead existente no CRM...');
      await supabase
        .from('crm_leads')
        .update(leadData)
        .eq('id', existingLead.id);
    } else {
      console.log('🆕 [Widget] Criando novo lead no CRM...');
      await supabase
        .from('crm_leads')
        .insert(leadData);
    }

    console.log('✅ [Widget] Lead processado com sucesso no CRM!');

  } catch (err) {
    console.error('⚠️ [Widget] Falha no profiling/CRM:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, agentId, message, conversationId } = await req.json();

    console.log(`Widget Chat API - Action: ${action}, Agent: ${agentId}`);

    if (action === 'get_agent') {
      // Get agent information for widget initialization - optimized query
      const { data: agent, error } = await supabase
        .from('assistants')
        .select('id, name, description, openai_assistant_id')
        .eq('id', agentId)
        .eq('is_active', true)
        .single();

      if (error || !agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ agent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send_message') {
      // Get agent details with optimized query
      const { data: agent, error: agentError } = await supabase
        .from('assistants')
        .select('id, name, openai_assistant_id, user_id')
        .eq('id', agentId)
        .eq('is_active', true)
        .single();

      if (agentError || !agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create or get conversation
      let currentConversationId = conversationId;
      let threadId = '';
      let isNewConversation = false;

      if (!currentConversationId) {
        isNewConversation = true;

        // Create OpenAI thread first (parallel optimization)
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        if (!threadResponse.ok) {
          const errorData = await threadResponse.json().catch(() => ({}));
          throw new Error(`Failed to create OpenAI thread: ${errorData.error?.message || threadResponse.statusText}`);
        }

        const thread = await threadResponse.json();
        if (!thread.id) {
          throw new Error('OpenAI thread creation failed: no thread ID returned');
        }
        threadId = thread.id;

        // Create new conversation with thread ID already included
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            assistant_id: agentId,
            user_id: agent.user_id,
            title: `Widget Chat - ${new Date().toLocaleString()}`,
            openai_thread_id: threadId,
            whatsapp_contact: 'widget_user'
          })
          .select()
          .single();

        if (convError) {
          throw new Error('Failed to create conversation');
        }

        currentConversationId = newConversation.id;

        // 📊 Analytics: Registrar nova conversa e novo visitante
        updateAnalytics(agentId, agent.user_id, 'conversation').catch(e => console.error('Analytics error:', e));
        updateAnalytics(agentId, agent.user_id, 'visitor').catch(e => console.error('Analytics error:', e));

      } else {
        // Get existing thread ID
        const { data: conversation, error: convFetchError } = await supabase
          .from('conversations')
          .select('openai_thread_id')
          .eq('id', currentConversationId)
          .single();

        if (convFetchError || !conversation) {
          throw new Error('Conversation not found');
        }

        threadId = conversation?.openai_thread_id;
        if (!threadId) {
          throw new Error('Thread ID not found for conversation');
        }
      }

      // 📊 Analytics: Registrar mensagem do usuário
      updateAnalytics(agentId, agent.user_id, 'user').catch(e => console.error('Analytics error:', e));

      // Parallel operations for better performance
      const [messageResponse, dbInsertResponse] = await Promise.all([
        // Add user message to OpenAI thread
        fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: 'user',
            content: message
          }),
        }),
        // Save user message to database
        supabase.from('messages').insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message
        })
      ]);

      // Run the assistant immediately after message is added
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: agent.openai_assistant_id
        }),
      });

      if (!runResponse.ok) {
        const errorData = await runResponse.json().catch(() => ({}));
        throw new Error(`Failed to create OpenAI run: ${errorData.error?.message || runResponse.statusText}`);
      }

      const run = await runResponse.json();
      if (!run.id || !run.status) {
        throw new Error('Invalid run response from OpenAI');
      }

      // Optimized polling with tool call handling
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 60; // Increased attempts but shorter intervals
      const pollInterval = 300; // Ainda mais rápido - 300ms para melhor experiência

      while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
        if (attempts >= maxAttempts) {
          throw new Error('Assistant response timeout - a resposta está demorando mais que o esperado');
        }

        if (runStatus === 'requires_action') {
          // Get the full run data to access required_action
          const fullRunResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            },
          });

          const fullRunData = await fullRunResponse.json();
          const requiredAction = fullRunData.required_action;

          if (requiredAction && requiredAction.type === 'submit_tool_outputs') {
            console.log('Processing tool calls for widget...');

            for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
              if (toolCall.type === 'function') {
                const functionName = toolCall.function.name;
                if (['check_availability', 'create_appointment', 'list_appointments', 'cancel_appointment', 'reschedule_appointment', 'update_appointment'].includes(functionName)) {
                  console.log(`Widget calling calendar function: ${functionName}`);

                  // Call our calendar proxy to handle the function call
                  const proxyResponse = await supabase.functions.invoke('chat-proxy', {
                    body: {
                      action: 'tool_call',
                      run_id: run.id,
                      thread_id: threadId,
                      tool_call_id: toolCall.id,
                      function_name: functionName,
                      arguments: toolCall.function.arguments
                    }
                  });

                  if (proxyResponse.error) {
                    console.error(`Error calling calendar function: ${proxyResponse.error.message}`);
                  } else {
                    console.log('Calendar function called successfully');
                  }

                  // The proxy handles the tool output submission, so we continue
                  break;
                }
              }
            }
          }
        }

        // Shorter wait time for faster responses
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;

        // Log progress para debugging - reduzindo logs
        if (attempts % 6 === 0) { // Log a cada ~1.8 segundos
          console.log(`Assistant processing... Status: ${runStatus}, Attempt: ${attempts}`);
        }
      }

      if (runStatus === 'completed') {
        // Get the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=1`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        if (!messagesResponse.ok) {
          throw new Error('Failed to fetch assistant response');
        }

        const messagesData = await messagesResponse.json();
        if (!messagesData.data || messagesData.data.length === 0) {
          throw new Error('No messages found in response');
        }

        const assistantMessage = messagesData.data[0];
        if (!assistantMessage.content || assistantMessage.content.length === 0) {
          throw new Error('Empty message content from assistant');
        }

        // Retornar resposta imediatamente sem aguardar save no DB
        const responseText = assistantMessage.content[0]?.text?.value;
        if (!responseText) {
          throw new Error('Invalid message format from assistant');
        }

        // 📊 Analytics: Registrar mensagem do assistente
        updateAnalytics(agentId, agent.user_id, 'assistant').catch(e => console.error('Analytics error:', e));

        // Background save - não bloquear resposta (sem catch)
        supabase.from('messages').insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: responseText,
          openai_message_id: assistantMessage.id
        }).then(() => {
          console.log('Assistant message saved to database');
        });

        // 🧠 CRM: Processar lead em background (não bloqueia resposta)
        console.log('📈 [Widget] Iniciando Profiling de Lead para o CRM...');
        processCRMLead(
          agentId,
          agent.user_id,
          `widget_${currentConversationId}`, // ID único da sessão do widget
          `Usuário: ${message}\nAssistente: ${responseText}`,
          openAIApiKey!
        ).catch(e => console.error('❌ [Widget] Erro no background profiling:', e));

        return new Response(JSON.stringify({
          response: responseText,
          conversationId: currentConversationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(`Assistant run failed with status: ${runStatus}`);
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in widget-chat function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});