import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function getOrCreateThread(chatId: number, botToken: string, userId: string, assistantId: string, contactName: string) {
  // Look for existing thread
  const { data: existing } = await supabase
    .from('telegram_threads')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .eq('bot_token', botToken)
    .single();

  if (existing) return existing.openai_thread_id;

  // Create new OpenAI thread
  const threadRes = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({})
  });
  const thread = await threadRes.json();

  await supabase.from('telegram_threads').insert({
    telegram_chat_id: chatId,
    bot_token: botToken,
    user_id: userId,
    assistant_id: assistantId,
    openai_thread_id: thread.id,
    contact_name: contactName
  });

  return thread.id;
}

async function runAssistant(threadId: string, assistantOpenAIId: string, userMessage: string): Promise<string> {
  // Add user message to thread
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ role: 'user', content: userMessage })
  });

  // Create run
  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ assistant_id: assistantOpenAIId })
  });
  const run = await runRes.json();

  // Poll for completion
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    const status = await statusRes.json();

    if (status.status === 'completed') {
      // Get last assistant message
      const msgsRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?limit=1&order=desc`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      const msgs = await msgsRes.json();
      const lastMsg = msgs.data?.[0];
      if (lastMsg?.role === 'assistant') {
        return lastMsg.content?.[0]?.text?.value ?? '';
      }
      break;
    }
    if (['failed', 'cancelled', 'expired'].includes(status.status)) break;
    attempts++;
  }

  return 'Desculpe, não consegui processar sua mensagem.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Health check / re-register webhook utility
    const url = new URL(req.url);
    if (req.method === 'GET' && url.searchParams.get('action') === 'reregister') {
      const tokenParam = url.searchParams.get('token');
      if (!tokenParam) return new Response(JSON.stringify({ error: 'token required' }), { status: 400, headers: corsHeaders });
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook?token=${encodeURIComponent(tokenParam)}`;
      const res = await fetch(`https://api.telegram.org/bot${tokenParam}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      const result = await res.json();
      console.log('Re-register webhook result:', JSON.stringify(result));
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const update = await req.json();
    const message = update?.message;

    if (!message || !message.text) {
      return new Response('ok', { status: 200 });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text;
    const contactName: string = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || 'Telegram User';
    const contactUsername: string = message.from?.username ?? '';

    // Extract bot token from request URL (Telegram sends to our exact webhook URL)
    // We need to find which bot this belongs to — we match by looking up the URL path
    // Since we use a single webhook endpoint, we identify the bot by looking at the
    // URL query param we set during setWebhook, or by checking all active connections
    // and matching by recent activity. Actually, Telegram sends to the URL we registered,
    // so we registered with the specific URL but all bots point here.
    // We need to match bot_token — we'll store it in the webhook URL as a query param.

    // Re-read: We registered webhook as /telegram-webhook without token in URL.
    // So we need to figure out which bot this came from.
    // The simplest approach: check request headers for x-telegram-bot-api-secret-token
    // OR: register webhook per bot with ?token=xxx in URL and read it here.
    
    // We'll extract from URL query param if present, else scan all connections.
    let botToken = url.searchParams.get('token') ?? '';

    if (!botToken) {
      // Fallback: find which connection has a bot that recently received this chat
      // This is suboptimal but works if user has few bots
      // Better: we'll fix telegram-setup to include ?token= in webhook URL
      return new Response('ok', { status: 200 });
    }

    // Step 1: Find the connection for this bot token
    const { data: conn } = await supabase
      .from('telegram_connections')
      .select('*')
      .eq('bot_token', botToken)
      .eq('is_active', true)
      .single();

    if (!conn) {
      console.log('No active connection for this bot token');
      return new Response('ok', { status: 200 });
    }

    const userId = conn.user_id;
    const assistantId = conn.assistant_id;

    // Step 2: Fetch assistant separately (no FK constraint on telegram_connections)
    let openAIAssistantId: string | null = null;
    let assistantName: string | null = null;

    if (assistantId) {
      const { data: assistantData } = await supabase
        .from('assistants')
        .select('openai_assistant_id, name')
        .eq('id', assistantId)
        .single();
      openAIAssistantId = assistantData?.openai_assistant_id ?? null;
      assistantName = assistantData?.name ?? null;
    }

    if (!openAIAssistantId) {
      console.log('No assistant configured for this bot, saving message without AI response');
      // Still save to live_chat even without AI — don't early return
    }

    // Save incoming message to live_chat_messages
    const instanceName = `telegram_${conn.bot_username ?? 'bot'}`;
    const contactNumberStr = String(chatId);

    // Find or create live_chat_session by user_id + instance_name + contact_number
    const { data: existingSession } = await supabase
      .from('live_chat_sessions')
      .select('id, unread_count')
      .eq('user_id', userId)
      .eq('instance_name', instanceName)
      .eq('contact_number', contactNumberStr)
      .maybeSingle();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
      await supabase.from('live_chat_sessions').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: text.substring(0, 100),
        last_sender_type: 'customer',
        contact_name: contactName,
        unread_count: (existingSession.unread_count || 0) + 1
      }).eq('id', sessionId);
    } else {
      const { data: newSession } = await supabase
        .from('live_chat_sessions')
        .insert({
          user_id: userId,
          instance_name: instanceName,
          contact_number: contactNumberStr,
          contact_name: contactName,
          source: 'telegram',
          status: 'ai_active',
          assistant_id: conn.assistant_id,
          assistant_name: assistantName,
          last_message_at: new Date().toISOString(),
          last_message_preview: text.substring(0, 100),
          last_sender_type: 'customer',
          unread_count: 1
        })
        .select('id')
        .single();
      sessionId = newSession?.id ?? crypto.randomUUID();
    }

    // Save customer message
    await supabase.from('live_chat_messages').insert({
      user_id: userId,
      session_id: sessionId,
      instance_name: instanceName,
      contact_number: contactNumberStr,
      contact_name: contactName,
      sender_type: 'customer',
      content: text,
      message_type: 'text',
      source: 'telegram',
      is_read: false
    });

    // Upsert CRM lead
    await supabase.from('crm_leads').upsert({
      user_id: userId,
      whatsapp_number: contactNumberStr,
      name: contactName,
      source: 'telegram',
      last_interaction: new Date().toISOString(),
      pipeline_stage: 'novo',
      status: 'aberto',
      assistant_id: assistantId || null
    }, { onConflict: 'user_id,whatsapp_number' });

    // Check if human takeover is active for this session (re-read after insert)
    const { data: liveSession } = await supabase
      .from('live_chat_sessions')
      .select('status, human_takeover_until')
      .eq('id', sessionId)
      .single();

    const now = new Date();
    const isHumanTakeover = liveSession?.status === 'human_takeover' &&
      liveSession?.human_takeover_until &&
      new Date(liveSession.human_takeover_until) > now;

    if (isHumanTakeover) {
      console.log('Human takeover active, skipping AI response');
      return new Response('ok', { status: 200 });
    }

    // Only run AI if assistant is configured and no human takeover
    if (!openAIAssistantId) {
      console.log('No OpenAI assistant configured, message saved to live_chat only');
      return new Response('ok', { status: 200 });
    }

    // Get or create isolated OpenAI thread
    const threadId = await getOrCreateThread(chatId, botToken, userId, assistantId, contactName);

    // Run assistant
    const aiReply = await runAssistant(threadId, openAIAssistantId, text);

    // Send reply via Telegram
    await sendTelegramMessage(botToken, chatId, aiReply);

    // Save AI message to live_chat_messages
    await supabase.from('live_chat_messages').insert({
      user_id: userId,
      session_id: sessionId,
      instance_name: instanceName,
      contact_number: contactNumberStr,
      contact_name: contactName,
      sender_type: 'ai',
      content: aiReply,
      message_type: 'text',
      source: 'telegram',
      is_read: true
    });

    // Update session with AI response
    await supabase.from('live_chat_sessions').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: aiReply.substring(0, 100),
      last_sender_type: 'ai'
    }).eq('id', sessionId);

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('Error in telegram-webhook:', error);
    return new Response('ok', { status: 200 }); // Always 200 to Telegram
  }
});
