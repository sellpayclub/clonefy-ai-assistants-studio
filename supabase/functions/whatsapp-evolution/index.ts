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
  action: 'create' | 'list' | 'delete' | 'test_api' | 'get_qr';
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

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { action, instanceName, assistantId, userEmail } = body;

    console.log('WhatsApp Evolution: Action:', action);

    switch (action) {
      case 'create':
        return await createWhatsAppInstanceSequential(instanceName!, assistantId!, userEmail!, supabaseClient);
      case 'list':
        return await listConnections(supabaseClient, user.email!);
      case 'delete':
        return await deleteConnection(instanceName!, supabaseClient);
      case 'get_qr':
        return await getQrCode(instanceName!, supabaseClient);
      case 'test_api':
        return await testEvolutionAPI();
      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('WhatsApp Evolution: Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createWhatsAppInstanceSequential(
  instanceName: string,
  assistantId: string,
  userEmail: string,
  supabaseClient: any
) {
  try {
    console.log('=== STEP 1: Creating instance ===');
    
    // 1. Criar Instância (Primeira chamada)
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        integration: "WHATSAPP-BAILEYS",
        token: `${instanceName}_${Date.now()}` // Token único baseado no nome da instância
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('Step 1 failed:', errorData);
      throw new Error(`Failed to create instance: ${errorData}`);
    }

    const createData = await createResponse.json();
    console.log('Step 1 SUCCESS:', createData);

    console.log('=== STEP 2: Setting webhook ===');
    
    // 2. Configurar Webhook (Segunda chamada - só após sucesso da primeira)
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
      }),
    });

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text();
      console.error('Step 2 failed:', errorData);
      // Aguardar e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryWebhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
        }),
      });
      
      if (!retryWebhookResponse.ok) {
        throw new Error(`Failed to set webhook after retry`);
      }
      
      const webhookData = await retryWebhookResponse.json();
      console.log('Step 2 SUCCESS (retry):', webhookData);
    } else {
      const webhookData = await webhookResponse.json();
      console.log('Step 2 SUCCESS:', webhookData);
    }

    console.log('=== STEP 3: Connecting and generating QR ===');
    
    // 3. Conectar e Gerar QR (Terceira chamada - só após webhook configurado)
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      console.error('Step 3 failed:', errorData);
      throw new Error(`Failed to connect instance: ${errorData}`);
    }

    const connectData = await connectResponse.json();
    console.log('Step 3 SUCCESS:', connectData);

    const qrCode = connectData.base64;
    
    if (!qrCode || !qrCode.startsWith('data:image/')) {
      console.error('QR Code inválido:', qrCode);
      throw new Error('QR Code not generated or invalid format');
    }

    console.log('=== STEP 4: Saving to Supabase ===');
    
    // 4. Salvar no Supabase (Quarta ação - só após QR gerado)
    const { data: insertData, error } = await supabaseClient
      .from('n8n_fluxogpt')
      .insert({
        id: Date.now(), // bigint precisa de valor explícito
        nomeinstancia: instanceName,
        idassistentgpt: assistantId,
        emailuser: userEmail,
        timeout: '45' // QR expira em 45 segundos
      })
      .select()
      .single();

    if (error) {
      console.error('Step 4 failed:', error);
      throw new Error(`Failed to save to database: ${error.message}`);
    }

    console.log('Step 4 SUCCESS:', insertData);

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: instanceName,
        qrCode: qrCode,
        message: 'Instance created successfully! QR Code expires in 45 seconds.',
        data: insertData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('createWhatsAppInstanceSequential error:', error);
    throw error;
  }
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

async function getQrCode(instanceName: string, supabaseClient: any) {
  try {
    console.log('=== Getting QR Code for instance:', instanceName, '===');
    
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      console.error('Failed to get QR code:', errorData);
      throw new Error(`Failed to get QR code: ${errorData}`);
    }

    const connectData = await connectResponse.json();
    console.log('QR Code response:', connectData);

    const qrCode = connectData.base64;
    
    if (!qrCode || !qrCode.startsWith('data:image/')) {
      console.error('Invalid QR Code:', qrCode);
      throw new Error('QR Code not generated or invalid format');
    }

    return new Response(
      JSON.stringify({
        success: true,
        base64: qrCode,
        message: 'QR Code generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error: any) {
    console.error('Error in getQrCode:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function testEvolutionAPI() {
  try {
    const testResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });
    
    const responseText = await testResponse.text();
    
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}