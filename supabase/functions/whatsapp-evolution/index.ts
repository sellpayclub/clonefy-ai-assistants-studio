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
  action: 'create' | 'list' | 'delete' | 'connect' | 'set_webhook' | 'test_api' | 'get_qr';
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
      case 'test_api':
        console.log('WhatsApp Evolution: Testing API connection');
        return await testEvolutionAPI();
      case 'set_webhook':
        console.log('WhatsApp Evolution: Setting webhook for:', instanceName);
        return await setWebhook(instanceName!);
      case 'get_qr':
        console.log('WhatsApp Evolution: Getting QR code for:', instanceName);
        return await getQrCode(instanceName!);
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

    // 1. Criar instância na Evolution API (fluxo exato do usuário)
    console.log('Step 1: Creating instance...');
    
    const createBody = {
      instanceName: instanceName,
      integration: "WHATSAPP-BAILEYS",
      reject_call: false,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: false,
      syncFullHistory: true
    };
    
    console.log('Create request:', JSON.stringify(createBody));
    
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(createBody),
    });

    console.log('Create response status:', createResponse.status);
    
    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('Evolution API create error:', errorData);
      throw new Error(`Failed to create instance (${createResponse.status}): ${errorData}`);
    }

    const createData = await createResponse.json();
    console.log('Instance created:', createData);

    // 2. Configurar webhook
    console.log('Step 2: Setting webhook...');
    
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          webhookBase64: true,
          events: ["MESSAGES_UPSERT"]
        }
      }),
    });

    console.log('Webhook response status:', webhookResponse.status);
    
    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text();
      console.error('Failed to set webhook:', errorData);
      // Continue even if webhook fails
    } else {
      const webhookData = await webhookResponse.json();
      console.log('Webhook configured:', webhookData);
    }

    // 3. Conectar e obter QR Code
    console.log('Step 3: Connecting and getting QR...');
    
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    });

    console.log('Connect response status:', connectResponse.status);
    
    let qrBase64 = null;
    if (connectResponse.ok) {
      const connectData = await connectResponse.json();
      console.log('Connect data:', connectData);
      qrBase64 = connectData.base64;
    }

    // 4. Salvar no Supabase (campos conforme especificação do usuário)
    console.log('Step 4: Saving to Supabase...');
    
    const uniqueId = Date.now();
    
    const { data: insertData, error: insertError } = await supabaseClient
      .from('n8n_fluxogpt')
      .insert({
        id: uniqueId,
        NomeInstancia: instanceName,
        IDAssistentGPT: assistantId,
        EmailUSER: instanceName,  // Conforme especificação
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
        instanceName: instanceName,
        qrCode: qrBase64,
        data: insertData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('createWhatsAppInstance error:', error);
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
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        webhookBase64: true,
        events: ["MESSAGES_UPSERT"]
      }
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
      'Content-Type': 'application/json',
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
  console.log('connectInstance: Instance connected successfully:', JSON.stringify(connectData));
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

    // 2. Deletar do Supabase (usar campo correto)
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
  } catch (error: any) {
    console.error('Error in deleteConnection:', error);
    throw error;
  }
}

async function testEvolutionAPI() {
  try {
    console.log('testEvolutionAPI: Testing connection to Evolution API');
    
    const testResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });
    
    console.log('testEvolutionAPI: Response status:', testResponse.status);
    
    const responseText = await testResponse.text();
    console.log('testEvolutionAPI: Response body:', responseText);
    
    return new Response(
      JSON.stringify({
        success: testResponse.ok,
        status: testResponse.status,
        response: responseText,
        url: `${EVOLUTION_API_URL}/instance/fetchInstances`,
        hasApiKey: !!EVOLUTION_API_KEY
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('testEvolutionAPI: Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getQrCode(instanceName: string) {
  try {
    console.log(`getQrCode: Getting QR code for instance: ${instanceName}`);
    
    // Endpoint correto conforme especificação do usuário
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      }
    });

    console.log(`getQrCode: Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`getQrCode: API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Evolution API error: ${response.status}`,
        details: errorText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('getQrCode: API response data:', data);
    
    // Resposta conforme especificação: { base64: "data:image/png;base64,..." }
    return new Response(JSON.stringify({
      success: true,
      base64: data.base64,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('getQrCode: Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get QR code',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}