
## Understanding

The user discovered that Evolution API already has a native webhook configuration endpoint. The current system creates the instance with a webhook on creation (`group-connection/index.ts` lines 88-99), but this may not be applied if the instance already exists. The user wants a simple "Activate Webhook" button on the WhatsApp Groups page that calls the Evolution API webhook config endpoint directly on the group instance — no AI, no new tables, nothing complex.

## What needs to happen

The Evolution API endpoint to set/update webhook on an existing instance is:
`PUT /webhook/set/{instanceName}` with body `{ enabled: true, url: "...", webhookByEvents: true, events: ["MESSAGES_UPSERT", ...] }`

### The plan (minimal, isolated)

**1. `supabase/functions/group-connection/index.ts`**
Add a new `action: 'configure_webhook'` block:
- Calls `PUT /webhook/set/{instanceName}` on Evolution API
- Sets webhook URL to the `group-webhook` edge function URL
- Enables events: `MESSAGES_UPSERT`, `GROUP_PARTICIPANTS_UPDATE`, `GROUPS_UPSERT`, `GROUPS_UPDATE`
- Returns success/error

**2. `src/pages/GroupManagement.tsx`**
Add a single button in the WhatsApp Connection card (visible when `connectionStatus === 'connected'`):
- Label: "Configurar Webhook" with a Zap icon
- When clicked, calls `group-connection` with `action: 'configure_webhook'`
- Shows loading state and toast feedback (success or error)
- No new state, no new dialogs — just one button and one function

That's it. Two files. Zero database changes. Zero interference with any other feature.

## How it works in practice

```text
User connects WhatsApp → sees "Conectado" badge
↓
Clicks "Configurar Webhook"
↓
group-connection calls Evolution API PUT /webhook/set/group_{userId}
↓
Evolution API starts sending group messages to group-webhook edge function
↓
group-webhook already handles MESSAGES_UPSERT from groups → saves to DB
```

## Files changed

| File | Change |
|---|---|
| `supabase/functions/group-connection/index.ts` | + `configure_webhook` action (calls Evolution API) |
| `src/pages/GroupManagement.tsx` | + "Configurar Webhook" button + handler function |
