import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, assistant_id, ...params } = await req.json();
    
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

    console.log(`AI Calendar Proxy - Action: ${action}, Assistant: ${assistant_id}, User: ${user.id}`);

    // Validate that the assistant belongs to the user
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id')
      .eq('id', assistant_id)
      .eq('user_id', user.id)
      .single();

    if (assistantError || !assistant) {
      throw new Error('Assistant not found or not authorized');
    }

    // Call the calendar management function with the correct parameters
    const calendarResponse = await supabase.functions.invoke('calendar-management', {
      body: {
        action,
        assistant_id,
        ...params
      },
      headers: {
        Authorization: authHeader
      }
    });

    if (calendarResponse.error) {
      throw new Error(calendarResponse.error.message);
    }

    return new Response(JSON.stringify(calendarResponse.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-calendar-proxy function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});