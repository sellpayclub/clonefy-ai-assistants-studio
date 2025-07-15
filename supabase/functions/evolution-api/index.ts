import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const evolutionApiUrl = 'https://evolutionapi.chatsellpay.com/manager';
const evolutionApiKey = '2eb6dd69c0cc273101c4efc974419be5';
const webhookUrl = 'https://webhook.dcsaudeautomacao.com/webhook/fluxogptdaniel';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`Evolution API - Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create_instance':
        return await createInstance(user.id, data);
      case 'generate_qr':
        return await generateQR(user.id, data.instanceId);
      case 'get_instances':
        return await getInstances(user.id);
      case 'get_instance_status':
        return await getInstanceStatus(user.id, data.instanceId);
      case 'delete_instance':
        return await deleteInstance(user.id, data.instanceId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in evolution-api function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createInstance(userId: string, data: any) {
  const { instanceName } = data;
  const fullInstanceName = `${userId.slice(0, 8)}_${instanceName}`;

  console.log('Creating instance:', fullInstanceName);

  // Create instance in Evolution API
  const response = await fetch(`${evolutionApiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey,
    },
    body: JSON.stringify({
      instanceName: fullInstanceName,
      integration: 'WHATSAPP-BAILEYS',
      reject_call: false,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: false,
      syncFullHistory: true
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Evolution API error:', errorText);
    throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
  }

  const evolutionData = await response.json();
  console.log('Instance created:', evolutionData);

  // Configure webhook
  try {
    await fetch(`${evolutionApiUrl}/webhook/set/${fullInstanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookBase64: true,
          events: ["MESSAGES_UPSERT"]
        }
      }),
    });
  } catch (webhookError) {
    console.error('Webhook configuration error:', webhookError);
  }

  // Save instance in Supabase
  const { data: connection, error } = await supabase
    .from('whatsapp_connections')
    .insert({
      user_id: userId,
      instance_name: instanceName,
      instance_id: fullInstanceName,
      status: 'created',
      webhook_url: webhookUrl
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ connection, evolutionData }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateQR(userId: string, instanceId: string) {
  console.log('Generating QR for instance:', instanceId);

  const response = await fetch(`${evolutionApiUrl}/instance/connect/${instanceId}`, {
    method: 'GET',
    headers: {
      'apikey': evolutionApiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Update QR code in database
  await supabase
    .from('whatsapp_connections')
    .update({ 
      qr_code: data.base64 || data.qrcode,
      status: 'connecting'
    })
    .eq('user_id', userId)
    .eq('instance_id', instanceId);

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getInstances(userId: string) {
  // Get instances from database
  const { data: connections, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ connections }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getInstanceStatus(userId: string, instanceId: string) {
  console.log('Getting status for instance:', instanceId);

  const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
    method: 'GET',
    headers: {
      'apikey': evolutionApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.status}`);
  }

  const instances = await response.json();
  const instance = instances.find((inst: any) => inst.instance.instanceName === instanceId);
  
  if (instance) {
    // Update status in database
    await supabase
      .from('whatsapp_connections')
      .update({ 
        status: instance.instance.status || 'disconnected',
        phone_number: instance.instance.owner || null,
        connected_at: instance.instance.status === 'open' ? new Date().toISOString() : null
      })
      .eq('user_id', userId)
      .eq('instance_id', instanceId);
  }

  return new Response(JSON.stringify({ instance }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteInstance(userId: string, instanceId: string) {
  console.log('Deleting instance:', instanceId);

  // Delete from Evolution API
  try {
    await fetch(`${evolutionApiUrl}/instance/delete/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'apikey': evolutionApiKey,
      },
    });
  } catch (error) {
    console.error('Error deleting from Evolution API:', error);
  }

  // Delete from database
  const { error } = await supabase
    .from('whatsapp_connections')
    .delete()
    .eq('user_id', userId)
    .eq('instance_id', instanceId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}