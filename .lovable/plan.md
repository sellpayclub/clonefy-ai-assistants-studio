

## Plano: Corrigir Follow-up Automático do WhatsApp

### Problema raiz
A função `disparar_followup_clonefy()` envia POST para `https://webhook.dcsaudeautomacao.com/webhook/follow-up` (servidor externo morto). Precisa apontar para a edge function `whatsapp-followup` do Supabase.

### Correção

**1. Migration: Recriar `disparar_followup_clonefy()`**

Trocar a URL do `net.http_post` de:
```
https://webhook.dcsaudeautomacao.com/webhook/follow-up
```
Para:
```
https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/whatsapp-followup
```

Adicionar header de Authorization com o anon key (necessario para chamar edge functions). A lógica da query, filtros e payload permanecem idênticos.

**2. Nenhuma alteração na edge function `whatsapp-followup`**

A função já está correta: recebe o payload, roda o OpenAI Assistant com prompt contextual de follow-up, e envia via Evolution API.

**3. Nenhuma alteração na UI**

O toggle de follow-up na página WhatsApp já funciona corretamente (update por `nomeinstancia` com RLS por `emailuser`). O problema é que mesmo ativando, o cron chamava um servidor morto.

### Seguranca
- Apenas 1 migration: recriar a mesma função com URL corrigida
- Zero alterações em código frontend
- Zero alterações em edge functions
- Zero alterações em tabelas

