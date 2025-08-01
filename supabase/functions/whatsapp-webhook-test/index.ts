import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageTimestamp: number;
  pushName?: string;
  message?: {
    conversation?: string;
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
      fileName?: string;
    };
  };
  instance: string;
}

interface QueueMessage {
  messageId: string;
  content: string;
  type: string;
  mediaUrl?: string;
  timestamp: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WhatsApp Webhook Test - Início ===');
    
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Extrair dados da mensagem
    const message: WebhookMessage = body;
    const instanceName = message.instance;
    const contactNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
    const isFromOwner = message.key.fromMe;
    const messageId = message.key.id;
    const contactName = message.pushName || contactNumber;

    console.log(`Instância: ${instanceName}, Contato: ${contactNumber}, Do proprietário: ${isFromOwner}`);

    // Buscar configurações da instância
    const { data: controlData, error: controlError } = await supabase
      .from('whatsapp_test_controls')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('is_active', true)
      .single();

    if (controlError || !controlData) {
      console.log('Instância não configurada para teste:', instanceName);
      return new Response('OK', { headers: corsHeaders });
    }

    console.log('Configurações encontradas:', controlData);

    // Se for mensagem do proprietário, pausar a conversa
    if (isFromOwner) {
      console.log('Mensagem do proprietário - pausando conversa');
      await handleOwnerMessage(instanceName, contactNumber, controlData.pause_minutes);
      return new Response('OK', { headers: corsHeaders });
    }

    // Verificar se a conversa está pausada
    const isPaused = await checkIfConversationPaused(instanceName, contactNumber);
    if (isPaused) {
      console.log('Conversa pausada - ignorando mensagem');
      return new Response('OK', { headers: corsHeaders });
    }

    // Extrair conteúdo da mensagem
    const messageContent = await extractMessageContent(message);
    console.log('Conteúdo extraído:', messageContent);

    // Salvar mensagem na fila para processamento com delay
    await addToQueue(instanceName, contactNumber, {
      messageId,
      content: messageContent.text,
      type: messageContent.type,
      mediaUrl: messageContent.mediaUrl,
      timestamp: message.messageTimestamp
    }, controlData.delay_seconds);

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleOwnerMessage(instanceName: string, contactNumber: string, pauseMinutes: number) {
  const pauseUntil = new Date(Date.now() + pauseMinutes * 60 * 1000);
  
  await supabase
    .from('whatsapp_test_conversations')
    .upsert({
      instance_name: instanceName,
      contact_number: contactNumber,
      is_paused: true,
      paused_until: pauseUntil.toISOString(),
      last_owner_message_at: new Date().toISOString()
    }, {
      onConflict: 'instance_name,contact_number'
    });

  console.log(`Conversa pausada até: ${pauseUntil.toISOString()}`);
}

async function checkIfConversationPaused(instanceName: string, contactNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('whatsapp_test_conversations')
    .select('is_paused, paused_until')
    .eq('instance_name', instanceName)
    .eq('contact_number', contactNumber)
    .single();

  if (!data || !data.is_paused) return false;

  const now = new Date();
  const pausedUntil = new Date(data.paused_until);

  if (now > pausedUntil) {
    // Pausa expirou, reativar conversa
    await supabase
      .from('whatsapp_test_conversations')
      .update({ is_paused: false, paused_until: null })
      .eq('instance_name', instanceName)
      .eq('contact_number', contactNumber);
    
    return false;
  }

  return true;
}

async function extractMessageContent(message: WebhookMessage) {
  const msg = message.message;
  
  if (!msg) {
    return { text: '', type: 'unknown' };
  }

  // Texto simples
  if (msg.conversation) {
    return { text: msg.conversation, type: 'text' };
  }

  // Áudio
  if (msg.audioMessage) {
    console.log('Processando áudio...');
    const transcription = await transcribeAudio(msg.audioMessage.url);
    return { 
      text: transcription, 
      type: 'audio',
      mediaUrl: msg.audioMessage.url 
    };
  }

  // Imagem
  if (msg.imageMessage) {
    console.log('Processando imagem...');
    const description = await analyzeImage(msg.imageMessage.url, msg.imageMessage.caption);
    return { 
      text: description, 
      type: 'image',
      mediaUrl: msg.imageMessage.url 
    };
  }

  // Documento
  if (msg.documentMessage) {
    return { 
      text: `Documento enviado: ${msg.documentMessage.fileName || 'Arquivo'}`, 
      type: 'document',
      mediaUrl: msg.documentMessage.url 
    };
  }

  return { text: 'Tipo de mensagem não suportado', type: 'unknown' };
}

async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, 'audio.ogg');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    const result = await response.json();
    return result.text || 'Não foi possível transcrever o áudio';
  } catch (error) {
    console.error('Erro na transcrição:', error);
    return 'Erro ao transcrever áudio';
  }
}

async function analyzeImage(imageUrl: string, caption?: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: caption ? 
                  `Analise esta imagem e seu contexto. Legenda: "${caption}"` :
                  'Descreva esta imagem em detalhes'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 300
      }),
    });

    const result = await response.json();
    return result.choices[0]?.message?.content || 'Não foi possível analisar a imagem';
  } catch (error) {
    console.error('Erro na análise da imagem:', error);
    return caption || 'Imagem enviada';
  }
}

async function addToQueue(
  instanceName: string, 
  contactNumber: string, 
  message: QueueMessage, 
  delaySeconds: number
) {
  const processAt = new Date(Date.now() + delaySeconds * 1000);
  
  // Verificar se já existe item na fila para este contato
  const { data: existingQueue } = await supabase
    .from('whatsapp_test_queue')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('contact_number', contactNumber)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingQueue) {
    // Adicionar mensagem ao grupo existente
    const updatedMessages = [...(existingQueue.messages || []), message];
    
    await supabase
      .from('whatsapp_test_queue')
      .update({ 
        messages: updatedMessages,
        process_at: processAt.toISOString() // Resetar o timer
      })
      .eq('id', existingQueue.id);
      
    console.log('Mensagem adicionada ao grupo existente');
  } else {
    // Criar novo item na fila
    await supabase
      .from('whatsapp_test_queue')
      .insert({
        instance_name: instanceName,
        contact_number: contactNumber,
        messages: [message],
        process_at: processAt.toISOString(),
        status: 'pending'
      });
      
    console.log('Novo grupo criado na fila');
  }

  // Agendar processamento
  setTimeout(() => processQueue(instanceName, contactNumber), delaySeconds * 1000);
}

async function processQueue(instanceName: string, contactNumber: string) {
  console.log(`=== Processando fila para ${instanceName}/${contactNumber} ===`);
  
  try {
    // Buscar item da fila para processar
    const { data: queueItem } = await supabase
      .from('whatsapp_test_queue')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('contact_number', contactNumber)
      .eq('status', 'pending')
      .lte('process_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!queueItem) {
      console.log('Nenhum item na fila para processar');
      return;
    }

    // Marcar como processando
    await supabase
      .from('whatsapp_test_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    // Buscar configurações
    const { data: controlData } = await supabase
      .from('whatsapp_test_controls')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (!controlData) {
      throw new Error('Configurações não encontradas');
    }

    // Buscar ou criar conversa
    const conversation = await getOrCreateConversation(
      instanceName, 
      contactNumber, 
      controlData.assistant_id,
      controlData.user_id
    );

    // Agrupar mensagens em texto único
    const messages = queueItem.messages as QueueMessage[];
    const fullMessage = messages.map(m => m.content).join('\n');
    
    console.log('Mensagem completa:', fullMessage);

    // Salvar mensagens no histórico
    for (const msg of messages) {
      await supabase
        .from('whatsapp_test_messages')
        .insert({
          conversation_id: conversation.id,
          instance_name: instanceName,
          contact_number: contactNumber,
          message_id: msg.messageId,
          message_type: msg.type,
          message_content: msg.content,
          message_media_url: msg.mediaUrl,
          is_from_owner: false,
          processed: false
        });
    }

    // Enviar para OpenAI Assistant
    const aiResponse = await sendToAssistant(controlData.assistant_id, fullMessage, conversation.openai_thread_id);
    
    console.log('Resposta da IA:', aiResponse);

    // Quebrar resposta em partes humanizadas
    const messageParts = breakMessageIntoHumanParts(aiResponse, controlData.message_break_enabled);
    
    // Enviar respostas via Evolution API
    for (let i = 0; i < messageParts.length; i++) {
      await sendWhatsAppMessage(
        controlData.evolution_api_url,
        controlData.evolution_api_key,
        instanceName,
        contactNumber,
        messageParts[i]
      );
      
      // Delay entre mensagens para parecer humano
      if (i < messageParts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }
    }

    // Salvar resposta da IA
    await supabase
      .from('whatsapp_test_messages')
      .insert({
        conversation_id: conversation.id,
        instance_name: instanceName,
        contact_number: contactNumber,
        message_type: 'text',
        message_content: aiResponse,
        is_from_owner: false,
        processed: true,
        ai_response: aiResponse
      });

    // Marcar como concluído
    await supabase
      .from('whatsapp_test_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);

    console.log('Processamento concluído com sucesso');

  } catch (error) {
    console.error('Erro no processamento:', error);
    
    // Marcar como falha
    await supabase
      .from('whatsapp_test_queue')
      .update({ 
        status: 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName)
      .eq('contact_number', contactNumber)
      .eq('status', 'processing');
  }
}

async function getOrCreateConversation(
  instanceName: string, 
  contactNumber: string, 
  assistantId: string,
  userId: string
) {
  // Buscar conversa existente
  let { data: conversation } = await supabase
    .from('whatsapp_test_conversations')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('contact_number', contactNumber)
    .single();

  if (!conversation) {
    // Criar nova conversa com thread do OpenAI
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    const thread = await threadResponse.json();

    const { data: newConversation } = await supabase
      .from('whatsapp_test_conversations')
      .insert({
        instance_name: instanceName,
        contact_number: contactNumber,
        assistant_id: assistantId,
        user_id: userId,
        openai_thread_id: thread.id,
        is_paused: false
      })
      .select()
      .single();

    conversation = newConversation;
  }

  return conversation;
}

async function sendToAssistant(assistantId: string, message: string, threadId: string): Promise<string> {
  try {
    // Adicionar mensagem à thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    });

    // Executar assistente
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    const run = await runResponse.json();

    // Aguardar conclusão
    let runStatus = run;
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      runStatus = await statusResponse.json();
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Run falhou: ${runStatus.status}`);
    }

    // Buscar mensagens da thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messages = await messagesResponse.json();
    const latestMessage = messages.data[0];

    return latestMessage.content[0].text.value || 'Desculpe, não consegui processar sua mensagem.';

  } catch (error) {
    console.error('Erro ao comunicar com assistente:', error);
    return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
  }
}

function breakMessageIntoHumanParts(message: string, enabled: boolean): string[] {
  if (!enabled) {
    return [message];
  }

  // Quebrar mensagem em partes menores e mais humanas
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const parts: string[] = [];
  let currentPart = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentPart.length + trimmedSentence.length < 200) {
      currentPart += (currentPart ? '. ' : '') + trimmedSentence;
    } else {
      if (currentPart) {
        parts.push(currentPart + '.');
      }
      currentPart = trimmedSentence;
    }
  }

  if (currentPart) {
    parts.push(currentPart + (currentPart.endsWith('.') ? '' : '.'));
  }

  return parts.length > 0 ? parts : [message];
}

async function sendWhatsAppMessage(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  contactNumber: string,
  message: string
) {
  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: `${contactNumber}@s.whatsapp.net`,
        text: message
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar mensagem: ${response.status}`);
    }

    console.log('Mensagem enviada com sucesso:', message.substring(0, 50) + '...');
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    throw error;
  }
}