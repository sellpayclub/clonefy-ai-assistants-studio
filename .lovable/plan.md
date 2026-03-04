
## Problems Found

### 1. Type mismatch — `LiveChatSession.source`
In `src/hooks/useLiveChat.ts` line 12, `source` is typed as `'whatsapp' | 'widget'`. Telegram sessions have `source: 'telegram'` in the DB but the TypeScript type doesn't include it. This causes the source filter `sourceFilter !== 'all' && session.source !== sourceFilter` to silently fail for Telegram sessions when the filter is set to `'telegram'` — because TypeScript would not match. More critically, the filter `(session.source as string) === 'telegram'` workarounds in ChatWindow/SessionsList are band-aids.

### 2. Source filter dropdown missing Telegram
`LiveChat.tsx` line 122-125: the source filter has only `whatsapp` and `widget`. No `telegram` option, so users can't filter by Telegram.

### 3. Stats header missing Telegram counter
No Telegram stat shown in the header stats section. Only Bot (AI) and Human counters exist.

### 4. CRM upsert broken in telegram-webhook
Line 256-263 of `telegram-webhook/index.ts`:
```js
supabase.from('crm_leads').upsert({
  ...
  status: 'new'   ← this column does NOT exist
}, { onConflict: 'user_id,whatsapp_number' })
```
The `crm_leads` table uses `pipeline_stage` (not `status`). The field `status` in crm_leads is `'aberto'/'fechado'`, not `'new'`. Also missing `assistant_id` linkage. This upsert likely silently fails or inserts with wrong data.

### 5. Telegram sessions filtered OUT when sourceFilter='telegram'
The filter in `LiveChat.tsx` compares `session.source !== sourceFilter`. Because `source` is typed `'whatsapp' | 'widget'`, when a telegram session comes in from DB with `source='telegram'`, the TypeScript type narrowing may discard it in strict comparisons.

---

## Fixes

### Files to change:

**`src/hooks/useLiveChat.ts`**
- Add `'telegram'` to `source` in both `LiveChatSession` and `LiveChatMessage` interfaces

**`src/pages/LiveChat.tsx`**
- Add `✈️ Telegram` option to source filter Select
- Add Telegram stats counter (with send/plane icon) in header stats

**`src/components/live-chat/SessionsList.tsx`**
- Remove `(session.source as string)` casts — now that type is fixed they're clean

**`src/components/live-chat/ChatWindow.tsx`**
- Remove `(session.source as string)` casts — same cleanup

**`supabase/functions/telegram-webhook/index.ts`**
- Fix CRM upsert: change `status: 'new'` → `pipeline_stage: 'novo'`, add `assistant_id`, fix field names

### Visual result

The Live Chat page will show:
- Filter dropdown with ✈️ Telegram option
- Telegram stat counter in the header  
- All Telegram conversations visible and filterable
- CRM entries correctly created for Telegram contacts with proper pipeline stage
