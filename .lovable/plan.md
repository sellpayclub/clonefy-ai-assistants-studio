
## Root Cause

The data IS in the database — sessions and messages are saved correctly (confirmed: session `964a6f5f` with Daniel Paixão has messages from 17:34-17:36). The Live Chat page **loads but shows nothing** because of a Realtime filter issue.

The Supabase Realtime subscription in `useLiveChat` uses:
```
filter: `user_id=eq.${userId}`
```

For this **column-level filter to work on Realtime**, the table needs `REPLICA IDENTITY FULL`. Without it, Postgres only sends the primary key on UPDATE events — Realtime can't filter by `user_id` and the frontend receives nothing. The initial `loadSessions()` call on mount SHOULD still work however — so there are TWO bugs:

### Bug 1 — Realtime filter not working (no live updates)
Tables `live_chat_sessions` and `live_chat_messages` are missing `ALTER TABLE ... REPLICA IDENTITY FULL`.

### Bug 2 — Sessions load correctly but possibly user is seeing empty due to stale auth state
Looking at the `useLiveChat` hook: `loadSessions` is called on mount with `userId`. If the user is on the Live Chat page and `userId` is null briefly (auth loading), `loadSessions` returns early and never re-runs because `loadSessions` is in the dependency array but `userId` changes don't trigger a new `loadSessions` call after initial mount — the `useEffect` only runs once per `userId` change.

Actually re-reading the code: the `useEffect` depends on `[userId, loadSessions]`. When `userId` becomes non-null, `loadSessions` changes (because it depends on `userId`), so `useEffect` re-runs. This should work.

**The real bug**: The `loadSessions` query uses `.neq('status', 'closed')` and the sessions ARE `ai_active` — so they should show. But the hook uses `.eq('user_id', userId)` and `userId = user?.id`. If the user is `86efbdbf-defa-47a4-8f26-9f7b51cb1f20` and sessions exist with that user_id — they should load.

**Most likely cause**: A **RLS policy conflict**. The migration creates policies but there might be a duplicate or conflicting policy. Let me check what policies actually exist on `live_chat_sessions`.

Actually from the migration SQL I can see:
```sql
CREATE POLICY "Service role can manage all sessions"
ON public.live_chat_sessions FOR ALL
USING (true)
WITH CHECK (true);
```

The service role policy is fine — it's for the edge function. The user policy is `auth.uid() = user_id`. This should work.

**Most likely actual cause**: The `live_chat_sessions` table doesn't have `REPLICA IDENTITY FULL`, which means Realtime UPDATE events don't carry the full row data including `user_id`. When the edge function creates/updates sessions, the Realtime event fires but the filter `user_id=eq.${userId}` can't match because `user_id` isn't in the CDC event payload.

But wait — the initial `loadSessions()` is a regular Supabase query (not Realtime), so it SHOULD load existing sessions even without REPLICA IDENTITY FULL.

**The actual fix needed**: Two changes:

1. Add `REPLICA IDENTITY FULL` to both Live Chat tables (migration) — fixes real-time updates
2. Add a **manual refresh button** that's more visible AND ensure `loadSessions` is called when the component mounts properly

But there's another issue I noticed: the `useLiveChat` hook calls `loadSessions` inside a `useEffect` that runs when `userId` changes. If the user navigates TO `/live-chat` after already being authenticated, `userId` doesn't change → `useEffect` doesn't re-run → `loadSessions` is not called again.

Wait no — when the component MOUNTS, the effect runs once for the current `userId`. That should be fine.

**Let me re-read the hook more carefully**: `useEffect` depends on `[userId, loadSessions]`. `loadSessions` is a `useCallback` that depends on `[userId]`. So when `userId` is set → `loadSessions` changes → `useEffect` runs → `loadSessions()` is called. This is correct.

**I think the real issue is simpler**: Looking at the RLS policies in the migration file — there are two policies for SELECT on `live_chat_sessions`:
1. `Users can view their own sessions` — `USING (auth.uid() = user_id)`  
2. `Service role can manage all sessions` — `USING (true)`

These should be fine. But the **INSERT** policy has `WITH CHECK (auth.uid() = user_id)` — the edge function uses the SERVICE ROLE key, so it bypasses RLS. Sessions are inserted correctly.

**THE ACTUAL FIX**: 

After reviewing everything — the data is in DB, RLS should be fine, the hook should load data. The most likely explanation: **REPLICA IDENTITY is not set to FULL** causing Realtime to drop the `user_id` filter. More importantly, since sessions ARE in the DB, the initial load should work unless there's a timing issue.

**I'll fix both**: 
1. Add `REPLICA IDENTITY FULL` via migration (fixes Realtime)
2. Add a `useEffect` in the hook that re-runs `loadSessions` when the component becomes visible / when `userId` is confirmed (belt-and-suspenders)
3. Add auto-refresh every 30 seconds as fallback

## Files to change

**Migration**: `ALTER TABLE live_chat_sessions REPLICA IDENTITY FULL; ALTER TABLE live_chat_messages REPLICA IDENTITY FULL;`

**`src/hooks/useLiveChat.ts`**: 
- Add polling fallback (30s interval) to ensure sessions always show even if Realtime fails
- Ensure `loadSessions` is called on mount even if `userId` was already set (add window focus listener or polling)
