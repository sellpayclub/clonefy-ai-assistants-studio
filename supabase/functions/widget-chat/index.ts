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
      
      if (!currentConversationId) {
        // Create OpenAI thread first (parallel optimization)
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        const thread = await threadResponse.json();
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
      } else {
        // Get existing thread ID
        const { data: conversation } = await supabase
          .from('conversations')
          .select('openai_thread_id')
          .eq('id', currentConversationId)
          .single();
        threadId = conversation.openai_thread_id;
      }

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

      const run = await runResponse.json();

      // Optimized polling with tool call handling
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 60; // Increased attempts but shorter intervals
      const pollInterval = 500; // Faster polling - 500ms instead of 1000ms

      while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
        if (attempts >= maxAttempts) {
          throw new Error('Assistant response timeout after 30 seconds');
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
        
        // Log progress for debugging
        if (attempts % 4 === 0) { // Log every 2 seconds
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

        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data[0];
        const responseText = assistantMessage.content[0].text.value;

        // Save assistant message to database (background task)
        supabase.from('messages').insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: responseText,
          openai_message_id: assistantMessage.id
        }).then(() => {
          console.log('Assistant message saved to database');
        }).catch((error) => {
          console.error('Error saving assistant message:', error);
        });

        // Return response immediately without waiting for DB save
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});