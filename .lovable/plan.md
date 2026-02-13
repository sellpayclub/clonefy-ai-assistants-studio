

# Plano: Corrigir Ultimo Bug de Base64 no Webhook

## Problema

No `whatsapp-webhook/index.ts`, linhas 354-358, o Metodo 3 de download de audio do usuario ainda usa o padrao antigo de conversao base64:

```text
let binary = '';
for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
}
base64Audio = btoa(binary);
```

Embora nao cause stack overflow (usa loop em vez de spread), `btoa()` pode falhar com strings muito grandes e eh ineficiente (concatenacao de strings O(n^2)). O import do `base64Encode` ja existe no arquivo mas nao esta sendo usado aqui.

## Correcao

Substituir as linhas 353-358 por:

```text
base64Audio = base64Encode(new Uint8Array(arrayBuffer));
```

Uma unica linha usando o mesmo `base64Encode` do Deno que ja foi importado no topo do arquivo.

## Verificacao Completa do Fluxo ElevenLabs

| Etapa | Status | Descricao |
|-------|--------|-----------|
| Configuracao (UI) | OK | WhatsApp.tsx permite configurar API Key e Voice ID |
| Armazenamento | OK | Salvos em n8n_fluxogpt.ApiELEVEN e n8n_fluxogpt.IDvoz |
| Deteccao de audio | OK | Webhook identifica messageType === 'audio' |
| Transcricao (Whisper) | OK | Audio do usuario transcrito antes de enviar ao GPT |
| Download audio fallback | BUG | Usa btoa() antigo - sera corrigido |
| Resposta GPT | OK | Texto gerado normalmente |
| TTS (ElevenLabs) | OK | Converte texto em audio com model eleven_multilingual_v2 |
| Encoding resposta | OK | Usa base64Encode do Deno (corrigido anteriormente) |
| Envio audio | OK | Envia via Evolution API sendWhatsAppAudio |
| Fallback texto | OK | Se audio falhar, envia como texto |
| Follow-up audio | OK | whatsapp-followup tambem envia audio quando configurado |

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Substituir btoa() por base64Encode() no Metodo 3 (linhas 353-358) |

## Detalhes Tecnicos

A correcao eh simples - substituir 5 linhas por 1 linha usando o `base64Encode` que ja esta importado no topo do arquivo (linha 4).

