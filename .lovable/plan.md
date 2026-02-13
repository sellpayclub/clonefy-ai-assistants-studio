
# Plano: Corrigir Integração ElevenLabs

## Problemas Encontrados

### 1. Bug Critico - Crash ao gerar audio (whatsapp-webhook)
Na linha 1276, o codigo usa `btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))` para converter audio em base64. Isso causa **stack overflow** quando o audio tem mais de poucos KB, porque o JavaScript tem limite de argumentos numa chamada de funcao. O audio nunca e enviado com sucesso para audios maiores.

**Correcao:** Usar a biblioteca `base64` do Deno para encodar corretamente.

### 2. Follow-up ignora ElevenLabs
A funcao `whatsapp-followup` recebe `elevenLabsApiKey` e `voiceId` no payload mas **nunca os utiliza** - sempre envia texto puro. Se o usuario configurou voz, o follow-up deveria tambem responder em audio.

**Correcao:** Adicionar logica de TTS no follow-up, similar ao webhook principal.

### 3. Cores hardcoded na UI
A secao de configuracao ElevenLabs na pagina WhatsApp usa cores roxas fixas (`purple-50`, `purple-200`, etc.) em vez do sistema de cores `primary` do tema.

**Correcao:** Substituir por tokens do design system.

## Modificacoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Corrigir conversao base64 usando `encode` do Deno |
| `supabase/functions/whatsapp-followup/index.ts` | Adicionar envio de audio via ElevenLabs quando configurado |
| `src/pages/WhatsApp.tsx` | Substituir cores purple hardcoded por tokens primary |

## Detalhes Tecnicos

### Correcao do Base64 (webhook)
```text
ANTES (quebra com audios grandes):
  btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

DEPOIS (funciona com qualquer tamanho):
  import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
  encode(new Uint8Array(audioBuffer))
```

### Adicionar audio no Follow-up
Apos obter a resposta do assistente, verificar se `elevenLabsApiKey` e `voiceId` foram fornecidos. Se sim, converter texto em audio via API ElevenLabs e enviar como audio pelo WhatsApp (mesma logica do webhook principal, com a correcao de base64).

### Cores da UI
Substituir `purple-50`, `purple-100`, `purple-200`, `purple-400`, `purple-500`, `purple-600`, `purple-700`, `purple-800`, `purple-900` por equivalentes usando `primary` e `muted` tokens.
