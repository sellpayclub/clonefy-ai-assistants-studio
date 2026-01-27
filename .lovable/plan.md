
## Diagnóstico (por que “na conexão antiga” não salvou nada)
Você não precisa criar nada novo. O problema está no jeito que o `whatsapp-webhook` faz o “mapa” entre:

- `n8n_fluxogpt.idassistentgpt` (que hoje guarda o **OpenAI assistant id**, tipo `asst_...`)
- e as tabelas internas que precisam de **UUID** (`assistants.id`, `crm_leads.assistant_id`, `widget_analytics.assistant_id`, `live_chat_sessions.user_id`)

Hoje o webhook está fazendo isso errado:

- Ele tenta buscar o assistente assim: `assistants.id = instanceConfig.idassistentgpt`
  - Só que `instanceConfig.idassistentgpt` é `asst_...`, então **não acha**.
- Com isso:
  - `userId` fica vazio ⇒ não cria sessão/mensagens no **Chat ao Vivo**
  - `crm_leads.assistant_id` recebe `asst_...` (texto) mas a coluna é UUID ⇒ o insert/update falha (e hoje não está tratando esse erro de forma clara)
  - `widget_analytics.assistant_id` também é UUID ⇒ analytics para WhatsApp falha

Isso explica perfeitamente seu cenário: “já tá conectado, já conversa, já tem IA”, mas “não salva no CRM e não aparece no chat ao vivo”.

---

## Objetivo do ajuste (sem criar conexões novas)
1) Continuar usando o que já existe (instâncias Evolution atuais + webhook atual).
2) Corrigir o mapeamento: pegar o registro correto na tabela `assistants` usando `openai_assistant_id`.
3) A partir daí:
   - salvar no **CRM** (com `source='whatsapp'` + análise completa)
   - salvar/criar sessão e mensagens no **Chat ao Vivo**
   - manter o **human takeover** sincronizado (o que já começamos)

---

## O que vou alterar (somente backend, com cuidado)
### A) Corrigir “lookup” do assistente no `whatsapp-webhook`
Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

Hoje ele faz:
- `from('assistants').select('user_id, name').eq('id', instanceConfig.idassistentgpt)`

Vai passar a fazer (com fallback para compatibilidade):
1. Tentar por OpenAI:
   - `eq('openai_assistant_id', instanceConfig.idassistentgpt)`
2. Se não achar (caso raro/legado), tentar por UUID:
   - `eq('id', instanceConfig.idassistentgpt)`

E vai extrair **tudo que precisamos**:
- `assistant_uuid` (assistants.id)
- `openai_assistant_id` (assistants.openai_assistant_id)
- `user_id`
- `name`

### B) Usar as variáveis corretas em cada lugar
Após o ajuste, o webhook vai usar:

- Para OpenAI (rodar o assistente):
  - `assistant_id: openai_assistant_id`
- Para Chat ao Vivo:
  - `user_id: assistants.user_id` (agora sempre preenchido)
  - `assistant_name: assistants.name`
  - `assistant_id` (na `live_chat_sessions`) pode continuar sendo texto; manteremos o que já é usado hoje (provavelmente `openai_assistant_id`) para não quebrar nada.
- Para CRM:
  - `crm_leads.assistant_id = assistants.id` (UUID correto)
  - `crm_leads.user_id = assistants.user_id`
  - `source = 'whatsapp'`
- Para Analytics (`widget_analytics`):
  - `assistant_id = assistants.id` (UUID correto)

### C) Ajustar o `processCRMLead` para receber UUID do assistente (não `asst_...`)
Hoje a chamada está passando `instanceConfig.idassistentgpt` (que é `asst_...`).
Vamos mudar para passar `assistant_uuid`.

Isso é essencial para o lead entrar no CRM.

### D) Melhorar logs sem “explodir” o console
Hoje o webhook loga o payload inteiro (muito grande). Isso atrapalha ver erros reais.
Vamos trocar para logar apenas:
- `event`, `instance`, `fromMe`, `remoteJid`, `messageType`, e um preview do texto

Isso não muda nada funcional, só deixa debug confiável.

---

## Passos de implementação (sequência)
1) Editar `supabase/functions/whatsapp-webhook/index.ts`:
   - corrigir query do assistente (usar `openai_assistant_id`)
   - criar variáveis:
     - `assistantUuid`, `openaiAssistantId`, `userId`, `assistantName`
   - trocar em todos os pontos:
     - OpenAI runs: usar `openaiAssistantId`
     - Analytics: usar `assistantUuid`
     - CRM lead: usar `assistantUuid`
     - Live chat: usar `userId` correto
2) Garantir que a criação/atualização de sessão do Live Chat incremente `unread_count` corretamente (hoje tem um `(existingSession as any).unread_count + 1` mas o select não traz `unread_count`; vamos ajustar para buscar esse campo ou usar fallback seguro).
3) Re-deploy da função `whatsapp-webhook` (ambiente Live, porque é onde seu WhatsApp real está chamando).
4) Teste guiado com sua conexão antiga (sem criar outra):
   - Enviar uma mensagem do cliente para o WhatsApp
   - Confirmar que:
     - aparece sessão no **Chat ao Vivo** imediatamente
     - aparece mensagens em tempo real
     - CRM cria/atualiza lead com `source='whatsapp'`
     - lead vem com número correto + resumo/análise da IA (campos avançados)
5) Validar human takeover:
   - enviar msg “do humano” (fromMe) e confirmar que `live_chat_sessions.status` vira `human_takeover` e que o painel reflete

---

## Checklist de validação (o que você vai ver)
### No Chat ao Vivo
- A conversa WhatsApp aparece na lista
- Origem “WhatsApp” (source = whatsapp)
- Mensagens entrando em tempo real
- Bot e humano aparecendo como remetentes (quando aplicável)

### No CRM
- Lead com:
  - `whatsapp_number` preenchido
  - `source = 'whatsapp'`
  - `conversation_analysis`, `key_topics`, `objections`, `urgency_level`, `sentiment`, `next_action` preenchidos (depois do profiling rodar)

Observação: o profiling é “background”, então pode levar alguns segundos após a resposta do bot.

---

## Risco e cuidado para “não estragar nada”
- Mudança isolada em 1 função (`whatsapp-webhook`)
- Mantém compatibilidade:
  - se `idassistentgpt` vier UUID ou `asst_...`, continua funcionando
- Não altera schema e não cria tabela nova
- Não mexe no chat do widget (só WhatsApp)

---

## Se ainda não aparecer após isso
A próxima hipótese (menor chance) é a instância estar chamando outro endpoint (ex: `commerce-webhook`). Mas antes disso, com esse ajuste, o comportamento “IA conversa mas não salva nada” deve ser resolvido porque o bloqueio era o `userId` e o UUID do `assistant_id` no CRM.
