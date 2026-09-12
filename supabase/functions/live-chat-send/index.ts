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
      asset_id,
      source,
      user_id
    } = await req.json();

    const accessToken = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const { data: authData } = accessToken ? await supabase.auth.getUser(accessToken) : { data: { user: null } };
    if (!authData.user || authData.user.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: ownedSession } = await supabase
      .from('live_chat_sessions')
      .select('id, contact_name')
      .eq('id', session_id)
      .eq('user_id', authData.user.id)
      .maybeSingle();
    if (!ownedSession) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let outgoingMessage = typeof message === 'string' ? message.trim() : '';
    let outgoingType: 'text' | 'audio' | 'image' | 'document' | 'video' = 'text';
    let outgoingMediaUrl: string | null = null;
    let outgoingFileName: string | null = null;

    if (asset_id) {
      const { data: asset, error: assetError } = await supabase
        .from('sales_media_assets')
        .select('name, library_id, media_type, content, caption, storage_path, file_name')
        .eq('id', asset_id)
        .eq('is_active', true)
        .single();

      if (assetError || !asset) throw new Error('Material não encontrado ou inativo');
      const { data: membership } = await supabase
        .from('sales_library_members')
        .select('role')
        .eq('library_id', asset.library_id)
        .eq('user_id', authData.user.id)
        .maybeSingle();
      if (!membership) throw new Error('Você não tem acesso a este material');
      outgoingType = asset.media_type;
      outgoingMessage = asset.content || asset.caption || '';
      outgoingFileName = asset.file_name || asset.name;

      if (asset.storage_path) {
        const { data: signed, error: signedError } = await supabase.storage
          .from('sales-assets')
          .createSignedUrl(asset.storage_path, 3600);
        if (signedError || !signed?.signedUrl) throw new Error('Não foi possível liberar o arquivo para envio');
        outgoingMediaUrl = signed.signedUrl;
      }
    }

    outgoingMessage = outgoingMessage
      .replaceAll('{{nome}}', ownedSession.contact_name || '')
      .replaceAll('{nome}', ownedSession.contact_name || '')
      .replaceAll('{{telefone}}', contact_number)
      .replaceAll('{telefone}', contact_number);

    console.log(`📤 Enviando mensagem do humano: ${(outgoingMessage || `[${outgoingType}]`).substring(0, 50)}...`);
    console.log(`📱 Instância: ${instance_name}, Contato: ${contact_number}`);

    if ((!outgoingMessage && !outgoingMediaUrl) || !instance_name || !contact_number || !user_id) {
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
        content: outgoingMessage || `[${outgoingType}] ${outgoingFileName || ''}`.trim(),
        message_type: outgoingType,
        media_url: outgoingMediaUrl,
        source,
        is_read: true
      });

    if (msgError) {
      console.error('❌ Erro ao salvar mensagem:', msgError);
    }

    // 2. Lookup configured pause duration for this instance (fallback to 2h)
    let takeoverHours = 2;
    const { data: takeoverCfg } = await supabase
      .from('whatsapp_takeover_settings')
      .select('auto_takeover_hours')
      .eq('user_id', user_id)
      .eq('instance_name', instance_name)
      .maybeSingle();

    if (takeoverCfg?.auto_takeover_hours != null) {
      takeoverHours = Number(takeoverCfg.auto_takeover_hours);
    }

    // 999 = permanent — use a far-future date
    const takeoverMs = takeoverHours >= 999
      ? 99 * 365 * 24 * 60 * 60 * 1000
      : takeoverHours * 60 * 60 * 1000;
    const takeoverUntil = new Date(Date.now() + takeoverMs).toISOString();

    await supabase
      .from('live_chat_sessions')
      .update({
        status: 'human_takeover',
        human_takeover_until: takeoverUntil,
        last_message_at: new Date().toISOString(),
        last_message_preview: (outgoingMessage || `[${outgoingType}] ${outgoingFileName || ''}`).substring(0, 100),
        last_sender_type: 'human'
      })
      .eq('id', session_id);

    // 3a. Send via Telegram if source is telegram
    if (source === 'telegram') {
      console.log('📱 Enviando via Telegram API...');

      // Extract bot_username from instance_name (format: telegram_{bot_username})
      const botUsername = instance_name.replace(/^telegram_/, '');

      // Get bot token — match by bot_username first, fallback to any active bot
      let tgQuery = supabase
        .from('telegram_connections')
        .select('bot_token')
        .eq('user_id', user_id)
        .eq('is_active', true);

      if (botUsername) {
        tgQuery = tgQuery.eq('bot_username', botUsername);
      }

      const { data: tgConn } = await tgQuery.limit(1).single();

      if (tgConn && contact_number) {
        const tgRes = await fetch(`https://api.telegram.org/bot${tgConn.bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: parseInt(contact_number), text: message })
        });
        if (!tgRes.ok) {
          const errText = await tgRes.text();
          console.error('❌ Erro ao enviar Telegram:', errText);
        } else {
          await tgRes.text();
          console.log('✅ Mensagem enviada via Telegram');
        }
      } else {
        console.warn('⚠️ Bot Telegram não encontrado para instance_name:', instance_name);
      }
    }

    // 3b. Send via WhatsApp if source is whatsapp
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

      const evolutionHeaders = {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      };

      let sendResponse: Response;
      if (outgoingType === 'text') {
        sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance_name}`, {
          method: 'POST',
          headers: evolutionHeaders,
          body: JSON.stringify({ number: contact_number, text: outgoingMessage, delay: 1 })
        });
      } else if (outgoingType === 'audio') {
        sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instance_name}`, {
          method: 'POST',
          headers: evolutionHeaders,
          body: JSON.stringify({ number: contact_number, audio: outgoingMediaUrl, delay: 1 })
        });
      } else {
        sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instance_name}`, {
          method: 'POST',
          headers: evolutionHeaders,
          body: JSON.stringify({
            number: contact_number,
            mediatype: outgoingType,
            media: outgoingMediaUrl,
            caption: outgoingMessage,
            fileName: outgoingFileName,
            delay: 1
          })
        });
      }

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error('❌ Erro ao enviar WhatsApp:', errorText);
        throw new Error(`Failed to send WhatsApp message: ${errorText}`);
      }

      console.log('✅ Mensagem enviada via WhatsApp');
    }

    // 3c. Send via Meta (Instagram / Messenger)
    if (source === 'messenger' || source === 'instagram') {
      console.log(`📱 Enviando via Meta Graph API (${source})...`);

      // instance_name format: meta_{page_id}
      const metaPageId = instance_name.replace('meta_', '');

      const { data: metaConn } = await supabase
        .from('meta_connections')
        .select('page_access_token')
        .eq('user_id', user_id)
        .eq('page_id', metaPageId)
        .eq('is_active', true)
        .maybeSingle();

      if (metaConn?.page_access_token) {
        const sendResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: contact_number },
            messaging_type: 'RESPONSE',
            message: { text: message },
            access_token: metaConn.page_access_token
          })
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          console.error('❌ Erro ao enviar Meta:', errorText);
          throw new Error(`Failed to send Meta message: ${errorText}`);
        }

        console.log(`✅ Mensagem enviada via ${source}`);
      } else {
        console.error('❌ Conexão Meta não encontrada para page_id:', metaPageId);
      }
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
