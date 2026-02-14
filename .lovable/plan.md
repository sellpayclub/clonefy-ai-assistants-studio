

# Plano: Correcoes no Agente Financeiro IA

## Problemas Encontrados

### 1. financial-ai usa `service_role` para INSERT mas RLS exige `auth.uid()`
A edge function `financial-ai` usa `SUPABASE_SERVICE_ROLE_KEY` para criar o client Supabase, o que **bypassa RLS** completamente. Isso funciona para leitura/escrita, mas significa que o `user_id` precisa ser passado manualmente em cada operacao (o que ja esta sendo feito). **Isso funciona corretamente** - sem correcao necessaria aqui.

### 2. Webhook envia mensagem de QUALQUER remetente - PROBLEMA
O webhook aceita mensagens de qualquer numero que mande mensagem para o WhatsApp do usuario. Isso esta correto para o caso de uso (o usuario conecta SEU proprio WhatsApp e conversa com o agente). **Sem correcao necessaria.**

### 3. Tool `set_budget` faz upsert sem coluna `spent_amount` - BUG
Na funcao `set_budget` (linha 284), o upsert nao inclui `spent_amount`, que tem default 0. Mas o `onConflict` exige que o campo esteja na constraint. **Funciona** porque a constraint `UNIQUE(user_id, category, month)` existe e `spent_amount` tem default. Sem problema real.

### 4. A IA nao tem contexto de QUEM esta falando - PROBLEMA MENOR
O agente financeiro responde para qualquer numero que mande mensagem. Deveria idealmente so responder ao PROPRIO usuario (dono da conta), nao a qualquer contato. Atualmente se alguem mandar mensagem para o WhatsApp conectado, o agente vai responder e registrar transacoes na conta do dono.

**Correcao:** Guardar o numero do dono na `financial_accounts` durante a conexao e filtrar no webhook.

### 5. FALTA `commerce-webhook` e `commerce-ai` no config.toml - BUG EXISTENTE
O config.toml nao tem as funcoes do commerce. Mas isso e pre-existente, nao do financeiro.

### 6. `financial-ai` nao trata erro 429/402 da Lovable AI - PROBLEMA
Se a gateway retornar rate limit (429) ou falta de creditos (402), o agente vai crashar silenciosamente sem responder o usuario.

**Correcao:** Tratar erros da gateway e enviar mensagem amigavel no WhatsApp.

### 7. `edit_transaction` - `.toFixed(2)` em valor potencialmente nulo - BUG
Linha 348: `(new_amount || tx.amount).toFixed(2)` - se `tx.amount` vier como string do banco, `.toFixed` vai crashar.

**Correcao:** Usar `Number(new_amount || tx.amount).toFixed(2)`.

### 8. Webhook nao filtra mensagens de grupo - PROBLEMA
Se o WhatsApp receber mensagens de grupo (`@g.us`), o webhook vai tentar processar. Deveria ignorar.

**Correcao:** Adicionar filtro `!msg.key.remoteJid.includes("@g.us")`.

## Resumo de Correcoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/financial-webhook/index.ts` | Filtrar mensagens de grupo; guardar owner_phone |
| `supabase/functions/financial-ai/index.ts` | Tratar erros 429/402; fix toFixed em edit_transaction |
| `src/pages/FinancialConnect.tsx` | Salvar numero do dono na account ao conectar |

## Detalhes Tecnicos

### Filtro de grupo no webhook (financial-webhook)
Antes de processar cada mensagem, verificar:
```text
if (msg.key.remoteJid.includes("@g.us")) continue;
```

### Tratamento de erros da gateway (financial-ai)
Apos chamar a Lovable AI Gateway, verificar status:
```text
if (!aiResponse.ok) {
  if (aiResponse.status === 429) finalResponse = "Estou sobrecarregada...";
  else if (aiResponse.status === 402) finalResponse = "Servico temporariamente indisponivel...";
  else finalResponse = "Desculpe, tive um problema...";
  break;
}
```

### Fix toFixed (financial-ai, edit_transaction)
```text
ANTES: (new_amount || tx.amount).toFixed(2)
DEPOIS: Number(new_amount ?? tx.amount).toFixed(2)
```

Essas sao correcoes pontuais que garantem que o fluxo WhatsApp -> Webhook -> IA -> Banco -> Resposta funcione de forma robusta. A logica principal (tool calling, categorias, CRUD) esta correta e pronta para funcionar.

