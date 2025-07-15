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
    
    // Create full instance name using user email prefix
    const emailPrefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const fullInstanceName = `${emailPrefix}_${instanceName.toLowerCase()}`;
    console.log('createWhatsAppInstance: Email prefix:', emailPrefix);
    console.log('createWhatsAppInstance: Full instance name:', fullInstanceName);

    // 1. Criar instância na Evolution API
    console.log('createWhatsAppInstance: Creating instance in Evolution API...');
    
    const createBody = {
      instanceName: fullInstanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true, // Gerar QR code automaticamente
      reject_call: false,
      groups_ignore: true,
      always_online: true,
      read_messages: true,
      read_status: false
    };
    
    console.log('createWhatsAppInstance: Request URL:', `${EVOLUTION_API_URL}/instance/create`);
    console.log('createWhatsAppInstance: Request body:', JSON.stringify(createBody));
    
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
      throw new Error(`Failed to create instance (${createResponse.status}): ${errorData}`);
    }

    const createData = await createResponse.json();
    console.log('createWhatsAppInstance: Instance created successfully:', createData);

    // 2. Configurar webhook
    console.log('createWhatsAppInstance: Setting webhook...');
    try {
      await setWebhook(fullInstanceName);
      console.log('createWhatsAppInstance: Webhook set successfully');
    } catch (webhookError: any) {
      console.error('createWhatsAppInstance: Webhook error:', webhookError.message);
      // Continue mesmo se o webhook falhar
    }

    // 3. Obter QR Code se foi gerado na criação
    console.log('createWhatsAppInstance: Checking for QR code...');
    let qrCodeBase64 = null;
    
    // Se qrcode: true foi especificado, o QR pode já estar na resposta da criação
    if (createData.qrCode || createData.base64) {
      qrCodeBase64 = createData.qrCode || createData.base64;
      console.log('createWhatsAppInstance: QR found in create response');
    } else {
      // Tentar obter QR code via endpoint connect (documentação oficial)
      try {
        const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${fullInstanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          console.log('createWhatsAppInstance: Connect QR Data:', JSON.stringify(qrData));
          
          // Baseado na documentação: { "pairingCode": "WZYEH1YY", "code": "2@y8eK+bjtEjUWy9/FOM...", "count": 1 }
          qrCodeBase64 = extractQrCodeFromResponse(qrData);
        }
      } catch (qrError: any) {
        console.error('createWhatsAppInstance: QR generation failed:', qrError.message);
      }
    }
    
    console.log('createWhatsAppInstance: Final QR Code present:', !!qrCodeBase64);
    
    // 4. Salvar no Supabase
    console.log('createWhatsAppInstance: Saving to Supabase...');
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
      console.error('createWhatsAppInstance: Error saving to Supabase:', insertError);
      throw new Error(`Failed to save to database: ${insertError.message}`);
    }

    console.log('createWhatsAppInstance: Data saved to Supabase successfully');

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: fullInstanceName,
        qrCode: qrCodeBase64,
        data: insertData,
        warning: qrCodeBase64 ? null : 'Instance created but QR code failed to generate',
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
  
  // Aguardar um pouco antes de tentar conectar para garantir que a instância foi criada
  console.log('connectInstance: Waiting 2 seconds before connecting...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
  });

  console.log('connectInstance: Connect response status:', connectResponse.status);
  console.log('connectInstance: Connect response headers:', Object.fromEntries(connectResponse.headers.entries()));

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
  } catch (error: any) {
    console.error('Error in deleteConnection:', error);
    throw error;
  }
}

async function testEvolutionAPI() {
  try {
    console.log('testEvolutionAPI: Testing connection to Evolution API');
    console.log('testEvolutionAPI: URL:', EVOLUTION_API_URL);
    console.log('testEvolutionAPI: API Key present:', !!EVOLUTION_API_KEY);
    
    // Testar endpoint de listagem de instâncias
    const testResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });
    
    console.log('testEvolutionAPI: Response status:', testResponse.status);
    console.log('testEvolutionAPI: Response headers:', Object.fromEntries(testResponse.headers.entries()));
    
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
    console.log('getQrCode: Getting QR code for instance:', instanceName);
    console.log('getQrCode: API Key:', EVOLUTION_API_KEY);
    
    // Usar o endpoint oficial da documentação: GET /instance/connect/{instance}
    console.log('getQrCode: Using official connect endpoint');
    const connectUrl = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
    console.log('getQrCode: URL:', connectUrl);
    
    const connectResponse = await fetch(connectUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
    });

    console.log('getQrCode: Response status:', connectResponse.status);
    
    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      console.error('getQrCode: API error:', errorData);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'QR Code não disponível. Instância pode não estar pronta.',
        apiError: errorData
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    const responseText = await connectResponse.text();
    console.log('getQrCode: Raw response:', responseText);
    
    const qrData = JSON.parse(responseText);
    console.log('getQrCode: Parsed data:', JSON.stringify(qrData, null, 2));
    
    // Extrair QR code baseado na documentação oficial
    const qrCode = extractQrCodeFromResponse(qrData);
    
    if (qrCode) {
      return new Response(JSON.stringify({ 
        success: true, 
        qrCode: qrCode,
        pairingCode: qrData.pairingCode,
        count: qrData.count
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }


    // Se não encontrou QR code
    console.log('getQrCode: No QR code found in response');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'QR Code não disponível. Instância pode não estar pronta para conexão.',
      responseData: qrData
    }), {
      status: 400,
      headers: corsHeaders,
    });
    
  } catch (error: any) {
    console.error('getQrCode: Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// Função auxiliar para extrair QR code baseada na documentação oficial
function extractQrCodeFromResponse(qrData: any): string | null {
  console.log('extractQrCodeFromResponse: Analyzing response:', JSON.stringify(qrData, null, 2));
  
  // Baseado na documentação oficial:
  // { "pairingCode": "WZYEH1YY", "code": "2@y8eK+bjtEjUWy9/FOM...", "count": 1 }
  
  // O campo "code" contém o QR code string para gerar a imagem
  if (qrData.code && typeof qrData.code === 'string') {
    console.log('extractQrCodeFromResponse: Found QR code in "code" field');
    return qrData.code;
  }
  
  // Fallback para outros possíveis campos
  const possibleFields = ['base64', 'qrcode', 'qr', 'qrCode', 'data'];
  
  for (const field of possibleFields) {
    if (qrData[field] && typeof qrData[field] === 'string') {
      let qrCode = qrData[field];
      console.log(`extractQrCodeFromResponse: Found QR in field "${field}"`);
      
      // Remover prefixo data:image se existir
      if (qrCode.includes('data:image')) {
        qrCode = qrCode.replace(/^data:image\/[a-z]+;base64,/, '');
      }
      
      // Verificar se parece ser válido (string não vazia)
      if (qrCode.length > 10) {
        console.log('extractQrCodeFromResponse: Valid QR code found');
        return qrCode;
      }
    }
  }
  
  console.log('extractQrCodeFromResponse: No QR code found in response');
  return null;
}