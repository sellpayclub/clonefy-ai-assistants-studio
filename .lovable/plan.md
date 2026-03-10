
## Root Cause Found

The `telegram-webhook` function does:
```js
const { data: conn } = await supabase
  .from('telegram_connections')
  .select('*, assistants(openai_assistant_id, name)')
  ...
```

**The `telegram_connections` table has NO foreign key to `assistants`**, so the nested `.select('*, assistants(...)')` returns `conn.assistants = null`. This means `openAIAssistantId` is `undefined`, triggering the early return:
```js
if (!openAIAssistantId) {
  await sendTelegramMessage(botToken, chatId, 'Bot não configurado...');
  return new Response('ok', { status: 200 });  // ← exits WITHOUT saving to live_chat
}
```

Confirmed by the DB query: `telegram_connections.assistant_id` is a UUID pointing to `assistants.id`, but there's no declared FK constraint, so Supabase's relational join doesn't work.

## Fix

Replace the broken nested join with a **two-step query**: first fetch the connection, then separately fetch the assistant:

```js
// Step 1: get connection
const { data: conn } = await supabase
  .from('telegram_connections')
  .select('*')
  .eq('bot_token', botToken)
  .eq('is_active', true)
  .single();

// Step 2: get assistant separately
const { data: assistantData } = await supabase
  .from('assistants')
  .select('openai_assistant_id, name')
  .eq('id', conn.assistant_id)
  .single();
```

Then use `assistantData?.openai_assistant_id` and `assistantData?.name` in place of `conn.assistants?.openai_assistant_id` and `conn.assistants?.name`.

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/telegram-webhook/index.ts` | Replace nested join with two-step query |

After fixing, redeploy the function. All Telegram messages will then correctly:
1. Create/update `live_chat_sessions` with `source: 'telegram'`
2. Save messages to `live_chat_messages`  
3. Upsert CRM leads
4. Respond via OpenAI

No frontend changes needed — the UI already has the Telegram filter and badge from previous fixes.
