import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GRAPH_API_VERSION = 'v19.0';

// ── OpenAI Assistants helpers (same as telegram-webhook) ──

async function getOrCreateMetaThread(
  senderId: string, pageId: string, userId: string, assistantId: string, contactName: string
) {
  // Reuse telegram_threads table with a meta-specific key
  const threadKey = `meta_${pageId}_${senderId}`;

  const { data: existing } = await supabase
    .from('telegram_threads')
    .select('openai_thread_id')
    .eq('telegram_chat_id', parseInt(senderId) || 0)
    .eq('bot_token', threadKey)
    .maybeSingle();

  if (existing) return existing.openai_thread_id;

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
    telegram_chat_id: parseInt(senderId) || 0,
    bot_token: threadKey,
    user_id: userId,
    assistant_id: assistantId,
    openai_thread_id: thread.id,
    contact_name: contactName
  });

  return thread.id;
}

async function runAssistant(threadId: string, assistantOpenAIId: string, userMessage: string): Promise<string> {
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ role: 'user', content: userMessage })
  });

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

// ── Send message via Graph API ──

async function sendMetaMessage(pageAccessToken: string, recipientId: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text },
      access_token: pageAccessToken
    })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Meta Graph API error:', err);
  }
}

// ── Main handler ──

serve(async (req) => {
  const url = new URL(req.url);

  // ── GET: Webhook Verification ──
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log(`🔐 Webhook verification: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === 'clonefy_meta_verify_2024') {
      console.log('✅ Webhook verified');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: Incoming messages ──
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const object = body.object; // 'page' for messenger, 'instagram' for instagram

      if (object !== 'page' && object !== 'instagram') {
        return new Response('ok', { status: 200 });
      }

      const platform = object === 'page' ? 'messenger' : 'instagram';

      for (const entry of body.entry || []) {
        const pageId = String(entry.id);

        for (const event of entry.messaging || []) {
          const senderId = String(event.sender?.id);
          const messageText = event.message?.text;

          if (!messageText || !senderId) continue;

          console.log(`📥 [${platform}] Message from ${senderId}: ${messageText.substring(0, 50)}...`);

          // Find meta_connection by page_id
          const { data: conn } = await supabase
            .from('meta_connections')
            .select('*, assistants(openai_assistant_id, name)')
            .eq('page_id', pageId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (!conn) {
            console.log(`⚠️ No active meta_connection for page_id ${pageId}`);
            continue;
          }

          const userId = conn.user_id;
          const assistantId = conn.assistant_id;
          const openAIAssistantId = conn.assistants?.openai_assistant_id;
          const assistantName = conn.assistants?.name;
          const pageAccessToken = conn.page_access_token;
          const instanceName = `meta_${pageId}`;
          const contactName = `${platform}_user_${senderId.slice(-4)}`;

          // Find or create live_chat_session
          const { data: existingSession } = await supabase
            .from('live_chat_sessions')
            .select('id, unread_count')
            .eq('user_id', userId)
            .eq('instance_name', instanceName)
            .eq('contact_number', senderId)
            .maybeSingle();

          let sessionId: string;

          if (existingSession) {
            sessionId = existingSession.id;
            await supabase.from('live_chat_sessions').update({
              last_message_at: new Date().toISOString(),
              last_message_preview: messageText.substring(0, 100),
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
                contact_number: senderId,
                contact_name: contactName,
                source: platform,
                status: 'ai_active',
                assistant_id: assistantId,
                assistant_name: assistantName,
                last_message_at: new Date().toISOString(),
                last_message_preview: messageText.substring(0, 100),
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
            contact_number: senderId,
            contact_name: contactName,
            sender_type: 'customer',
            content: messageText,
            message_type: 'text',
            source: platform,
            is_read: false
          });

          // Upsert CRM lead
          await supabase.from('crm_leads').upsert({
            user_id: userId,
            whatsapp_number: senderId,
            name: contactName,
            source: platform,
            last_interaction: new Date().toISOString(),
            pipeline_stage: 'novo',
            status: 'aberto',
            assistant_id: assistantId || null
          }, { onConflict: 'user_id,whatsapp_number' });

          // Check human takeover
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
            console.log('👤 Human takeover active, skipping AI');
            continue;
          }

          if (!openAIAssistantId) {
            console.log('⚠️ No assistant configured, message saved only');
            continue;
          }

          // Get or create thread & run AI
          const threadId = await getOrCreateMetaThread(senderId, pageId, userId, assistantId, contactName);
          const aiReply = await runAssistant(threadId, openAIAssistantId, messageText);

          // Send AI reply via Graph API
          await sendMetaMessage(pageAccessToken, senderId, aiReply);

          // Save AI message
          await supabase.from('live_chat_messages').insert({
            user_id: userId,
            session_id: sessionId,
            instance_name: instanceName,
            contact_number: senderId,
            contact_name: contactName,
            sender_type: 'ai',
            content: aiReply,
            message_type: 'text',
            source: platform,
            is_read: true
          });

          // Update session
          await supabase.from('live_chat_sessions').update({
            last_message_at: new Date().toISOString(),
            last_message_preview: aiReply.substring(0, 100),
            last_sender_type: 'ai'
          }).eq('id', sessionId);

          console.log(`✅ [${platform}] AI reply sent to ${senderId}`);
        }
      }

      return new Response('ok', { status: 200 });
    } catch (error) {
      console.error('❌ Error in meta-webhook:', error);
      return new Response('ok', { status: 200 }); // Always 200 to Meta
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
