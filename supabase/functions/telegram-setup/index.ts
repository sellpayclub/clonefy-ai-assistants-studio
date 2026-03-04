import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = userData.user.id;

    const { bot_token, assistant_id } = await req.json();

    if (!bot_token) {
      return new Response(JSON.stringify({ error: 'bot_token is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate token with Telegram getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
    const getMe = await getMeRes.json();

    if (!getMe.ok) {
      return new Response(JSON.stringify({ error: 'Token inválido. Verifique o token do BotFather.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const botInfo = getMe.result;

    // Register webhook — include bot_token as query param so webhook can identify bot
    const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook?token=${encodeURIComponent(bot_token)}`;
    const setWebhookRes = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    const setWebhook = await setWebhookRes.json();

    if (!setWebhook.ok) {
      console.error('Webhook registration failed:', setWebhook);
    }

    // Save to DB
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: conn, error: insertError } = await supabaseAdmin
      .from('telegram_connections')
      .insert({
        user_id: userId,
        bot_token,
        bot_name: botInfo.first_name,
        bot_username: botInfo.username,
        assistant_id: assistant_id || null,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Erro ao salvar conexão: ' + insertError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      bot_name: botInfo.first_name,
      bot_username: botInfo.username,
      webhook_registered: setWebhook.ok,
      connection: conn
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in telegram-setup:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
