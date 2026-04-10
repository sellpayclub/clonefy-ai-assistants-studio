

## Plano: Corrigir Follow-up para TODOS os contatos

### Problema confirmado
- Apenas `royalparma` tem follow-up ativado. Possui 276 contatos, TODOS com `followup_count = 3` (bloqueado). Zero follow-ups foram disparados.
- O cron `disparar_followup_clonefy()` filtra por `followup_count = 0`, mas novos contatos nascem com `followup_count: 3` no webhook.
- Contatos não herdam `followup_enabled` da instância.
- Após bot responder, `followup_count` não reseta para 0.

### Correções (3 alterações no webhook + 1 migration de dados)

**1. Edge Function `whatsapp-webhook/index.ts` -- Insert de novo contato (linha 944-953)**
Mudar de:
```
followup_count: 3
```
Para:
```
followup_count: 0,
followup_enabled: instanceConfig.followup_enabled || false,
followup_delay_minutes: instanceConfig.followup_delay_minutes || 5
```

**2. Edge Function `whatsapp-webhook/index.ts` -- Update quando usuario responde (linha 892-903)**
Mudar `followup_count: 3` para `followup_count: 0`. Quando o usuario responde, o timer de inatividade recomeça naturalmente (o `last_sender` vira `'user'`, e o cron so pega `last_sender = 'bot'`).

**3. Edge Function `whatsapp-webhook/index.ts` -- Update apos bot responder (linha 1267-1274)**
Adicionar `followup_count: 0` no update. Isso permite que o cron dispare follow-up caso o contato fique inativo novamente apos a resposta do bot.

**4. Migration de dados -- Corrigir contatos existentes**
SQL para atualizar TODOS os contatos de instancias com follow-up ativado:
- Setar `followup_enabled = true` e `followup_count = 0` nos contatos cujo `last_sender = 'bot'` e que estao inativos
- Isso ativa o follow-up imediatamente para os contatos que ja estao esperando

### Segurança
- Zero alteração na UI
- Zero alteração na edge function `whatsapp-followup` (ela já funciona)
- Zero alteração no cron `disparar_followup_clonefy` (ele já funciona)
- Alterações cirurgicas no webhook: 3 linhas mudadas
- Migration de dados: apenas UPDATE em registros existentes da instancia `royalparma`

### Ordem de execução
1. Editar `whatsapp-webhook/index.ts` (3 pontos)
2. Deploy do webhook
3. Migration SQL para corrigir dados existentes

