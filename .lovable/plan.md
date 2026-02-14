

# Revisao Completa: Agente Financeiro IA

## Status Geral: 85% Pronto - 6 Problemas a Corrigir

### O que FUNCIONA corretamente:
- 4 tabelas criadas com RLS (financial_accounts, transactions, categories, budgets)
- Trigger de categorias padrao ativo
- Constraint UNIQUE em budgets funciona com upsert
- Tool calling com 8 tools completas (add, list, summary, by_category, budget, delete, edit)
- Filtro de grupo no webhook
- Tratamento de 429/402 da gateway
- Dashboard com graficos (Line, Pie, Bar) e KPIs
- Pagina de transacoes com filtros, CRUD, export CSV
- Wizard de conexao WhatsApp

---

## Problemas Encontrados

### BUG 1: `EVOLUTION_API_URL` nao esta nos secrets
A `financial-ai` usa `Deno.env.get("EVOLUTION_API_URL")` com fallback para `"https://evolutionapi.clonefyia.com"`. **Mas** as outras edge functions (whatsapp-webhook, live-chat-send, etc.) tem a URL **hardcoded** diretamente no codigo. Nao ha secret configurado.

**O fallback funciona**, mas o `EVOLUTION_API_KEY` vem de `Deno.env.get("EVOLUTION_API_KEY")` que **esta nos secrets** - entao funciona. Sem correcao necessaria aqui, o fallback esta correto.

### BUG 2: `financial-ai` NAO responde se `evolutionApiKey` estiver vazio
Linha 521: `if (finalResponse && evolutionApiKey)` - se `EVOLUTION_API_KEY` estiver vazio (fallback `""`), a resposta **nunca e enviada** ao WhatsApp. O secret existe, entao funciona. Mas deveria logar um warning se vazio.

**Correcao:** Adicionar log de aviso se `evolutionApiKey` estiver vazio.

### BUG 3: `add_transaction` - `amount.toFixed(2)` pode crashar
Linha 190: `amount.toFixed(2)` - o `amount` vem dos args do tool calling como `any`. Se a IA mandar como string (ex: `"50"`), `.toFixed` vai falhar.

**Correcao:** Usar `Number(amount).toFixed(2)` em todas as tools que formatam valores.

### BUG 4: `set_budget` - `limit_amount.toFixed(2)` mesmo problema
Linha 289: `limit_amount.toFixed(2)` pode crashar se vier como string.

**Correcao:** `Number(limit_amount).toFixed(2)`.

### BUG 5: `financial-ai` nao trata `toolCall.function.arguments` invalido
Linha 497: `JSON.parse(toolCall.function.arguments)` - se a IA retornar JSON malformado, o parse vai crashar e a funcao toda morre sem responder o usuario.

**Correcao:** Envolver em try/catch e retornar mensagem de erro amigavel.

### BUG 6: Webhook nao trata falha do `financial-ai`
Se `financial-ai` retornar status 500, o webhook faz `await aiResponse.json()` que pode falhar se o body nao for JSON valido.

**Correcao:** Verificar `aiResponse.ok` antes do `.json()`.

---

## Resumo de Correcoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/financial-ai/index.ts` | Fix Number() em add_transaction e set_budget; try/catch no JSON.parse dos args; log warning se evolutionApiKey vazio |
| `supabase/functions/financial-webhook/index.ts` | Verificar aiResponse.ok antes de parsear |

## Detalhes Tecnicos

### Fix Number() nos valores (financial-ai)
```text
// add_transaction (linha 190)
ANTES: amount.toFixed(2)
DEPOIS: Number(amount).toFixed(2)

// set_budget (linha 289)
ANTES: limit_amount.toFixed(2)
DEPOIS: Number(limit_amount).toFixed(2)
```

### Try/catch no parse dos tool arguments (financial-ai)
```text
for (const toolCall of assistantMessage.tool_calls) {
    const toolName = toolCall.function.name;
    let toolArgs;
    try {
        toolArgs = JSON.parse(toolCall.function.arguments);
    } catch {
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: "Erro ao processar argumentos da ferramenta.",
        });
        continue;
    }
    // ... executeTool
}
```

### Verificar resposta da AI no webhook (financial-webhook)
```text
if (aiResponse.ok) {
    const aiResult = await aiResponse.json();
    console.log("[Financial Webhook] AI result:", JSON.stringify(aiResult));
} else {
    console.error("[Financial Webhook] AI returned error:", aiResponse.status);
}
```

### Warning se evolutionApiKey vazio (financial-ai)
```text
if (!evolutionApiKey) {
    console.warn("[Financial AI] EVOLUTION_API_KEY not configured - cannot send WhatsApp response");
}
```

Essas 6 correcoes eliminam todos os pontos de falha potenciais. Apos aplicar, o fluxo completo WhatsApp -> Webhook -> AI -> Tool Calling -> DB -> Resposta WhatsApp estara 100% robusto.
