
## Complete Analysis

### Current State
1. **`ChatWindow.tsx`**: "Pausar IA" button calls `onToggleTakeover(session.id)` with no duration → falls to default `2` hours in `useLiveChat`. Dropdown has fixed options 1h/4h/8h. Footer text is hardcoded "2 horas".
2. **`useLiveChat.ts`**: `toggleHumanTakeover(sessionId, duration = 2)` — default is hardcoded 2h. No persistence of preferred duration.
3. **`live-chat-send/index.ts`**: Line 63 hardcodes `2 * 60 * 60 * 1000` (2h) when operator sends message from panel.
4. **`whatsapp-webhook/index.ts`**: Line 229 hardcodes `2 * 60 * 60 * 1000` when owner replies from native WhatsApp.

### What Will Change (surgically, nothing else touched)

**1. Database migration** — new table `whatsapp_takeover_settings`
- `user_id`, `instance_name`, `auto_takeover_hours integer DEFAULT 2`
- Unique on `(user_id, instance_name)`
- RLS: user can only manage their own rows

**2. `ChatWindow.tsx`** — Add duration selector next to "Pausar IA" button
- New local state `pauseDuration` (default: `2`)
- A `<Select>` with options: `0.5h (30min) / 1h / 2h / 4h / 8h / 24h / 0 (Permanente)`
- "Pausar IA" button uses `pauseDuration` instead of no arg
- Footer text dynamically shows the selected duration
- When session changes, load saved default for that instance from `whatsapp_takeover_settings`
- When user changes the select, save new default to the table (debounced upsert)
- The selector only shows when `!isTakeover` (irrelevant when already in takeover)

**3. `useLiveChat.ts`** — No structural changes. `toggleHumanTakeover` already accepts `duration` param and works correctly. Just ensure `sendMessage` reads saved setting.
- Add `saveTakeoverDefault(instanceName, hours)` and `loadTakeoverDefault(instanceName)` helper calls used by ChatWindow
- Export `defaultTakeoverHours` state per session (simpler: just pass it back up from ChatWindow)

Actually simpler approach: keep all state in `ChatWindow` since the select is a UI concern. The hook already works. ChatWindow just needs to:
- Have a `pauseDuration` state
- Load/save to `whatsapp_takeover_settings` per `session.instance_name`
- Pass `pauseDuration` to `onToggleTakeover(session.id, pauseDuration)`

**4. `live-chat-send/index.ts`** — Accept optional `takeover_hours` param
- If provided, use it. Otherwise fall back to `whatsapp_takeover_settings` for the instance, else 2h.
- Frontend passes `takeover_hours` from `useLiveChat.sendMessage`

**5. `useLiveChat.ts` `sendMessage`** — Accept optional duration, pass to `live-chat-send`. Need to thread it from ChatWindow → sendMessage.

Actually the cleanest approach without overcomplicating:
- ChatWindow stores `pauseDuration` state (local + persisted per instance)
- Pass `pauseDuration` through `onSendMessage` call — but `onSendMessage` currently takes only `content`
- **Alternative (cleaner)**: Add `defaultTakeoverHours` prop to `ChatWindow`, and update `useLiveChat` to expose/store it

**Cleanest no-regression approach:**
1. `ChatWindow` has local `pauseDuration` state, loads/saves to DB independently
2. `onToggleTakeover` call passes `pauseDuration` (already supported by hook)
3. `onSendMessage` stays signature-same — the `live-chat-send` edge function reads from `whatsapp_takeover_settings` itself
4. `live-chat-send`: reads `whatsapp_takeover_settings` for the instance, uses `auto_takeover_hours` (falls back to 2)
5. Webhook `fromMe` block: same — reads from `whatsapp_takeover_settings`

### Files to Change
| File | Change |
|---|---|
| Migration SQL | New `whatsapp_takeover_settings` table |
| `src/components/live-chat/ChatWindow.tsx` | Add duration select, load/save setting, pass duration to onToggleTakeover |
| `supabase/functions/live-chat-send/index.ts` | Read `whatsapp_takeover_settings` instead of hardcoded 2h |
| `supabase/functions/whatsapp-webhook/index.ts` | Read `whatsapp_takeover_settings` in `fromMe` block instead of hardcoded 2h |

### What Will NOT Change
- `useLiveChat.ts` — already works, no changes needed
- `SessionsList.tsx` — untouched
- `LiveChat.tsx` — untouched (just minor: fix duplicate "✈️ Telegram" SelectItem)
- All other pages/hooks/components — untouched

### UI Design
```text
Header row (when AI is active):
[ Pausar IA ] [ 2h ▾ ]  [ ⋮ ]
                ↑ select saves as default for this instance

Footer:
💡 Ao enviar uma mensagem, a IA será pausada por 2h
                                              ↑ dynamic
```
The select shows durations: 30min / 1h / 2h / 4h / 8h / 24h / Permanente (999h)
When user picks a value, it's saved instantly to `whatsapp_takeover_settings` (upsert).
