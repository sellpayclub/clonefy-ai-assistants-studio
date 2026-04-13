import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = '94805bfbb25f77f37a029f5a3dbfe62b';
const WEBHOOK_URL = 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/whatsapp-webhook';

interface CreateInstanceRequest {
  action: 'create' | 'create_financial' | 'list' | 'delete' | 'test_api' | 'get_qr' | 'check_status';
  instanceName?: string;
  assistantId?: string;
  userEmail?: string;
  elevenLabsApiKey?: string;
  voiceId?: string;
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
    const { action, instanceName, assistantId, userEmail, elevenLabsApiKey, voiceId, webhookUrl } = body;

    console.log('WhatsApp Evolution: Action:', action);

    switch (action) {
      case 'create':
        return await createWhatsAppInstanceSequential(instanceName!, assistantId || null, userEmail!, supabaseClient, elevenLabsApiKey, voiceId, webhookUrl);
      case 'create_financial':
        return await createFinancialInstance(instanceName!, supabaseClient, webhookUrl);
      case 'list':
        return await listConnections(supabaseClient, user.email!);
      case 'delete':
        return await deleteConnection(instanceName!, supabaseClient);
      case 'get_qr':
        return await getQrCode(instanceName!, supabaseClient);
      case 'check_status':
        return await checkConnectionStatus(instanceName!, supabaseClient);
      case 'test_api':
        return await testEvolutionAPI();
      case 'update_voice':
        return await updateVoiceSettings(supabaseClient, body, user.email!);
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
  assistantId: string | null,
  userEmail: string,
  supabaseClient: any,
  elevenLabsApiKey?: string,
  voiceId?: string,
  customWebhookUrl?: string
) {
  try {
    console.log('=== STEP 0: Checking if instance already exists ===');

    // 0. Verificar se instância já existe no banco de dados
    const { data: existingInstance } = await supabaseClient
      .from('n8n_fluxogpt')
      .select('*')
      .eq('nomeinstancia', instanceName)
      .eq('emailuser', userEmail)
      .single();

    if (existingInstance) {
      throw new Error(`Uma instância com o nome "${instanceName}" já existe. Escolha um nome diferente.`);
    }

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
        reject_call: false,
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: true
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('Step 1 failed:', errorData);

      // Verificar se é erro de nome duplicado
      if (errorData.includes('already in use') || errorData.includes('já está em uso')) {
        throw new Error(`O nome "${instanceName}" já está sendo usado. Escolha um nome diferente.`);
      }

      throw new Error(`Falha ao criar instância: ${errorData}`);
    }

    const createData = await createResponse.json();
    console.log('Step 1 SUCCESS:', createData);

    console.log('=== STEP 2: Setting webhook ===');

    // Aguardar um pouco antes de configurar webhook
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Configurar Webhook (Segunda chamada - só após sucesso da primeira)
    const webhookPayload = {
      webhook: {
        url: customWebhookUrl || WEBHOOK_URL,
        enabled: true,
        events: ["MESSAGES_UPSERT"],
        webhook_by_events: false,
        webhook_base64: true
      }
    };

    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text();
      console.error('Step 2 failed:', errorData);
      console.warn('Webhook configuration failed, but continuing with instance creation...');
      // Não falhar aqui, pois o webhook pode ser configurado depois
    } else {
      const webhookData = await webhookResponse.json();
      console.log('Step 2 SUCCESS:', webhookData);
    }

    console.log('=== STEP 3: Setting additional instance settings ===');

    // 3a. Configurar settings da instância
    const settingsPayload = {
      settings: {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: false, // Ignore Groups: Enabled = false
        alwaysOnline: true,  // Always Online: Enabled
        readMessages: true,  // Read Messages: Enabled
        readStatus: false,
        syncFullHistory: true, // Sync Full History: Enabled
        wavoipToken: ""
      }
    };

    const settingsResponse = await fetch(`${EVOLUTION_API_URL}/settings/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(settingsPayload),
    });

    if (!settingsResponse.ok) {
      const errorData = await settingsResponse.text();
      console.warn('Settings configuration failed, but continuing:', errorData);
    } else {
      const settingsData = await settingsResponse.json();
      console.log('Settings configured successfully:', settingsData);
    }

    console.log('=== STEP 4: Connecting and generating QR ===');

    // 4. Conectar e Gerar QR (após configurações)
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      console.error('Step 4 failed:', errorData);
      throw new Error(`Failed to connect instance: ${errorData}`);
    }

    const connectData = await connectResponse.json();
    console.log('Step 4 SUCCESS:', connectData);

    const qrCode = connectData.base64;

    if (!qrCode || !qrCode.startsWith('data:image/')) {
      console.error('QR Code inválido:', qrCode);
      throw new Error('QR Code not generated or invalid format');
    }

    let openaiAssistantIdValue = '';

    if (assistantId) {
      console.log('=== STEP 5: Getting OpenAI Assistant ID ===');

      // 4. Buscar o openai_assistant_id do assistente
      const { data: assistantData, error: assistantError } = await supabaseClient
        .from('assistants')
        .select('openai_assistant_id')
        .eq('id', assistantId)
        .single();

      if (assistantError || !assistantData) {
        console.error('Failed to get assistant data:', assistantError);
        throw new Error(`Assistente não encontrado: ${assistantError?.message}`);
      }

      openaiAssistantIdValue = assistantData.openai_assistant_id;
    } else {
      console.log('=== STEP 5: No assistant selected (CRM-only mode) ===');
    }

    console.log('=== STEP 6: Saving to Supabase ===');

    // 5. Salvar no Supabase com o openai_assistant_id correto e campos ElevenLabs
    const dbData: any = {
      id: Date.now(), // bigint precisa de valor explícito
      nomeinstancia: instanceName,
      idassistentgpt: openaiAssistantIdValue, // Vazio se CRM-only
      emailuser: userEmail,
      timeout: '45' // QR expira em 45 segundos
    };

    // Adicionar campos ElevenLabs se fornecidos
    if (elevenLabsApiKey) {
      dbData.ApiELEVEN = elevenLabsApiKey;
    }

    if (voiceId) {
      dbData.IDvoz = voiceId;
    }

    const { data: insertData, error } = await supabaseClient
      .from('n8n_fluxogpt')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Step 6 failed:', error);
      throw new Error(`Failed to save to database: ${error.message}`);
    }

    console.log('Step 6 SUCCESS:', insertData);

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: instanceName,
        qrCode: qrCode,
        message: 'Instância criada com sucesso! QR Code expira em 45 segundos.',
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

// Simplified instance creation for Financial Agent (no OpenAI assistant needed)
async function createFinancialInstance(
  instanceName: string,
  supabaseClient: any,
  customWebhookUrl?: string
) {
  try {
    const webhookUrl = customWebhookUrl || 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/financial-webhook';
    
    console.log('=== FINANCIAL: Creating instance:', instanceName, '===');

    // 1. Create Instance
    const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
      body: JSON.stringify({
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        reject_call: false,
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: false
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error('Financial: Create failed:', errorData);
      if (errorData.includes('already in use') || errorData.includes('já está em uso')) {
        // Instance already exists, try to just get QR
        console.log('Financial: Instance exists, getting QR...');
      } else {
        throw new Error(`Falha ao criar instância: ${errorData}`);
      }
    } else {
      console.log('Financial: Instance created');
    }

    // 2. Wait and set webhook
    await new Promise(resolve => setTimeout(resolve, 2000));

    const webhookPayload = {
      webhook: {
        url: webhookUrl,
        enabled: true,
        events: ["MESSAGES_UPSERT"],
        webhook_by_events: false,
        webhook_base64: true
      }
    };

    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      console.warn('Financial: Webhook config failed, continuing...');
    } else {
      console.log('Financial: Webhook configured');
    }

    // 3. Connect and get QR
    const connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    if (!connectResponse.ok) {
      const errorData = await connectResponse.text();
      throw new Error(`Failed to connect instance: ${errorData}`);
    }

    const connectData = await connectResponse.json();
    const qrCode = connectData.base64;

    if (!qrCode || !qrCode.startsWith('data:image/')) {
      throw new Error('QR Code not generated');
    }

    console.log('Financial: QR Code generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        instanceName,
        qrCode,
        message: 'Instância financeira criada! QR Code expira em 45 segundos.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('createFinancialInstance error:', error);
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

  // Check status of each connection in Evolution API and update database
  const connectionsWithStatus = await Promise.all(
    (data || []).map(async (connection: any) => {
      try {
        console.log(`=== CHECKING STATUS for: ${connection.nomeinstancia} ===`);

        const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${connection.nomeinstancia}`, {
          method: 'GET',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        });

        console.log(`Status response for ${connection.nomeinstancia}: ${statusResponse.status}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`Full status data for ${connection.nomeinstancia}:`, JSON.stringify(statusData, null, 2));

          // Extract comprehensive connection info
          let connectionInfo = {
            whatsappuser: null,
            profileName: null,
            phoneNumber: null,
            profilePicUrl: null,
            state: null
          };

          console.log(`Raw response structure for ${connection.nomeinstancia}:`, {
            hasInstance: !!statusData.instance,
            hasState: !!statusData.state,
            instanceState: statusData.instance?.state,
            instanceOwner: statusData.instance?.owner,
            instanceProfileName: statusData.instance?.profileName,
            instanceProfilePicUrl: statusData.instance?.profilePicUrl,
            instanceNumber: statusData.instance?.number || statusData.instance?.phone,
            keys: Object.keys(statusData)
          });

          // Try different response formats from Evolution API
          if (statusData.instance) {
            connectionInfo.state = statusData.instance.state;

            if (statusData.instance.state === 'open' || statusData.instance.state === 'connected') {
              connectionInfo.whatsappuser = statusData.instance.owner ||
                statusData.instance.profileName ||
                statusData.instance.user ||
                'Conectado';
              connectionInfo.profileName = statusData.instance.profileName || statusData.instance.owner;
              connectionInfo.phoneNumber = statusData.instance.number || statusData.instance.phone;
              connectionInfo.profilePicUrl = statusData.instance.profilePicUrl || statusData.instance.picture;
            }
          } else if (statusData.state) {
            connectionInfo.state = statusData.state;

            if (statusData.state === 'open' || statusData.state === 'connected') {
              connectionInfo.whatsappuser = statusData.owner ||
                statusData.profileName ||
                statusData.user ||
                'Conectado';
              connectionInfo.profileName = statusData.profileName || statusData.owner;
              connectionInfo.phoneNumber = statusData.number || statusData.phone;
              connectionInfo.profilePicUrl = statusData.profilePicUrl || statusData.picture;
            }
          }

          console.log(`Connection ${connection.nomeinstancia} - Extracted info:`, connectionInfo);

          // Update database with comprehensive info
          if (connectionInfo.whatsappuser !== connection.whatsappuser) {
            console.log(`🔄 UPDATING database for ${connection.nomeinstancia} with comprehensive data`);

            const updateData: any = { whatsappuser: connectionInfo.whatsappuser };

            // Store additional data in JSON format if available
            if (connectionInfo.profileName || connectionInfo.phoneNumber || connectionInfo.profilePicUrl) {
              updateData.message = JSON.stringify({
                profileName: connectionInfo.profileName,
                phoneNumber: connectionInfo.phoneNumber,
                profilePicUrl: connectionInfo.profilePicUrl,
                lastUpdated: new Date().toISOString()
              });
            }

            const { error: updateError } = await supabaseClient
              .from('n8n_fluxogpt')
              .update(updateData)
              .eq('id', connection.id);

            if (updateError) {
              console.error(`❌ Failed to update ${connection.nomeinstancia}:`, updateError);
            } else {
              console.log(`✅ Successfully updated ${connection.nomeinstancia} with profile data`);
            }
          }

          // Update connection object with new data
          connection.whatsappuser = connectionInfo.whatsappuser;
          if (connectionInfo.profileName || connectionInfo.phoneNumber || connectionInfo.profilePicUrl) {
            connection.message = JSON.stringify({
              profileName: connectionInfo.profileName,
              phoneNumber: connectionInfo.phoneNumber,
              profilePicUrl: connectionInfo.profilePicUrl,
              lastUpdated: new Date().toISOString()
            });
          }
        } else {
          const errorText = await statusResponse.text();
          console.warn(`❌ Failed to fetch status for ${connection.nomeinstancia}: ${statusResponse.status} - ${errorText}`);
        }
      } catch (error) {
        console.error(`💥 ERROR checking status for ${connection.nomeinstancia}:`, error);
        // Keep original whatsappuser value
      }

      return connection;
    })
  );

  return new Response(
    JSON.stringify({ connections: connectionsWithStatus }),
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

async function checkConnectionStatus(instanceName: string, supabaseClient: any) {
  try {
    console.log(`=== CHECKING SINGLE CONNECTION STATUS for: ${instanceName} ===`);

    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    console.log(`Status response: ${statusResponse.status}`);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`Failed to get status: ${statusResponse.status} - ${errorText}`);
      throw new Error(`Failed to get connection status: ${errorText}`);
    }

    const statusData = await statusResponse.json();
    console.log(`Status data:`, JSON.stringify(statusData, null, 2));

    // Check multiple possible response formats
    let whatsappUser = null;
    let connectionState = 'disconnected';

    console.log(`Raw response structure:`, {
      hasInstance: !!statusData.instance,
      hasState: !!statusData.state,
      instanceState: statusData.instance?.state,
      directState: statusData.state,
      keys: Object.keys(statusData),
      fullData: statusData
    });

    // Try different response formats from Evolution API
    if (statusData.instance) {
      connectionState = statusData.instance.state || 'disconnected';
      // Multiple ways to detect connection and get user info
      if (statusData.instance.state === 'open' || statusData.instance.state === 'connected') {
        whatsappUser = statusData.instance.owner ||
          statusData.instance.phone ||
          statusData.instance.number ||
          statusData.instance.user ||
          statusData.instance.profileName ||
          statusData.instance.wid ||
          'Conectado';
      }
    } else if (statusData.state) {
      connectionState = statusData.state || 'disconnected';
      if (statusData.state === 'open' || statusData.state === 'connected') {
        whatsappUser = statusData.owner ||
          statusData.phone ||
          statusData.number ||
          statusData.user ||
          statusData.profileName ||
          statusData.wid ||
          'Conectado';
      }
    } else {
      // Fallback: try to detect connection by presence of user data
      const userIndicators = [
        statusData.owner, statusData.phone, statusData.number,
        statusData.user, statusData.profileName, statusData.wid
      ].filter(Boolean);

      if (userIndicators.length > 0) {
        connectionState = 'open';
        whatsappUser = userIndicators[0];
      }
    }

    console.log(`Final status - State: ${connectionState}, User: ${whatsappUser}`);

    // Update database
    const { error: updateError } = await supabaseClient
      .from('n8n_fluxogpt')
      .update({ whatsappuser: whatsappUser })
      .eq('nomeinstancia', instanceName);

    if (updateError) {
      console.error(`Failed to update database:`, updateError);
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        instanceName: instanceName,
        state: connectionState,
        whatsappUser: whatsappUser,
        isConnected: connectionState === 'open' && !!whatsappUser,
        rawData: statusData,
        message: `Status checked and updated successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in checkConnectionStatus:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        instanceName: instanceName
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

/**
 * Update voice settings for existing connection
 */
async function updateVoiceSettings(supabaseClient: any, body: any, userEmail: string) {
  const { instance_name, voice_id, api_key } = body;

  if (!instance_name) {
    return new Response(
      JSON.stringify({ error: 'Instance name is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log(`WhatsApp Evolution: Updating voice settings for instance: ${instance_name}`);

    // Build update object with only provided values
    const updateData: any = {};
    if (voice_id !== null) updateData.IDvoz = voice_id || null;
    if (api_key !== null) updateData.ApiELEVEN = api_key || null;

    // Update the record in Supabase
    const { data, error } = await supabaseClient
      .from('n8n_fluxogpt')
      .update(updateData)
      .eq('nomeinstancia', instance_name)
      .eq('emailuser', userEmail)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update voice settings in database'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Connection not found or no access'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`WhatsApp Evolution: Voice settings updated successfully for ${instance_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice settings updated successfully',
        data: data[0]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Update voice settings error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}