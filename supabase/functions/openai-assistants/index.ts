import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

console.log('OpenAI API Key check:', openAIApiKey ? 'Key found' : 'Key NOT found');

if (!openAIApiKey) {
  console.error('OPENAI_API_KEY is not configured - please set it in Supabase Edge Function secrets');
}
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is configured
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

    console.log(`OpenAI Assistants API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create':
        return await createAssistant(user.id, data);
      case 'list':
        return await listAssistants(user.id);
      case 'get':
        return await getAssistant(user.id, data.assistantId);
      case 'update':
        return await updateAssistant(user.id, data.assistantId, data);
      case 'delete':
        return await deleteAssistant(user.id, data.assistantId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in openai-assistants function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createAssistant(userId: string, data: any) {
  console.log('createAssistant called with data:', data);
  console.log('OpenAI API Key available:', !!openAIApiKey);
  
  const { name, description, instructions, model = 'gpt-4o-mini' } = data;

  console.log('Creating assistant with model:', model);
  
  // Create assistant in OpenAI
  const openAIResponse = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      name,
      description,
      instructions,
      model,
      tools: []
    }),
  });

  if (!openAIResponse.ok) {
    const error = await openAIResponse.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const openAIAssistant = await openAIResponse.json();

  // Save assistant in Supabase
  const { data: assistant, error } = await supabase
    .from('assistants')
    .insert({
      user_id: userId,
      openai_assistant_id: openAIAssistant.id,
      name,
      description,
      instructions,
      model,
      tools: [],
      metadata: openAIAssistant
    })
    .select()
    .single();

  if (error) {
    // If Supabase insert fails, try to delete the OpenAI assistant
    try {
      await fetch(`https://api.openai.com/v1/assistants/${openAIAssistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
    } catch (deleteError) {
      console.error('Failed to cleanup OpenAI assistant:', deleteError);
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function listAssistants(userId: string) {
  const { data: assistants, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistants }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAssistant(userId: string, assistantId: string) {
  const { data: assistant, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAssistant(userId: string, assistantId: string, data: any) {
  const { name, description, instructions, model } = data;

  // Get current assistant from database
  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) {
    throw new Error(`Assistant not found: ${fetchError.message}`);
  }

  // Update assistant in OpenAI
  const openAIResponse = await fetch(`https://api.openai.com/v1/assistants/${currentAssistant.openai_assistant_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      name,
      description,
      instructions,
      model
    }),
  });

  if (!openAIResponse.ok) {
    const error = await openAIResponse.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const openAIAssistant = await openAIResponse.json();

  // Update assistant in Supabase
  const { data: assistant, error } = await supabase
    .from('assistants')
    .update({
      name,
      description,
      instructions,
      model,
      metadata: openAIAssistant
    })
    .eq('user_id', userId)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ assistant }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteAssistant(userId: string, assistantId: string) {
  // Get current assistant from database
  const { data: currentAssistant, error: fetchError } = await supabase
    .from('assistants')
    .select('*')
    .eq('user_id', userId)
    .eq('id', assistantId)
    .single();

  if (fetchError) {
    throw new Error(`Assistant not found: ${fetchError.message}`);
  }

  // Delete assistant in OpenAI
  const openAIResponse = await fetch(`https://api.openai.com/v1/assistants/${currentAssistant.openai_assistant_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  if (!openAIResponse.ok) {
    const error = await openAIResponse.json();
    console.error('Failed to delete OpenAI assistant:', error);
    // Continue with database deletion even if OpenAI deletion fails
  }

  // Mark assistant as inactive in Supabase (soft delete)
  const { error } = await supabase
    .from('assistants')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('id', assistantId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}