import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution API Config
const EVOLUTION_API_URL = 'https://evolutionapi.clonefyia.com';
const EVOLUTION_API_KEY = '94805bfbb25f77f37a029f5a3dbfe62b';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      session_id,
      instance_name, 
      contact_number, 
      message, 
      source,
      user_id
    } = await req.json();

    console.log(`📤 Enviando mensagem do humano: ${message.substring(0, 50)}...`);
    console.log(`📱 Instância: ${instance_name}, Contato: ${contact_number}`);

    if (!message || !instance_name || !contact_number || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Save message to live_chat_messages
    const { error: msgError } = await supabase
      .from('live_chat_messages')
      .insert({
        user_id,
        session_id,
        instance_name,
        contact_number,
        sender_type: 'human',
        content: message,
        message_type: 'text',
        source,
        is_read: true
      });

    if (msgError) {
      console.error('❌ Erro ao salvar mensagem:', msgError);
    }

    // 2. Update session
    const takeoverUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from('live_chat_sessions')
      .update({
        status: 'human_takeover',
        human_takeover_until: takeoverUntil,
        last_message_at: new Date().toISOString(),
        last_message_preview: message.substring(0, 100),
        last_sender_type: 'human'
      })
      .eq('id', session_id);

    // 3. Send via WhatsApp if source is whatsapp
    if (source === 'whatsapp') {
      console.log('📱 Enviando via WhatsApp Evolution API...');

      // Also update n8n_fluxogpt for human takeover
      await supabase
        .from('n8n_fluxogpt')
        .update({ 
          human_takeover_until: takeoverUntil,
          last_message_at: new Date().toISOString(),
          last_sender: 'human'
        })
        .eq('nomeinstancia', instance_name)
        .eq('whatsappuser', contact_number);

      // Send message via Evolution API
      const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: contact_number,
          text: message,
          delay: 1
        })
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error('❌ Erro ao enviar WhatsApp:', errorText);
        throw new Error(`Failed to send WhatsApp message: ${errorText}`);
      }

      console.log('✅ Mensagem enviada via WhatsApp');
    }

    // 4. For widget, we would need to use realtime or websockets
    // For now, widget messages are handled by the frontend directly

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Message sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no live-chat-send:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
