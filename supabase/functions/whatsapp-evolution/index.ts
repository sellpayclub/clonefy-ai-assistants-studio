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
      reject_call: false,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: false,
      syncFullHistory: true
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

    // 3. Conectar e obter QR Code
    console.log('createWhatsAppInstance: Connecting instance...');
    let qrCodeBase64 = null;
    
    try {
      const qrResponse = await connectInstance(fullInstanceName);
      const qrData = await qrResponse.json();
      console.log('createWhatsAppInstance: QR Data received:', JSON.stringify(qrData));
      
      // Extrair QR Code de diferentes possíveis formatos
      if (qrData.base64) {
        qrCodeBase64 = qrData.base64;
        console.log('createWhatsAppInstance: Found QR in base64 field');
      } else if (qrData.qrcode) {
        qrCodeBase64 = qrData.qrcode;
        console.log('createWhatsAppInstance: Found QR in qrcode field');
      } else if (qrData.code) {
        qrCodeBase64 = qrData.code;
        console.log('createWhatsAppInstance: Found QR in code field');
      } else if (typeof qrData === 'string') {
        qrCodeBase64 = qrData;
        console.log('createWhatsAppInstance: QR data is a string');
      }
      
    } catch (qrError: any) {
      console.error('createWhatsAppInstance: Primary QR generation failed:', qrError.message);
      
      // Tentar método alternativo - endpoint específico de QR
      console.log('createWhatsAppInstance: Trying alternative QR endpoint...');
      try {
        const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/qrcode/${fullInstanceName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          console.log('createWhatsAppInstance: Alternative QR Data:', JSON.stringify(qrData));
          
          if (qrData.base64) {
            qrCodeBase64 = qrData.base64;
            console.log('createWhatsAppInstance: Found QR in alternative endpoint base64 field');
          } else if (qrData.qrcode) {
            qrCodeBase64 = qrData.qrcode;
            console.log('createWhatsAppInstance: Found QR in alternative endpoint qrcode field');
          }
        }
      } catch (altError: any) {
        console.error('createWhatsAppInstance: Alternative QR generation also failed:', altError.message);
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
    
    const apiKey = '2eb6dd69c0cc273101c4efc974419be5';
    console.log('getQrCode: API Key:', apiKey);
    
    // Estratégia 1: Tentar endpoint específico de QR Code
    console.log('getQrCode: Strategy 1 - Trying QR specific endpoint');
    try {
      const qrUrl = `https://evolutionapi.chatsellpay.com/instance/qrcode/${instanceName}`;
      console.log('getQrCode: Strategy 1 URL:', qrUrl);
      
      const qrResponse = await fetch(qrUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
      });

      console.log('getQrCode: Strategy 1 response status:', qrResponse.status);
      
      if (qrResponse.ok) {
        const responseText = await qrResponse.text();
        console.log('getQrCode: Strategy 1 raw response:', responseText);
        
        let qrData = JSON.parse(responseText);
        console.log('getQrCode: Strategy 1 parsed data:', JSON.stringify(qrData, null, 2));
        
        const qrCode = extractQrCode(qrData);
        if (qrCode) {
          return new Response(JSON.stringify({ 
            success: true, 
            qrCode: qrCode,
            method: 'qrcode_endpoint'
          }), {
            status: 200,
            headers: corsHeaders,
          });
        }
      }
    } catch (e) {
      console.log('getQrCode: Strategy 1 failed:', e);
    }

    // Estratégia 2: Tentar endpoint connect
    console.log('getQrCode: Strategy 2 - Trying connect endpoint');
    try {
      const connectUrl = `https://evolutionapi.chatsellpay.com/instance/connect/${instanceName}`;
      console.log('getQrCode: Strategy 2 URL:', connectUrl);
      
      const connectResponse = await fetch(connectUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
      });

      console.log('getQrCode: Strategy 2 response status:', connectResponse.status);
      
      if (connectResponse.ok) {
        const responseText = await connectResponse.text();
        console.log('getQrCode: Strategy 2 raw response:', responseText);
        
        let qrData = JSON.parse(responseText);
        console.log('getQrCode: Strategy 2 parsed data:', JSON.stringify(qrData, null, 2));
        
        const qrCode = extractQrCode(qrData);
        if (qrCode) {
          return new Response(JSON.stringify({ 
            success: true, 
            qrCode: qrCode,
            method: 'connect_endpoint'
          }), {
            status: 200,
            headers: corsHeaders,
          });
        }
      }
    } catch (e) {
      console.log('getQrCode: Strategy 2 failed:', e);
    }

    // Estratégia 3: Tentar forçar reconexão e depois buscar QR
    console.log('getQrCode: Strategy 3 - Force reconnect then get QR');
    try {
      // Primeiro, tentar reconectar
      const reconnectUrl = `https://evolutionapi.chatsellpay.com/instance/restart/${instanceName}`;
      console.log('getQrCode: Strategy 3 restart URL:', reconnectUrl);
      
      const restartResponse = await fetch(reconnectUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
      });

      console.log('getQrCode: Strategy 3 restart status:', restartResponse.status);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tentar buscar QR novamente
      const qrUrl = `https://evolutionapi.chatsellpay.com/instance/connect/${instanceName}`;
      const qrResponse = await fetch(qrUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
      });

      if (qrResponse.ok) {
        const responseText = await qrResponse.text();
        console.log('getQrCode: Strategy 3 raw response:', responseText);
        
        let qrData = JSON.parse(responseText);
        const qrCode = extractQrCode(qrData);
        if (qrCode) {
          return new Response(JSON.stringify({ 
            success: true, 
            qrCode: qrCode,
            method: 'restart_then_connect'
          }), {
            status: 200,
            headers: corsHeaders,
          });
        }
      }
    } catch (e) {
      console.log('getQrCode: Strategy 3 failed:', e);
    }

    // Se todas as estratégias falharam
    console.log('getQrCode: All strategies failed');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'QR Code não disponível. Tente criar uma nova instância.',
      allStrategiesFailed: true
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

// Função auxiliar para extrair QR code de diferentes formatos de resposta
function extractQrCode(qrData: any): string | null {
  console.log('extractQrCode: Analyzing data keys:', Object.keys(qrData));
  
  // Verificar diferentes possíveis campos
  const possibleFields = ['base64', 'qrcode', 'code', 'qr', 'qrCode', 'data'];
  
  for (const field of possibleFields) {
    if (qrData[field]) {
      let qrCode = qrData[field];
      console.log(`extractQrCode: Found QR in field "${field}":`, qrCode.substring(0, 100) + '...');
      
      // Remover prefixo data:image se existir
      if (typeof qrCode === 'string' && qrCode.includes('data:image')) {
        qrCode = qrCode.replace(/^data:image\/[a-z]+;base64,/, '');
      }
      
      // Verificar se parece ser um base64 válido
      if (typeof qrCode === 'string' && qrCode.length > 100) {
        console.log('extractQrCode: Valid QR code found');
        return qrCode;
      }
    }
  }
  
  // Se não encontrou em campos específicos, verificar se a resposta inteira é uma string base64
  if (typeof qrData === 'string' && qrData.length > 100) {
    console.log('extractQrCode: Response is a string, treating as QR code');
    return qrData.replace(/^data:image\/[a-z]+;base64,/, '');
  }
  
  // Verificar se existe um campo que contém 'qr' no nome
  for (const [key, value] of Object.entries(qrData)) {
    if (key.toLowerCase().includes('qr') && typeof value === 'string' && value.length > 100) {
      console.log(`extractQrCode: Found QR in dynamic field "${key}"`);
      return value.replace(/^data:image\/[a-z]+;base64,/, '');
    }
  }
  
  console.log('extractQrCode: No QR code found in response');
  return null;
}