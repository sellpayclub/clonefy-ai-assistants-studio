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
    console.log('WhatsApp Evolution: Starting request processing');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('WhatsApp Evolution: Supabase client created');

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    console.log('WhatsApp Evolution: User authenticated:', user?.email);

    if (!user) {
      console.error('WhatsApp Evolution: Unauthorized - no user found');
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    console.log('WhatsApp Evolution: Request body:', JSON.stringify(body));
    
    const { action, instanceName, assistantId, userEmail } = body;

    console.log('WhatsApp Evolution: Action:', action);

    switch (action) {
      case 'create':
        console.log('WhatsApp Evolution: Creating instance with params:', { instanceName, assistantId, userEmail });
        return await createWhatsAppInstance(instanceName!, assistantId!, userEmail!, supabaseClient);
      case 'list':
        console.log('WhatsApp Evolution: Listing connections for user:', user.email);
        return await listConnections(supabaseClient, user.email!);
      case 'delete':
        console.log('WhatsApp Evolution: Deleting instance:', instanceName);
        return await deleteConnection(instanceName!, supabaseClient);
      case 'connect':
        console.log('WhatsApp Evolution: Connecting instance:', instanceName);
        return await connectInstance(instanceName!);
      case 'set_webhook':
        console.log('WhatsApp Evolution: Setting webhook for:', instanceName);
        return await setWebhook(instanceName!);
      default:
        console.error('WhatsApp Evolution: Invalid action:', action);
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('WhatsApp Evolution: Main error:', error);
    console.error('WhatsApp Evolution: Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
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
    console.log('createWhatsAppInstance: Starting with params:', { instanceName, assistantId, userEmail });
    
    const fullInstanceName = `cristina_${instanceName.toLowerCase()}`;
    console.log('createWhatsAppInstance: Full instance name:', fullInstanceName);
    
    // 1. Criar instância na Evolution API
    console.log('createWhatsAppInstance: Creating instance in Evolution API...');
    
    const createBody = {
      instanceName: fullInstanceName,
      integration: "WHATSAPP-BAILEYS",
      reject_call: false,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: false,
      syncFullHistory: true
    };
    
    console.log('createWhatsAppInstance: Request URL:', `${EVOLUTION_API_URL}/instance/create`);
    console.log('createWhatsAppInstance: Request body:', JSON.stringify(createBody));
    console.log('createWhatsAppInstance: API key:', EVOLUTION_API_KEY ? 'Present' : 'Missing');
    
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(createBody),
    });

    console.log('createWhatsAppInstance: Create response status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('createWhatsAppInstance: Evolution API create error:', errorData);
      throw new Error(`Failed to create instance: ${errorData}`);
    }

    const createData = await createResponse.json();
    console.log('createWhatsAppInstance: Instance created successfully:', createData);

    // 2. Configurar webhook
    console.log('createWhatsAppInstance: Setting webhook...');
    await setWebhook(fullInstanceName);

    // 3. Conectar e obter QR Code
    console.log('createWhatsAppInstance: Connecting instance...');
    const qrResponse = await connectInstance(fullInstanceName);
    const qrData = await qrResponse.json();
    console.log('createWhatsAppInstance: QR Data:', qrData);

    // 4. Salvar no Supabase
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    
    const { data: insertData, error: insertError } = await supabaseClient
      .from('n8n_fluxogpt')
      .insert({
        id: uniqueId,
        nomeinstancia: fullInstanceName,
        idassistentgpt: assistantId,
        emailuser: userEmail,
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
        qrCode: qrData.base64 || qrData.qrcode || qrData.code || qrData,
        data: insertData,
        qrRaw: qrData, // Para debug
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('createWhatsAppInstance: Caught error:', error);
    console.error('createWhatsAppInstance: Error message:', error.message);
    console.error('createWhatsAppInstance: Error stack:', error.stack);
    throw error;
  }
}

async function setWebhook(instanceName: string) {
  console.log('setWebhook: Setting webhook for:', instanceName);
  
  const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      events: ['MESSAGES_UPSERT'],
      webhook_by_events: false,
      webhook_base64: true,
    }),
  });

  console.log('setWebhook: Webhook response status:', webhookResponse.status);
  
  if (!webhookResponse.ok) {
    const errorData = await webhookResponse.text();
    console.error('setWebhook: Failed to set webhook:', errorData);
    throw new Error(`Failed to set webhook: ${errorData}`);
  }

  const webhookData = await webhookResponse.json();
  console.log('setWebhook: Webhook configured successfully:', webhookData);
  return webhookResponse;
}

async function connectInstance(instanceName: string) {
  console.log('connectInstance: Connecting instance:', instanceName);
  
  const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': EVOLUTION_API_KEY,
    },
  });

  console.log('connectInstance: Connect response status:', connectResponse.status);

  if (!connectResponse.ok) {
    const errorData = await connectResponse.text();
    console.error('connectInstance: Failed to connect instance:', errorData);
    throw new Error(`Failed to connect instance: ${errorData}`);
  }

  const connectData = await connectResponse.json();
  console.log('connectInstance: Instance connected successfully:', connectData);
  return connectResponse;
}

async function listConnections(supabaseClient: any, userEmail: string) {
  const { data, error } = await supabaseClient
    .from('n8n_fluxogpt')
    .select('*')
    .eq('emailuser', userEmail)
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
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!deleteResponse.ok) {
      console.warn('Failed to delete from Evolution API, continuing with database deletion');
    }

    // 2. Deletar do Supabase
    const { error } = await supabaseClient
      .from('n8n_fluxogpt')
      .delete()
      .eq('nomeinstancia', instanceName);

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