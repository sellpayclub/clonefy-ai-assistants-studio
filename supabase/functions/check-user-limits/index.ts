import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { resource_type } = await req.json()
    
    if (!resource_type || !['assistant', 'whatsapp_connection'].includes(resource_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user quotas
    const { data: quotaData, error: quotaError } = await supabaseClient
      .from('user_quotas')
      .select('max_assistants, max_whatsapp_connections')
      .eq('user_id', user.id)
      .single()

    if (quotaError && quotaError.code !== 'PGRST116') {
      console.error('Error getting quotas:', quotaError)
      return new Response(
        JSON.stringify({ error: 'Failed to get user quotas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If no quotas exist, create default
    if (!quotaData) {
      const { error: insertError } = await supabaseClient
        .from('user_quotas')
        .insert({
          user_id: user.id,
          max_assistants: 1,
          max_whatsapp_connections: 1,
          plan_type: 'free'
        })

      if (insertError) {
        console.error('Error creating default quotas:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user quotas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Set default values
      const defaultQuotas = { max_assistants: 1, max_whatsapp_connections: 1 }
      return checkLimits(supabaseClient, user.id, resource_type, defaultQuotas)
    }

    return checkLimits(supabaseClient, user.id, resource_type, quotaData)

  } catch (error) {
    console.error('Error in check-user-limits:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkLimits(supabaseClient: any, userId: string, resourceType: string, quotas: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  try {
    let currentCount = 0
    let maxCount = 0

    if (resourceType === 'assistant') {
      const { data: assistants, error } = await supabaseClient
        .from('assistants')
        .select('id')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      currentCount = assistants?.length || 0
      maxCount = quotas.max_assistants
    } else if (resourceType === 'whatsapp_connection') {
      // Verificar na tabela whatsapp_connections
      const { data: connections, error } = await supabaseClient
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Também verificar na tabela n8n_fluxogpt para compatibilidade
      const { data: n8nConnections, error: n8nError } = await supabaseClient
        .from('n8n_fluxogpt')
        .select('id')
        .eq('emailuser', userId) // Note: precisa do email, não user_id

      if (n8nError) {
        console.warn('Error fetching n8n connections:', n8nError)
      }

      const whatsappCount = connections?.length || 0
      const n8nCount = n8nConnections?.length || 0
      currentCount = whatsappCount + n8nCount
      maxCount = quotas.max_whatsapp_connections
    }

    const canCreate = currentCount < maxCount

    return new Response(
      JSON.stringify({
        can_create: canCreate,
        current_count: currentCount,
        max_count: maxCount,
        resource_type: resourceType
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error checking limits:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check limits' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}