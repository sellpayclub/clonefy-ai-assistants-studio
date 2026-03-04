
## Telegram Integration — Architecture & Plan

### Goal
Add Telegram as a **fully isolated, independent channel** that:
- Does NOT touch any existing WhatsApp code, tables, or edge functions
- Feeds into the same Live Chat panel (with a `source: 'telegram'` badge)
- Creates leads in CRM with `source: 'telegram'`
- Has its own connection page with step-by-step instructions for users

---

### What will be created

**Database (1 new table)**
```
telegram_connections
  id, user_id, bot_token, bot_name, bot_username,
  assistant_id, is_active, created_at
```
- RLS: users see only their own rows
- Completely separate from `n8n_fluxogpt` (WhatsApp table)

**Thread isolation** → new table `telegram_threads`
```
  id, telegram_chat_id, bot_token, user_id,
  assistant_id, openai_thread_id, created_at
```
Same isolation pattern as WhatsApp but using `telegram_chat_id` as the key instead of `instanceName + contactNumber`.

**Edge Functions (2 new, isolated)**

1. `telegram-setup` — called from UI when user pastes token
   - Calls Telegram `getMe` to validate token + get bot name
   - Calls `setWebhook` to register the webhook URL automatically
   - Saves connection to `telegram_connections`
   - verify_jwt = true (called from authenticated dashboard)

2. `telegram-webhook` — receives messages from Telegram
   - Finds bot connection via `bot_token`
   - Finds/creates isolated thread in `telegram_threads`
   - Calls OpenAI assistant, replies via Telegram `sendMessage`
   - Saves lead in `crm_leads` with `source: 'telegram'`
   - Saves message in `live_chat_messages` with `source: 'telegram'`
   - Upserts `live_chat_sessions` with `source: 'telegram'`
   - verify_jwt = false (public webhook from Telegram)

**`live-chat-send` edge function — minimal addition**
- Add `source === 'telegram'` branch that calls Telegram `sendMessage` API
- This is the only touch to existing code, and it's additive (no changes to existing branches)

**New page: `src/pages/Telegram.tsx`**
- Step-by-step visual guide (3 steps with numbered cards):
  1. Open Telegram → search `@BotFather` → send `/newbot`
  2. Choose name → copy the token provided
  3. Paste token + select assistant → click Connect
- Form: token input + assistant selector
- "Connect" button → calls `telegram-setup`
- List of active bots with status, bot username, connected assistant
- Delete button per connection

**Sidebar + routing**
- Add Telegram icon to `AppSidebar.tsx` (between WhatsApp and Live Chat)
- Add `/telegram` route in `App.tsx`

---

### Architecture flow

```text
User's Telegram client
        │
        ▼
Telegram Bot API ──POST──► telegram-webhook (edge function)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             telegram_threads  crm_leads  live_chat_messages
             (find/create)    (upsert)   (insert, source=telegram)
                    │                        │
                    ▼                        ▼
             OpenAI Assistants         live_chat_sessions
                    │                  (upsert, source=telegram)
                    ▼
             Telegram sendMessage ──► User's Telegram
```

### Live Chat integration
The existing `useLiveChat` hook and UI already use `source` field on sessions — it will show `telegram` sessions alongside WhatsApp/widget ones **with zero changes** to the hook or Live Chat UI. The session list will show a Telegram badge automatically because it's just another row in `live_chat_sessions`.

For human replies from Live Chat → `live-chat-send` will get a new `telegram` branch calling `https://api.telegram.org/bot{token}/sendMessage`.

---

### Files touched / created

| Action | File |
|--------|------|
| CREATE | `supabase/functions/telegram-webhook/index.ts` |
| CREATE | `supabase/functions/telegram-setup/index.ts` |
| CREATE | `src/pages/Telegram.tsx` |
| MODIFY | `src/App.tsx` — add `/telegram` lazy route |
| MODIFY | `src/components/AppSidebar.tsx` — add menu item |
| MODIFY | `supabase/config.toml` — `verify_jwt = false` for telegram-webhook |
| MODIFY | `supabase/functions/live-chat-send/index.ts` — add telegram branch |
| MIGRATION | `telegram_connections` + `telegram_threads` tables with RLS |

### No files touched
- `whatsapp-webhook` — untouched
- `n8n_fluxogpt` table — untouched
- All other WhatsApp pages — untouched
- CRM hook — untouched (same `crm_leads` table, just new rows with source=telegram)
