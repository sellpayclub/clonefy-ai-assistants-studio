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
      // Get agent information for widget initialization
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
      // Get agent details
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
      
      if (!currentConversationId) {
        // Create new conversation for widget
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            assistant_id: agentId,
            user_id: agent.user_id,
            title: `Widget Chat - ${new Date().toLocaleString()}`,
            openai_thread_id: '',
            whatsapp_contact: 'widget_user'
          })
          .select()
          .single();

        if (convError) {
          throw new Error('Failed to create conversation');
        }

        currentConversationId = newConversation.id;

        // Create OpenAI thread
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        const thread = await threadResponse.json();

        // Update conversation with thread ID
        await supabase
          .from('conversations')
          .update({ openai_thread_id: thread.id })
          .eq('id', currentConversationId);
      }

      // Get conversation to get thread ID
      const { data: conversation } = await supabase
        .from('conversations')
        .select('openai_thread_id')
        .eq('id', currentConversationId)
        .single();

      // Add user message to OpenAI thread
      await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/messages`, {
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
      });

      // Save user message to database
      await supabase.from('messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message
      });

      // Run the assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/runs`, {
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

      // Poll for completion
      let runStatus = run.status;
      let attempts = 0;
      const maxAttempts = 30;

      while (runStatus === 'queued' || runStatus === 'in_progress') {
        if (attempts >= maxAttempts) {
          throw new Error('Assistant response timeout');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;
      }

      if (runStatus === 'completed') {
        // Get the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${conversation.openai_thread_id}/messages?order=desc&limit=1`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
        });

        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data[0];
        const responseText = assistantMessage.content[0].text.value;

        // Save assistant message to database
        await supabase.from('messages').insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: responseText,
          openai_message_id: assistantMessage.id
        });

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