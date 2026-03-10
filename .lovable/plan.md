
## Bug: IA não para quando humano responde pelo WhatsApp

### Root Cause (confirmado lendo o código)

No bloco `fromMe` (linhas 244-252 do `whatsapp-webhook`), quando o dono responde pelo próprio celular:

```ts
// Só faz UPDATE — se sessão não existe, não cria nada
await supabase.from('live_chat_sessions')
  .update({ status: 'human_takeover', human_takeover_until: takeoverUntil })
  .eq('instance_name', instanceName)
  .eq('contact_number', contactNumber);
```

Se a sessão ainda **não existe** no `live_chat_sessions`, o `.update()` não faz nada silenciosamente.

Então quando o **cliente responde**:
1. `liveSession = null` (sessão não existe) → check primário é ignorado
2. Linha 711-757: cria nova sessão com `status: 'ai_active'` ← **ERRADO**
3. Check secundário em `n8n_fluxogpt` (linha 792) detecta takeover e retorna "paused" — mas a sessão recém-criada ficou `ai_active`

**Resultado**: A IA pode responder (dependendo de timing/race condition), e o Live Chat mostra sessão como `ai_active` quando deveria ser `human_takeover`.

---

### Fix

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**

No bloco `fromMe` (linhas 221-272), substituir o `.update()` do `live_chat_sessions` por **`upsert`** — mas precisamos do `userId` que só é descoberto depois no fluxo.

A solução mais limpa: buscar o `userId` via `n8n_fluxogpt` **dentro do bloco `fromMe`** para poder fazer o upsert correto:

```ts
// 1. Pegar userId da instância
const { data: instanceCfg } = await supabase
  .from('n8n_fluxogpt')
  .select('userId')
  .eq('nomeinstancia', instanceName)
  .not('emailuser', 'is', null)
  .limit(1)
  .maybeSingle();

// 2. Upsert da sessão com human_takeover (cria se não existir)
if (instanceCfg?.userId) {
  await supabase.from('live_chat_sessions')
    .upsert({
      user_id: instanceCfg.userId,
      instance_name: instanceName,
      contact_number: contactNumber,
      contact_name: contactName,
      source: 'whatsapp',
      status: 'human_takeover',
      human_takeover_until: takeoverUntil,
      last_message_at: new Date().toISOString(),
      last_message_preview: '[Humano assumiu a conversa]',
      last_sender_type: 'human',
    }, { onConflict: 'user_id,instance_name,contact_number' });
}
```

**Segundo fix**: Na linha 736-757 (criação de nova sessão quando cliente responde), verificar se `n8n_fluxogpt.human_takeover_until` está ativo para criar a sessão com `status: 'human_takeover'` em vez de `ai_active`.

---

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | 1) Bloco `fromMe`: buscar `userId` + upsert sessão. 2) Criação de nova sessão: verificar takeover ativo para definir status correto |

Nenhuma migration de banco necessária. Nenhuma mudança de frontend.
