import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import {
  createOpenAIConversation,
  getSupabaseServiceKey,
  isResponsesConversationId,
  runOpenAIResponse,
} from '../_shared/openai-responses.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = getSupabaseServiceKey();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function requestOpenAIJson(
  url: string,
  init: RequestInit,
  operation: string,
  retries = 1,
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, init);
    const rawBody = await response.text();
    let payload: Record<string, any> = {};

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = {};
      }
    }

    const transientFailure = !rawBody || response.status === 429 || response.status >= 500;
    if (transientFailure && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      continue;
    }

    if (!response.ok) {
      const detail = payload.error?.message || rawBody || `HTTP ${response.status}`;
      throw new Error(`OpenAI API error ao ${operation}: ${detail}`);
    }

    if (!rawBody) {
      throw new Error(`A OpenAI retornou uma resposta vazia ao ${operation}. Tente novamente.`);
    }

    return payload;
  }

  throw new Error(`Não foi possível ${operation}. Tente novamente.`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key não configurada. Por favor, configure a OPENAI_API_KEY nas configurações do projeto.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...data } = body;
    if (typeof action !== 'string' || !action) {
      return new Response(JSON.stringify({ error: 'Ação não informada.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sessão não encontrada. Entre novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão expirada. Entre novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Chat API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create_thread':
        return await createThread(user.id, data);
      case 'send_message':
        return await sendMessage(user.id, data);
      case 'get_conversations':
        return await getConversations(user.id);
      case 'get_messages':
        return await getMessages(user.id, data.conversationId);
      case 'delete_conversation':
        return await deleteConversation(user.id, data.conversationId);
      case 'delete_all_conversations':
        return await deleteAllConversations(user.id);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in chat-api function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createThread(userId: string, data: any) {
  const { assistantId, title } = data;

  if (typeof assistantId !== 'string' || !assistantId) {
    throw new Error('Selecione um agente válido para criar a conversa.');
  }

  console.log('Creating thread for assistant:', assistantId);

  // Get assistant from database
  const { data: assistant, error: assistantError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (assistantError || !assistant) {
    throw new Error('Assistant not found');
  }

  // Responses API uses Conversations instead of Assistants Threads.
  const openAIThread = await createOpenAIConversation(openAIApiKey!, {
    user_id: userId,
    assistant_id: assistantId,
    channel: 'test_chat',
  });
  if (typeof openAIThread.id !== 'string' || !openAIThread.id) {
    throw new Error('A OpenAI não retornou um identificador válido para a conversa.');
  }

  // Save conversation in Supabase
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      assistant_id: assistantId,
      openai_thread_id: openAIThread.id,
      title: title || `Conversa com ${assistant.name}`
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ conversation, thread: openAIThread }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendMessage(userId: string, data: any) {
  const { conversationId, content } = data;

  console.log('Sending message to conversation:', conversationId);

  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      assistants(*)
    `)
    .eq('user_id', userId)
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    throw new Error('Conversation not found');
  }

  let conversationStateId = conversation.openai_thread_id;
  let responseInput: any = content;

  // Lazily migrate old thread_* conversations and carry their local history.
  if (!isResponsesConversationId(conversationStateId)) {
    const migrated = await createOpenAIConversation(openAIApiKey!, {
      user_id: userId,
      assistant_id: conversation.assistant_id,
      channel: 'test_chat',
    });
    conversationStateId = migrated.id;

    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    responseInput = [
      ...(history || []).map((item: any) => ({ role: item.role, content: item.content })),
      { role: 'user', content },
    ];

    await supabase
      .from('conversations')
      .update({ openai_thread_id: conversationStateId })
      .eq('id', conversationId);
  }

  const userMessage = { id: `local_${crypto.randomUUID()}`, role: 'user', content };

  // Save user message in database
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: content,
      openai_message_id: userMessage.id
    });

  const result = await runOpenAIResponse({
    apiKey: openAIApiKey!,
    conversationId: conversationStateId,
    assistant: conversation.assistants,
    input: responseInput,
    onToolCall: async (call) => {
      const calendarFunctions = ['check_availability', 'create_appointment', 'list_appointments', 'cancel_appointment', 'reschedule_appointment', 'update_appointment'];
      if (!calendarFunctions.includes(call.name)) {
        return { success: false, error: `Função ${call.name} não está disponível no chat de teste.` };
      }
      const calendarResponse = await supabase.functions.invoke('calendar-management', {
        body: { action: call.name, assistant_id: conversation.assistant_id, internal_user_id: userId, ...call.arguments },
      });
      if (calendarResponse.error) throw calendarResponse.error;
      return calendarResponse.data;
    },
  });

  const sanitizedContent = await replaceSandboxLinks(result.text, conversation.assistant_id);
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: sanitizedContent,
    openai_message_id: result.id,
  });

  return new Response(JSON.stringify({
    userMessage,
    assistantMessage: { id: result.id, content: sanitizedContent, role: 'assistant' },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getConversations(userId: string) {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      title,
      assistant_id,
      updated_at,
      assistants(name)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  const summaries = (conversations || []).map((conversation) => ({
    ...conversation,
    messages: [],
  }));

  return new Response(JSON.stringify({ conversations: summaries }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getMessages(userId: string, conversationId: string) {
  // Verify conversation belongs to user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ messages: (messages || []).reverse() }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteConversation(userId: string, conversationId: string) {
  // Soft delete conversation
  const { error } = await supabase
    .from('conversations')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('id', conversationId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteAllConversations(userId: string) {
  // Soft delete all active conversations for the user
  const { error } = await supabase
    .from('conversations')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper: replace sandbox:* markdown links with public URLs for this assistant's media files
async function replaceSandboxLinks(text: string, assistantId: string): Promise<string> {
  try {
    if (!text || !text.includes('sandbox:')) return text;

    const { data: files, error } = await supabase
      .from('assistant_media')
      .select('file_name, file_url')
      .eq('assistant_id', assistantId);

    if (error || !files || files.length === 0) return text;

    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '');

    const findUrlFor = (hint: string) => {
      const h = normalize(hint || '');
      if (!h) return null;
      const match = files.find((f: any) => {
        const n = normalize(f.file_name || '');
        return n.includes(h) || h.includes(n);
      });
      return match?.file_url || null;
    };

    let output = text;

    // Images: ![alt](sandbox:xxx)
    output = output.replace(/!\[([^\]]*)\]\((sandbox:[^)]+)\)/gi, (_m, alt) => {
      const url = findUrlFor(alt) || files[0].file_url;
      return `![${alt}](${url})`;
    });

    // Links: [alt](sandbox:xxx)
    output = output.replace(/\[([^\]]*)\]\((sandbox:[^)]+)\)/gi, (_m, alt) => {
      const url = findUrlFor(alt) || files[0].file_url;
      return `[${alt}](${url})`;
    });

    // Bare (sandbox:xxx) → (first file url) as last resort
    output = output.replace(/\((sandbox:[^)]+)\)/gi, () => `(${files[0].file_url})`);

    return output;
  } catch (_e) {
    // If anything fails, return original text
    return text;
  }
}
