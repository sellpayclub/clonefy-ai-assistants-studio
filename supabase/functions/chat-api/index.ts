import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function readOpenAIResponse(response: Response, operation: string) {
  const rawBody = await response.text();
  let payload: Record<string, any> = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }
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

    const { action, ...data } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
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

  // Create thread in OpenAI
  const openAIResponse = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({}),
  });

  const openAIThread = await readOpenAIResponse(openAIResponse, 'criar a conversa');
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

  // Add user message to thread
  const userMessageResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      role: 'user',
      content: content
    }),
  });

  if (!userMessageResponse.ok) {
    const error = await userMessageResponse.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const userMessage = await userMessageResponse.json();

  // Save user message in database
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: content,
      openai_message_id: userMessage.id
    });

  // Create and stream run
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      assistant_id: conversation.assistants.openai_assistant_id
    }),
  });

  if (!runResponse.ok) {
    const error = await runResponse.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const run = await runResponse.json();

  // Wait for completion and handle tool calls
  let runStatus = run;
  while (runStatus.status === 'queued' || runStatus.status === 'in_progress' || runStatus.status === 'requires_action') {
    if (runStatus.status === 'requires_action') {
      // Handle tool calls through our proxy
      const requiredAction = runStatus.required_action;
      if (requiredAction && requiredAction.type === 'submit_tool_outputs') {
        console.log('Processing tool calls...');
        
        const toolOutputs = [];
        for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
          if (toolCall.type === 'function') {
            // Check if it's a calendar function
            const functionName = toolCall.function.name;
            if (['check_availability', 'create_appointment', 'list_appointments', 'cancel_appointment', 'reschedule_appointment', 'update_appointment'].includes(functionName)) {
              console.log(`Calling calendar function: ${functionName}`);
              
              // Call our calendar proxy to handle the function call
              const proxyResponse = await supabase.functions.invoke('chat-proxy', {
                body: {
                  action: 'tool_call',
                  run_id: run.id,
                  thread_id: conversation.openai_thread_id,
                  tool_call_id: toolCall.id,
                  function_name: functionName,
                  arguments: toolCall.function.arguments
                }
              });
              
              let result;
              if (proxyResponse.error) {
                result = `Erro ao executar ${functionName}: ${proxyResponse.error.message}`;
              } else {
                // The proxy already submits the tool outputs, so we just continue
                break;
              }
            } else {
              // For non-calendar functions, return a default message
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: `Função ${functionName} não está disponível no momento.`
              });
            }
          }
        }
        
        // If we have non-calendar tool outputs to submit
        if (toolOutputs.length > 0) {
          const submitResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/runs/${run.id}/submit_tool_outputs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({ tool_outputs: toolOutputs }),
          });
          
          if (!submitResponse.ok) {
            const error = await submitResponse.json();
            console.error('Error submitting tool outputs:', error);
          }
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/runs/${run.id}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    
    runStatus = await statusResponse.json();
  }

  // Get messages from thread
  const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/messages`, {
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant' && msg.run_id === run.id);

  if (assistantMessage) {
    // Extract text content safely (some messages may contain multiple content blocks)
    let messageContent = '';
    if (Array.isArray(assistantMessage.content)) {
      for (const part of assistantMessage.content) {
        if (part.type === 'text' && part.text?.value) {
          messageContent += (messageContent ? '\n' : '') + part.text.value;
        }
      }
    }
    // Fallback
    messageContent = messageContent || assistantMessage.content?.[0]?.text?.value || '';

    // Replace any sandbox:* links with direct public URLs from our media library
    const sanitizedContent = await replaceSandboxLinks(messageContent, conversation.assistant_id);
    
    // Save assistant message in database
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: sanitizedContent,
        openai_message_id: assistantMessage.id
      });

    return new Response(JSON.stringify({ 
      userMessage, 
      assistantMessage: {
        id: assistantMessage.id,
        content: sanitizedContent,
        role: 'assistant'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  throw new Error('No assistant response received');
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