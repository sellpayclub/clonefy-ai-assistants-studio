

## Plano: Follow-up Automático por Conexão (Toggle + Tempo Customizável)

### Resumo

Adicionar um toggle "Follow-up Automático" em cada card de conexão WhatsApp. Quando ativado, o usuário escolhe o tempo (X minutos) de inatividade antes de disparar **1 única mensagem** de follow-up. O sistema usa o CRON já existente (`disparar_followup_clonefy`) que será atualizado para respeitar as configurações por conexão.

### O que muda

#### 1. Migração: Adicionar colunas na tabela `n8n_fluxogpt`

Duas novas colunas:
- `followup_enabled` (boolean, default false) — se o follow-up está ativo para essa conexão
- `followup_delay_minutes` (integer, default 5) — tempo em minutos sem resposta antes de disparar

#### 2. Atualizar função `disparar_followup_clonefy()`

Modificar a função para:
- Só processar registros onde `followup_enabled = true`
- Usar `followup_delay_minutes` do registro em vez de intervalos hardcoded
- Limitar a **1 único follow-up** (checar `followup_count = 0`)
- Chamar o webhook externo `https://webhook.dcsaudeautomacao.com/webhook/follow-up` em vez da edge function `whatsapp-followup`, enviando os dados do lead (instância, número, threadId, assistantId, etc.)

#### 3. UI: Toggle + Input de tempo no card da conexão (`src/pages/WhatsApp.tsx`)

Abaixo do toggle de grupos, adicionar:
- Switch "Follow-up Automático" (ícone Clock)
- Quando ativado, mostrar Input numérico: "Tempo sem resposta (minutos)" 
- Salvar direto na tabela `n8n_fluxogpt` via `supabase.from('n8n_fluxogpt').update()`
- Visual similar ao toggle de grupos (card com fundo amarelo/amber)

### Arquivos modificados

| Arquivo | Ação |
|---|---|
| Nova migração SQL | Adicionar `followup_enabled`, `followup_delay_minutes` + atualizar função |
| `src/pages/WhatsApp.tsx` | Adicionar toggle + input de tempo no card |

### Fluxo do usuário

1. Conecta WhatsApp normalmente
2. No card da conexão, ativa "Follow-up Automático"
3. Define "10 minutos" (por exemplo)
4. Se um cliente não responder em 10 minutos (e o bot foi o último a falar), o CRON dispara 1 mensagem via webhook externo
5. Após essa 1 mensagem, não envia mais (followup_count = 1, e a query só pega count = 0)

### Detalhe técnico

A função `disparar_followup_clonefy()` será simplificada:

```text
SELECT * FROM n8n_fluxogpt
WHERE followup_enabled = true
  AND last_sender = 'bot'
  AND followup_count = 0
  AND last_message_at < now() - (followup_delay_minutes || ' minutes')::interval
  AND whatsappuser IS NOT NULL
  AND threadid IS NOT NULL
```

Cada match chama `net.http_post` para `https://webhook.dcsaudeautomacao.com/webhook/follow-up` com os dados do lead. Após o disparo, `followup_count` é incrementado para 1, impedindo novos disparos.

