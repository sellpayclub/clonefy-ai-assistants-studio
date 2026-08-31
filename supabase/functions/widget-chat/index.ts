import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import {
  createOpenAIConversation,
  getSupabaseServiceKey,
  isResponsesConversationId,
  runOpenAIResponse,
} from '../_shared/openai-responses.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = getSupabaseServiceKey();
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
 * Processa a conversa para extrair informações COMPLETAS do Lead para o CRM (Widget)
 * Agora busca todo o histórico da conversa e gera análise detalhada
 */
async function processCRMLead(
  assistantId: string,
  userId: string,
  widgetSessionId: string,
  conversationId: string,
  apiKey: string
) {
  if (!assistantId || !userId || !apiKey || !conversationId) return;

  try {
    console.log('🧠 [Widget] Buscando histórico completo da conversa...');

    // Buscar TODAS as mensagens da conversa (não só a última)
    const { data: allMessages, error: msgError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError || !allMessages || allMessages.length === 0) {
      console.log('⚠️ [Widget] Sem mensagens para processar');
      return;
    }

    // Formatar conversa completa
    const fullConversation = allMessages
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
      .join('\n\n');

    console.log(`🧠 [Widget] Extraindo dados do lead via IA (${allMessages.length} mensagens)...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que ajuda vendedores a entender melhor seus clientes. Analise a conversa e preencha as informações abaixo.

Retorne APENAS um JSON com as seguintes chaves:
{
  "name": "Nome do cliente (null se não foi dito)",
  "email": "Email do cliente (null se não foi dito)",
  "lead_score": número de 0 a 100 indicando o interesse real em comprar:
    - 0-20: Só curioso, sem intenção clara
    - 21-40: Interessado mas ainda pesquisando
    - 41-60: Interesse razoável, fazendo perguntas específicas
    - 61-80: Bem interessado, falando sobre preços ou detalhes
    - 81-100: Quer comprar, está quase decidido,
  "urgency_level": "baixa | média | alta | imediata",
  "sentiment": "positivo | neutro | negativo | misto",
  "intent_summary": "Em 2-3 frases simples, explique o que o cliente quer. Escreva como se estivesse contando para um colega: 'O cliente entrou em contato porque...'",
  "conversation_analysis": "Explique o que aconteceu na conversa de forma clara e direta. O que o cliente quer? Ele parece interessado? Tem alguma dúvida ou preocupação? O que o vendedor deve fazer agora? Escreva como se fosse um resumo para alguém que não leu a conversa. Use frases curtas e palavras simples.",
  "key_topics": ["assuntos", "que", "foram", "falados"],
  "customer_questions": ["perguntas", "que", "o", "cliente", "fez"],
  "objections": ["dúvidas", "preocupações", "ou", "resistências", "do", "cliente"],
  "products_mentioned": ["produtos", "ou", "serviços", "que", "apareceram", "na", "conversa"],
  "next_action": "Diga em uma frase curta o que o vendedor deve fazer agora. Seja direto: 'Ligar para confirmar interesse', 'Enviar o preço', 'Agendar uma demonstração', etc.",
  "pipeline_stage": "novo | contato feito | qualificado | proposta | negociacao | fechado | perdido - classifique baseado no estágio REAL da negociação: novo=primeiro contato, contato feito=já conversaram, qualificado=interesse real demonstrado, proposta=preço discutido, negociacao=comparando/pedindo desconto, fechado=compra confirmada, perdido=recusou ou sumiu"
}

Escreva tudo em linguagem simples e direta, fácil de entender. Como se fosse explicar para alguém que não é da área. Sem palavras difíceis ou termos técnicos.`
          },
          {
            role: 'user',
            content: `Conversa completa:\n\n${fullConversation}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error('Falha na extração GPT');

    const data = await response.json();
    const profiling = JSON.parse(data.choices[0].message.content);

    console.log('📊 [Widget] Dados COMPLETOS extraídos p/ CRM:', {
      name: profiling.name,
      score: profiling.lead_score,
      urgency: profiling.urgency_level,
      topics: profiling.key_topics?.length || 0
    });

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
      whatsapp_number: widgetSessionId,
      source: 'widget',
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Campos básicos
    if (profiling.name) leadData.name = profiling.name;
    if (profiling.email) leadData.email = profiling.email;
    if (profiling.lead_score !== undefined) leadData.lead_score = profiling.lead_score;
    if (profiling.intent_summary) leadData.intent_summary = profiling.intent_summary;

    // Novos campos de análise detalhada
    if (profiling.conversation_analysis) leadData.conversation_analysis = profiling.conversation_analysis;
    if (profiling.key_topics) leadData.key_topics = profiling.key_topics;
    if (profiling.customer_questions) leadData.customer_questions = profiling.customer_questions;
    if (profiling.objections) leadData.objections = profiling.objections;
    if (profiling.products_mentioned) leadData.products_mentioned = profiling.products_mentioned;
    if (profiling.urgency_level) leadData.urgency_level = profiling.urgency_level;
    if (profiling.next_action) leadData.next_action = profiling.next_action;
    if (profiling.sentiment) leadData.sentiment = profiling.sentiment;
    if (profiling.pipeline_stage) leadData.pipeline_stage = profiling.pipeline_stage;

    if (existingLead) {
      console.log('📝 [Widget] Atualizando lead existente no CRM com análise completa...');
      await supabase
        .from('crm_leads')
        .update(leadData)
        .eq('id', existingLead.id);
    } else {
      console.log('🆕 [Widget] Criando novo lead no CRM com análise completa...');
      await supabase
        .from('crm_leads')
        .insert(leadData);
    }

    console.log('✅ [Widget] Lead processado com análise COMPLETA no CRM!');

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

    if (action === 'upload_file') {
      // Handle file uploads from widget
      const { fileData, fileName, mimeType, conversationId: convId } = await req.json().then(r => r).catch(() => ({}));
      
      if (!fileData || !fileName || !agentId) {
        return new Response(JSON.stringify({ error: 'Missing file data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get agent info for user_id
      const { data: agent, error: agentError } = await supabase
        .from('assistants')
        .select('id, user_id')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = agent.user_id;
      const widgetSessionId = convId ? `widget_${convId}` : `widget_${Date.now()}`;

      // Determine file type
      const isImage = mimeType?.startsWith('image/');
      const fileType = isImage ? 'image' : 'document';

      // Convert base64 to bytes
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Find or create lead for this widget session
      let leadId: string | null = null;
      const { data: existingLead } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('user_id', userId)
        .eq('whatsapp_number', widgetSessionId)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        const { data: newLead } = await supabase
          .from('crm_leads')
          .insert({
            user_id: userId,
            assistant_id: agentId,
            whatsapp_number: widgetSessionId,
            source: 'widget',
            status: 'new',
            lead_score: 0
          })
          .select('id')
          .single();
        leadId = newLead?.id || null;
      }

      if (!leadId) {
        return new Response(JSON.stringify({ error: 'Could not create lead for attachment' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upload to storage
      const uniqueFileName = `${userId}/${leadId}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('lead-files')
        .upload(uniqueFileName, bytes, {
          contentType: mimeType || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(JSON.stringify({ error: 'Upload failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lead-files')
        .getPublicUrl(uniqueFileName);

      const fileUrl = urlData?.publicUrl;

      // Analyze image if applicable
      let aiDescription: string | null = null;
      if (isImage && openAIApiKey) {
        try {
          const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: 'Descreva esta imagem brevemente em português.' },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }],
              max_tokens: 150
            })
          });
          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            aiDescription = visionData.choices[0]?.message?.content || null;
          }
        } catch (e) {
          console.warn('Could not analyze image:', e);
        }
      }

      // Save attachment metadata
      await supabase
        .from('crm_lead_attachments')
        .insert({
          lead_id: leadId,
          user_id: userId,
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          mime_type: mimeType,
          file_size: bytes.length,
          source: 'widget',
          ai_description: aiDescription
        });

      console.log(`✅ Widget file uploaded: ${fileName}`);

      return new Response(JSON.stringify({
        success: true,
        fileUrl,
        fileType,
        fileName,
        aiDescription
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        .select('id, name, openai_assistant_id, user_id, instructions, model, tools, metadata')
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
      let liveChatSessionId: string | null = null;
      const widgetSessionId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (!currentConversationId) {
        isNewConversation = true;

        const thread = await createOpenAIConversation(openAIApiKey!, {
          assistant_id: agentId,
          channel: 'widget',
        });
        if (!thread.id) {
          throw new Error('OpenAI conversation creation failed: no ID returned');
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
        if (!isResponsesConversationId(threadId)) {
          const migrated = await createOpenAIConversation(openAIApiKey!, {
            assistant_id: agentId,
            channel: 'widget',
          });
          threadId = migrated.id;
          await supabase.from('conversations').update({ openai_thread_id: threadId }).eq('id', currentConversationId);
        }
      }

      // 📊 Analytics: Registrar mensagem do usuário
      updateAnalytics(agentId, agent.user_id, 'user').catch(e => console.error('Analytics error:', e));

      // 📺 LIVE CHAT: Salvar mensagem do cliente e gerenciar sessão
      let isHumanTakeover = false;
      try {
        // Buscar ou criar sessão para widget
        const { data: existingSession } = await supabase
          .from('live_chat_sessions')
          .select('id, status, human_takeover_until')
          .eq('user_id', agent.user_id)
          .eq('instance_name', 'widget')
          .eq('contact_number', currentConversationId)
          .maybeSingle();

        if (existingSession) {
          liveChatSessionId = existingSession.id;
          
          // 🛑 HUMAN TAKEOVER CHECK: Verificar se humano está atendendo
          if (existingSession.status === 'human_takeover' && existingSession.human_takeover_until) {
            const takeoverUntil = new Date(existingSession.human_takeover_until);
            if (takeoverUntil > new Date()) {
              isHumanTakeover = true;
              const remainingMinutes = Math.ceil((takeoverUntil.getTime() - Date.now()) / (1000 * 60));
              console.log(`⏸️ [Widget] HUMAN TAKEOVER ATIVO! IA pausada (${remainingMinutes} min restantes)`);
            } else {
              // Takeover expirou - resetar status
              console.log('✅ [Widget] Human Takeover expirado - IA voltando a responder');
              await supabase
                .from('live_chat_sessions')
                .update({ status: 'ai_active', human_takeover_until: null })
                .eq('id', existingSession.id);
            }
          }
          
          await supabase
            .from('live_chat_sessions')
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: message.substring(0, 100),
              last_sender_type: 'customer',
              unread_count: (existingSession as any).unread_count + 1 || 1
            })
            .eq('id', existingSession.id);
        } else {
          const { data: newSession } = await supabase
            .from('live_chat_sessions')
            .insert({
              user_id: agent.user_id,
              instance_name: 'widget',
              contact_number: currentConversationId,
              contact_name: 'Visitante Widget',
              source: 'widget',
              status: 'ai_active',
              assistant_id: agentId,
              assistant_name: agent.name,
              last_message_at: new Date().toISOString(),
              last_message_preview: message.substring(0, 100),
              last_sender_type: 'customer',
              unread_count: 1
            })
            .select('id')
            .single();
          
          liveChatSessionId = newSession?.id || null;
        }

        // Salvar mensagem do cliente (SEMPRE, mesmo em takeover)
        if (liveChatSessionId) {
          await supabase
            .from('live_chat_messages')
            .insert({
              user_id: agent.user_id,
              session_id: liveChatSessionId,
              instance_name: 'widget',
              contact_number: currentConversationId,
              contact_name: 'Visitante Widget',
              sender_type: 'customer',
              content: message,
              message_type: 'text',
              source: 'widget',
              assistant_id: agentId,
              assistant_name: agent.name
            });
        }
        console.log('📺 Widget Live Chat: Mensagem do cliente salva');
      } catch (liveChatError) {
        console.error('⚠️ Widget Live Chat error (non-blocking):', liveChatError);
      }

      // 🛑 Se humano está atendendo, NÃO chamar a IA - retornar sem resposta automática
      if (isHumanTakeover) {
        // Salvar mensagem do usuário no banco mas não gerar resposta IA
        await supabase.from('messages').insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message
        });
        
        return new Response(JSON.stringify({ 
          response: null, 
          conversationId: currentConversationId,
          humanTakeover: true,
          message: 'Um atendente humano está respondendo esta conversa'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
      });

      const result = await runOpenAIResponse({
        apiKey: openAIApiKey!,
        conversationId: threadId,
        assistant: agent,
        input: message,
        onToolCall: async (call) => {
          if (call.name.startsWith('agendify_')) {
            const actionMap: Record<string, string> = {
              agendify_list_services: 'list_services',
              agendify_list_professionals: 'list_professionals',
              agendify_check_availability: 'check_availability',
              agendify_create_appointment: 'create_appointment',
              agendify_cancel_appointment: 'cancel_appointment',
              agendify_list_appointments: 'list_appointments',
              agendify_search_clients: 'search_clients',
            };
            const response = await supabase.functions.invoke('agendify-proxy', {
              body: { action: actionMap[call.name], assistant_id: agentId, ...call.arguments },
            });
            if (response.error) throw response.error;
            return response.data;
          }

          const calendarFunctions = ['check_availability', 'create_appointment', 'list_appointments', 'cancel_appointment', 'reschedule_appointment', 'update_appointment'];
          if (!calendarFunctions.includes(call.name)) {
            return { success: false, error: `Ferramenta ${call.name} indisponível no widget.` };
          }
          const response = await supabase.functions.invoke('calendar-management', {
            body: { action: call.name, assistant_id: agentId, internal_user_id: agent.user_id, ...call.arguments },
          });
          if (response.error) throw response.error;
          return response.data;
        },
      });

      const responseText = result.text;
      updateAnalytics(agentId, agent.user_id, 'assistant').catch(e => console.error('Analytics error:', e));

      if (liveChatSessionId) {
        supabase.from('live_chat_messages').insert({
          user_id: agent.user_id,
          session_id: liveChatSessionId,
          instance_name: 'widget',
          contact_number: currentConversationId,
          contact_name: 'Visitante Widget',
          sender_type: 'ai',
          content: responseText,
          message_type: 'text',
          source: 'widget',
          assistant_id: agentId,
          assistant_name: agent.name,
        }).then(() => console.log('📺 Widget Live Chat: Resposta IA salva'));

        supabase.from('live_chat_sessions').update({
          last_message_at: new Date().toISOString(),
          last_message_preview: responseText.substring(0, 100),
          last_sender_type: 'ai',
        }).eq('id', liveChatSessionId).then(() => {});
      }

      supabase.from('messages').insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: responseText,
        openai_message_id: result.id,
      }).then(() => console.log('Assistant message saved to database'));

      processCRMLead(
        agentId,
        agent.user_id,
        `widget_${currentConversationId}`,
        currentConversationId,
        openAIApiKey!,
      ).catch(e => console.error('❌ [Widget] Erro no background profiling:', e));

      return new Response(JSON.stringify({
        response: responseText,
        conversationId: currentConversationId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
