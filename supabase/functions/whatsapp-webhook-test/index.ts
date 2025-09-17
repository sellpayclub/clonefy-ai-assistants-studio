import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EvolutionWebhookData {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
      };
      imageMessage?: {
        url: string;
        caption?: string;
      };
      documentMessage?: {
        url: string;
        fileName: string;
        mimetype: string;
      };
    };
    messageTimestamp?: number;
    pushName?: string;
    status?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 WhatsApp Webhook Test - Processando webhook...');
    
    const webhookData: EvolutionWebhookData = await req.json();
    console.log('📥 Dados recebidos:', JSON.stringify(webhookData, null, 2));

    // Filtrar apenas eventos de mensagem
    if (webhookData.event !== 'messages.upsert') {
      console.log('⏭️ Evento ignorado:', webhookData.event);
      return new Response('Event ignored', { status: 200, headers: corsHeaders });
    }

    const instanceName = webhookData.instance;
    const messageData = webhookData.data;
    const contactNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const isFromOwner = messageData.key.fromMe;
    const contactName = messageData.pushName || 'Usuário';

    console.log(`📱 Instância: ${instanceName}, Contato: ${contactNumber}, Proprietário: ${isFromOwner}`);

    // 1. Buscar configuração da instância (modo simplificado para teste)
    let instanceConfig = {
      assistant_id: 'b67f3911-3f02-4eed-9a50-0e1e391c929f', // DR CRISTINA
      user_id: null,
      evolution_api_url: 'https://evolutionapi.clonefyia.com',
      evolution_api_key: '94805bfbb25f77f37a029f5a3dbfe62b',
      delay_seconds: 13,
      pause_minutes: 15
    };

    // Tentar buscar configuração real se existir
    try {
      const { data: realConfig } = await supabase
        .from('whatsapp_test_controls')
        .select('*')
        .eq('instance_name', instanceName)
        .eq('is_active', true)
        .single();
      
      if (realConfig) {
        instanceConfig = realConfig;
        console.log('✅ Configuração da instância encontrada:', instanceConfig);
      } else {
        console.log('⚠️ Usando configuração padrão para teste');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar configuração, usando padrão:', error);
    }

    // 2. Se for mensagem do proprietário, pausar conversa
    if (isFromOwner) {
      console.log('👤 Mensagem do proprietário - pausando conversa...');
      
      const pauseUntil = new Date();
      pauseUntil.setMinutes(pauseUntil.getMinutes() + instanceConfig.pause_minutes);

      await supabase
        .from('whatsapp_test_conversations')
        .upsert({
          instance_name: instanceName,
          contact_number: contactNumber,
          contact_name: contactName,
          assistant_id: instanceConfig.assistant_id,
          user_id: instanceConfig.user_id,
          is_paused: true,
          paused_until: pauseUntil.toISOString(),
          last_owner_message_at: new Date().toISOString()
        }, {
          onConflict: 'instance_name,contact_number',
          ignoreDuplicates: false
        });

      console.log(`⏸️ Conversa pausada até: ${pauseUntil.toISOString()}`);
      return new Response('Owner message - conversation paused', { status: 200, headers: corsHeaders });
    }

    // 3. Verificar se conversa está pausada
    const { data: conversation } = await supabase
      .from('whatsapp_test_conversations')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('contact_number', contactNumber)
      .single();

    if (conversation?.is_paused && conversation.paused_until) {
      const pausedUntil = new Date(conversation.paused_until);
      if (pausedUntil > new Date()) {
        console.log('⏸️ Conversa ainda pausada até:', pausedUntil.toISOString());
        return new Response('Conversation is paused', { status: 200, headers: corsHeaders });
      } else {
        // Despausar conversa
        await supabase
          .from('whatsapp_test_conversations')
          .update({ is_paused: false, paused_until: null })
          .eq('instance_name', instanceName)
          .eq('contact_number', contactNumber);
        console.log('▶️ Conversa despausada automaticamente');
      }
    }

    // 4. Extrair conteúdo da mensagem
    let messageContent = '';
    let messageType = 'text';
    let mediaUrl = '';

    if (messageData.message?.conversation) {
      messageContent = messageData.message.conversation;
      messageType = 'text';
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageContent = messageData.message.extendedTextMessage.text;
      messageType = 'text';
    } else if (messageData.message?.audioMessage) {
      messageType = 'audio';
      mediaUrl = messageData.message.audioMessage.url || '';
      // TODO: Implementar transcrição de áudio via OpenAI Whisper
      messageContent = '[Áudio recebido - transcrição em desenvolvimento]';
    } else if (messageData.message?.imageMessage) {
      messageType = 'image';
      mediaUrl = messageData.message.imageMessage.url || '';
      messageContent = messageData.message.imageMessage.caption || '[Imagem recebida - análise em desenvolvimento]';
    } else if (messageData.message?.documentMessage) {
      messageType = 'document';
      mediaUrl = messageData.message.documentMessage.url || '';
      messageContent = `[Documento: ${messageData.message.documentMessage.fileName || 'arquivo'}]`;
    }

    if (!messageContent) {
      console.log('❌ Conteúdo da mensagem não identificado');
      return new Response('No message content', { status: 400, headers: corsHeaders });
    }

    console.log(`💬 Mensagem extraída - Tipo: ${messageType}, Conteúdo: ${messageContent}`);

    // 5. Salvar mensagem na fila de processamento
    const processAt = new Date();
    processAt.setSeconds(processAt.getSeconds() + instanceConfig.delay_seconds);

    const { data: queueItem, error: queueError } = await supabase
      .from('whatsapp_test_queue')
      .insert({
        instance_name: instanceName,
        contact_number: contactNumber,
        messages: [JSON.stringify({
          type: messageType,
          content: messageContent,
          mediaUrl: mediaUrl,
          timestamp: Date.now()
        })],
        process_at: processAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('❌ Erro ao salvar na fila:', queueError);
      throw queueError;
    }

    console.log(`⏰ Mensagem adicionada à fila, processamento em: ${processAt.toISOString()}`);

    // 6. Processar fila após delay (usando setTimeout)
    setTimeout(async () => {
      await processMessageQueue(queueItem.id, instanceConfig);
    }, instanceConfig.delay_seconds * 1000);

    return new Response(JSON.stringify({ 
      status: 'received',
      queueId: queueItem.id,
      processAt: processAt.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessageQueue(queueId: string, instanceConfig: any) {
  try {
    console.log(`🔄 Processando fila: ${queueId}`);

    // Buscar item da fila
    const { data: queueItem, error: queueError } = await supabase
      .from('whatsapp_test_queue')
      .select('*')
      .eq('id', queueId)
      .eq('status', 'pending')
      .single();

    if (queueError || !queueItem) {
      console.log('❌ Item da fila não encontrado ou já processado');
      return;
    }

    // Marcar como processando
    await supabase
      .from('whatsapp_test_queue')
      .update({ status: 'processing' })
      .eq('id', queueId);

    // Buscar ou criar conversa
    let { data: conversation } = await supabase
      .from('whatsapp_test_conversations')
      .select('*')
      .eq('instance_name', queueItem.instance_name)
      .eq('contact_number', queueItem.contact_number)
      .single();

    if (!conversation) {
      // Criar nova conversa
      const { data: newConversation, error: createError } = await supabase
        .from('whatsapp_test_conversations')
        .insert({
          instance_name: queueItem.instance_name,
          contact_number: queueItem.contact_number,
          contact_name: 'Usuário',
          assistant_id: instanceConfig.assistant_id,
          user_id: instanceConfig.user_id
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      conversation = newConversation;
    }

    // Juntar todas as mensagens da fila
    const allMessages = queueItem.messages.map((msg: string) => JSON.parse(msg));
    const combinedMessage = allMessages.map((msg: any) => msg.content).join('\n');

    console.log(`📝 Mensagem combinada: ${combinedMessage}`);

    // Buscar assistente
    const { data: assistant } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', instanceConfig.assistant_id)
      .single();

    if (!assistant) {
      throw new Error('Assistente não encontrado');
    }

    // Criar ou buscar thread do OpenAI
    let threadId = conversation.openai_thread_id;
    
    if (!threadId) {
      // Criar nova thread
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        throw new Error('Erro ao criar thread OpenAI');
      }

      const threadData = await threadResponse.json();
      threadId = threadData.id;

      // Salvar thread ID
      await supabase
        .from('whatsapp_test_conversations')
        .update({ openai_thread_id: threadId })
        .eq('id', conversation.id);

      console.log(`🆕 Nova thread criada: ${threadId}`);
    }

    // Adicionar mensagem à thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: combinedMessage
      })
    });

    // Executar assistente
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistant.openai_assistant_id
      })
    });

    if (!runResponse.ok) {
      throw new Error('Erro ao executar assistente');
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    console.log(`🤖 Assistente executando - Run ID: ${runId}`);

    // Aguardar conclusão do run (polling)
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos timeout

    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;

      console.log(`⏳ Status do run: ${runStatus} (tentativa ${attempts})`);

      if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
        throw new Error(`Assistente falhou: ${runStatus}`);
      }
    }

    if (runStatus !== 'completed') {
      throw new Error('Timeout na execução do assistente');
    }

    // Buscar resposta do assistente
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=1`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data[0];
    
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('Resposta do assistente não encontrada');
    }

    const assistantResponse = assistantMessage.content[0].text.value;
    console.log(`🤖 Resposta do assistente: ${assistantResponse}`);

    // Quebrar resposta em mensagens humanizadas
    const messageChunks = breakMessageIntoChunks(assistantResponse);
    
    // SIMULAÇÃO: Log das mensagens que seriam enviadas (substituindo envio real)
    console.log('📨 SIMULAÇÃO - Mensagens que seriam enviadas via Evolution API:');
    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i];
      console.log(`📩 Mensagem ${i + 1}/${messageChunks.length}: ${chunk}`);
      
      // Simular envio - apenas para teste
      console.log(`📊 URL: ${instanceConfig.evolution_api_url}/message/sendText/${queueItem.instance_name}`);
      console.log(`📊 Número: ${queueItem.contact_number}`);
      console.log(`📊 Texto: ${chunk}`);
      
      // Delay entre mensagens para parecer mais humano
      if (i < messageChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo para teste
      }
    }
    
    console.log('✅ Todas as mensagens foram simuladas com sucesso');

    // Salvar no histórico
    await supabase
      .from('whatsapp_test_messages')
      .insert({
        conversation_id: conversation.id,
        instance_name: queueItem.instance_name,
        contact_number: queueItem.contact_number,
        message_type: 'text',
        message_content: combinedMessage,
        is_from_owner: false,
        processed: true,
        ai_response: assistantResponse
      });

    // Marcar fila como processada
    await supabase
      .from('whatsapp_test_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueId);

    console.log('✅ Processamento da fila concluído com sucesso');

  } catch (error) {
    console.error('❌ Erro no processamento da fila:', error);
    
    // Marcar como falhou
    await supabase
      .from('whatsapp_test_queue')
      .update({ 
        status: 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueId);
  }
}

function breakMessageIntoChunks(message: string): string[] {
  const maxLength = 300; // Tamanho máximo de cada chunk
  const chunks: string[] = [];
  
  // Dividir por parágrafos primeiro
  const paragraphs = message.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph.trim());
    } else {
      // Dividir parágrafo longo por frases
      const sentences = paragraph.split(/[.!?]+/);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        const sentenceWithPunct = trimmedSentence + (sentence.match(/[.!?]/) ? '' : '.');
        
        if ((currentChunk + ' ' + sentenceWithPunct).length <= maxLength) {
          currentChunk = currentChunk ? currentChunk + ' ' + sentenceWithPunct : sentenceWithPunct;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = sentenceWithPunct;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }
  
  // Se não conseguiu dividir, força divisão por tamanho
  if (chunks.length === 0) {
    for (let i = 0; i < message.length; i += maxLength) {
      chunks.push(message.substring(i, i + maxLength));
    }
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}