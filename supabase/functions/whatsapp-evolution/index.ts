import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVOLUTION_API_URL = 'https://evolutionapi.chatsellpay.com';
const EVOLUTION_API_KEY = '2eb6dd69c0cc273101c4efc974419be5';
const WEBHOOK_URL = 'https://webhook.dcsaudeautomacao.com/webhook/fluxogptdaniel';

interface CreateInstanceRequest {
  action: 'create' | 'list' | 'delete' | 'connect' | 'set_webhook';
  instanceName?: string;
  assistantId?: string;
  userEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, instanceName, assistantId, userEmail }: CreateInstanceRequest = await req.json();

    switch (action) {
      case 'create':
        return await createWhatsAppInstance(instanceName!, assistantId!, userEmail!, supabaseClient);
      case 'list':
        return await listConnections(supabaseClient, user.email!);
      case 'delete':
        return await deleteConnection(instanceName!, supabaseClient);
      case 'connect':
        return await connectInstance(instanceName!);
      case 'set_webhook':
        return await setWebhook(instanceName!);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in whatsapp-evolution function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createWhatsAppInstance(
  instanceName: string,
  assistantId: string,
  userEmail: string,
  supabaseClient: any
) {
  try {
    const fullInstanceName = `cristina_${instanceName.toLowerCase()}`;
    
    // 1. Criar instância na Evolution API
    console.log('Creating instance:', fullInstanceName);
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: fullInstanceName,
        integration: 'WHATSAPP-BAILEYS',
        reject_call: false,
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: true,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      throw new Error(`Failed to create instance: ${errorData}`);
    }

    console.log('Instance created successfully');

    // 2. Configurar webhook
    await setWebhook(fullInstanceName);

    // 3. Conectar e obter QR Code
    const qrResponse = await connectInstance(fullInstanceName);
    const qrData = await qrResponse.json();

    // 4. Salvar no Supabase
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    
    const { data: insertData, error: insertError } = await supabaseClient
      .from('n8n_fluxogpt')
      .insert({
        id: uniqueId,
        NomeInstancia: fullInstanceName,
        IDAssistentGPT: assistantId,
        EmailUSER: userEmail,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error saving to Supabase:', insertError);
      throw new Error(`Failed to save to database: ${insertError.message}`);
    }

    console.log('Data saved to Supabase successfully');

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: fullInstanceName,
        qrCode: qrData.base64 || qrData.qrcode,
        data: insertData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in createWhatsAppInstance:', error);
    throw error;
  }
}

async function setWebhook(instanceName: string) {
  console.log('Setting webhook for:', instanceName);
  
  const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apiKey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      events: ['MESSAGES_UPSERT'],
      webhook_by_events: false,
      webhook_base64: true,
    }),
  });

  if (!webhookResponse.ok) {
    const errorData = await webhookResponse.text();
    throw new Error(`Failed to set webhook: ${errorData}`);
  }

  console.log('Webhook configured successfully');
  return webhookResponse;
}

async function connectInstance(instanceName: string) {
  console.log('Connecting instance:', instanceName);
  
  const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      'apiKey': EVOLUTION_API_KEY,
    },
  });

  if (!connectResponse.ok) {
    const errorData = await connectResponse.text();
    throw new Error(`Failed to connect instance: ${errorData}`);
  }

  console.log('Instance connected successfully');
  return connectResponse;
}

async function listConnections(supabaseClient: any, userEmail: string) {
  const { data, error } = await supabaseClient
    .from('n8n_fluxogpt')
    .select('*')
    .eq('EmailUSER', userEmail)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch connections: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ connections: data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function deleteConnection(instanceName: string, supabaseClient: any) {
  try {
    // 1. Deletar da Evolution API
    const deleteResponse = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apiKey': EVOLUTION_API_KEY,
      },
    });

    if (!deleteResponse.ok) {
      console.warn('Failed to delete from Evolution API, continuing with database deletion');
    }

    // 2. Deletar do Supabase
    const { error } = await supabaseClient
      .from('n8n_fluxogpt')
      .delete()
      .eq('NomeInstancia', instanceName);

    if (error) {
      throw new Error(`Failed to delete from database: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Connection deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in deleteConnection:', error);
    throw error;
  }
}