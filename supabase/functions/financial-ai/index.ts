// =============================================================================
// Financial AI - Agente financeiro pessoal via WhatsApp
// COMPLETAMENTE ISOLADA - usa Lovable AI Gateway com tool calling
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FinancialRequest {
    user_id: string;
    instance_name: string;
    sender_phone: string;
    message: string;
}

const tools = [
    {
        type: "function" as const,
        function: {
            name: "add_transaction",
            description: "Registrar um gasto ou ganho financeiro do usuário",
            parameters: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (ganho) ou expense (gasto)" },
                    amount: { type: "number", description: "Valor em reais (positivo)" },
                    description: { type: "string", description: "Descrição curta da transação" },
                    category: { type: "string", description: "Categoria: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Contas, Salário, Freelance, Investimentos, Vendas, Outros" },
                    date: { type: "string", description: "Data no formato YYYY-MM-DD. Se não informada, usar hoje." },
                    payment_method: { type: "string", description: "Método: pix, dinheiro, cartao_credito, cartao_debito, transferencia, boleto" },
                },
                required: ["type", "amount", "description", "category"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "list_transactions",
            description: "Listar transações do usuário com filtros opcionais",
            parameters: {
                type: "object",
                properties: {
                    period: { type: "string", enum: ["today", "week", "month", "year", "all"], description: "Período a consultar" },
                    type: { type: "string", enum: ["income", "expense", "all"], description: "Filtrar por tipo" },
                    category: { type: "string", description: "Filtrar por categoria" },
                    limit: { type: "number", description: "Quantidade máxima de resultados (padrão 10)" },
                },
                required: ["period"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_summary",
            description: "Obter resumo financeiro do período: total receitas, total gastos, saldo, top categorias",
            parameters: {
                type: "object",
                properties: {
                    period: { type: "string", enum: ["today", "week", "month", "year"], description: "Período do resumo" },
                },
                required: ["period"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_by_category",
            description: "Obter gastos agrupados por categoria no período",
            parameters: {
                type: "object",
                properties: {
                    period: { type: "string", enum: ["month", "year"], description: "Período" },
                    type: { type: "string", enum: ["income", "expense"], description: "Tipo" },
                },
                required: ["period"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "set_budget",
            description: "Definir orçamento mensal para uma categoria",
            parameters: {
                type: "object",
                properties: {
                    category: { type: "string", description: "Categoria" },
                    limit_amount: { type: "number", description: "Valor limite em reais" },
                    month: { type: "string", description: "Mês no formato YYYY-MM. Se não informado, usar mês atual." },
                },
                required: ["category", "limit_amount"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "delete_transaction",
            description: "Apagar uma transação. Use 'last' para apagar a última, ou descreva qual apagar.",
            parameters: {
                type: "object",
                properties: {
                    target: { type: "string", description: "'last' para a última transação, ou uma descrição para buscar" },
                },
                required: ["target"],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "edit_transaction",
            description: "Editar uma transação existente",
            parameters: {
                type: "object",
                properties: {
                    target: { type: "string", description: "'last' ou descrição da transação a editar" },
                    new_amount: { type: "number", description: "Novo valor (opcional)" },
                    new_description: { type: "string", description: "Nova descrição (opcional)" },
                    new_category: { type: "string", description: "Nova categoria (opcional)" },
                },
                required: ["target"],
            },
        },
    },
];

function getDateRange(period: string): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let start: string;

    switch (period) {
        case "today":
            start = end;
            break;
        case "week": {
            const w = new Date(now);
            w.setDate(w.getDate() - 7);
            start = w.toISOString().split("T")[0];
            break;
        }
        case "month": {
            start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
            break;
        }
        case "year": {
            start = `${now.getFullYear()}-01-01`;
            break;
        }
        default:
            start = "2000-01-01";
    }
    return { start, end };
}

async function executeTool(
    supabase: any,
    userId: string,
    toolName: string,
    args: any
): Promise<string> {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);

    switch (toolName) {
        case "add_transaction": {
            const { type, amount, description, category, date, payment_method } = args;
            const { error } = await supabase.from("financial_transactions").insert({
                user_id: userId,
                type,
                amount,
                description,
                category,
                date: date || today,
                payment_method: payment_method || null,
                source: "whatsapp",
                ai_categorized: true,
            });
            if (error) return `Erro ao registrar: ${error.message}`;
            const emoji = type === "income" ? "💰" : "💸";
            return `${emoji} ${type === "income" ? "Receita" : "Gasto"} registrado: R$ ${Number(amount).toFixed(2)} - ${description} (${category})`;
        }

        case "list_transactions": {
            const { period, type: txType, category, limit: lim } = args;
            const { start, end } = getDateRange(period);
            let query = supabase
                .from("financial_transactions")
                .select("*")
                .eq("user_id", userId)
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: false })
                .limit(lim || 10);

            if (txType && txType !== "all") query = query.eq("type", txType);
            if (category) query = query.eq("category", category);

            const { data, error } = await query;
            if (error) return `Erro: ${error.message}`;
            if (!data || data.length === 0) return "Nenhuma transação encontrada nesse período.";

            return data
                .map((t: any) => {
                    const emoji = t.type === "income" ? "🟢" : "🔴";
                    return `${emoji} ${t.date} | R$ ${Number(t.amount).toFixed(2)} | ${t.description} (${t.category})`;
                })
                .join("\n");
        }

        case "get_summary": {
            const { period } = args;
            const { start, end } = getDateRange(period);
            const { data, error } = await supabase
                .from("financial_transactions")
                .select("type, amount")
                .eq("user_id", userId)
                .gte("date", start)
                .lte("date", end);

            if (error) return `Erro: ${error.message}`;
            if (!data || data.length === 0) return "Nenhuma transação nesse período.";

            let income = 0, expense = 0;
            for (const t of data) {
                if (t.type === "income") income += Number(t.amount);
                else expense += Number(t.amount);
            }
            const balance = income - expense;
            const savings = income > 0 ? ((balance / income) * 100).toFixed(1) : "0";

            return `📊 Resumo Financeiro:\n💰 Receitas: R$ ${income.toFixed(2)}\n💸 Gastos: R$ ${expense.toFixed(2)}\n${balance >= 0 ? "✅" : "⚠️"} Saldo: R$ ${balance.toFixed(2)}\n📈 Economia: ${savings}%\n📝 Total de transações: ${data.length}`;
        }

        case "get_by_category": {
            const { period, type: catType } = args;
            const { start, end } = getDateRange(period);
            const txType = catType || "expense";

            const { data, error } = await supabase
                .from("financial_transactions")
                .select("category, amount")
                .eq("user_id", userId)
                .eq("type", txType)
                .gte("date", start)
                .lte("date", end);

            if (error) return `Erro: ${error.message}`;
            if (!data || data.length === 0) return "Nenhuma transação nesse período.";

            const grouped: Record<string, number> = {};
            let total = 0;
            for (const t of data) {
                grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
                total += Number(t.amount);
            }

            const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
            return (
                `📊 ${txType === "income" ? "Receitas" : "Gastos"} por categoria:\n` +
                sorted
                    .map(([cat, val]) => {
                        const pct = ((val / total) * 100).toFixed(1);
                        return `• ${cat}: R$ ${val.toFixed(2)} (${pct}%)`;
                    })
                    .join("\n") +
                `\n\n💰 Total: R$ ${total.toFixed(2)}`
            );
        }

        case "set_budget": {
            const { category, limit_amount, month } = args;
            const m = month || currentMonth;

            const { error } = await supabase.from("financial_budgets").upsert(
                { user_id: userId, category, month: m, limit_amount },
                { onConflict: "user_id,category,month" }
            );
            if (error) return `Erro: ${error.message}`;
            return `✅ Orçamento definido: ${category} → R$ ${Number(limit_amount).toFixed(2)}/mês (${m})`;
        }

        case "delete_transaction": {
            const { target } = args;
            let query = supabase
                .from("financial_transactions")
                .select("id, description, amount, type")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (target !== "last") {
                query = supabase
                    .from("financial_transactions")
                    .select("id, description, amount, type")
                    .eq("user_id", userId)
                    .ilike("description", `%${target}%`)
                    .order("created_at", { ascending: false })
                    .limit(1);
            }

            const { data } = await query;
            if (!data || data.length === 0) return "Transação não encontrada.";

            const tx = data[0];
            await supabase.from("financial_transactions").delete().eq("id", tx.id);
            return `🗑️ Transação apagada: R$ ${Number(tx.amount).toFixed(2)} - ${tx.description}`;
        }

        case "edit_transaction": {
            const { target, new_amount, new_description, new_category } = args;
            let query = supabase
                .from("financial_transactions")
                .select("id, description, amount, category")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (target !== "last") {
                query = supabase
                    .from("financial_transactions")
                    .select("id, description, amount, category")
                    .eq("user_id", userId)
                    .ilike("description", `%${target}%`)
                    .order("created_at", { ascending: false })
                    .limit(1);
            }

            const { data } = await query;
            if (!data || data.length === 0) return "Transação não encontrada.";

            const tx = data[0];
            const updates: any = {};
            if (new_amount !== undefined) updates.amount = new_amount;
            if (new_description) updates.description = new_description;
            if (new_category) updates.category = new_category;

            await supabase.from("financial_transactions").update(updates).eq("id", tx.id);
            return `✏️ Transação editada: ${tx.description} → ${new_description || tx.description} | R$ ${Number(new_amount ?? tx.amount).toFixed(2)}`;
        }

        default:
            return "Ferramenta não reconhecida.";
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolutionapi.clonefyia.com";
        const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY") || "";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const request: FinancialRequest = await req.json();

        console.log("[Financial AI] Processing:", request.message);

        // Get user's recent transactions for context
        const { data: recentTx } = await supabase
            .from("financial_transactions")
            .select("type, amount, description, category, date")
            .eq("user_id", request.user_id)
            .order("created_at", { ascending: false })
            .limit(5);

        const recentContext = (recentTx || [])
            .map((t: any) => `${t.type === "income" ? "🟢" : "🔴"} ${t.date} R$${Number(t.amount).toFixed(2)} ${t.description} (${t.category})`)
            .join("\n");

        // Get current month summary
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const { data: monthTx } = await supabase
            .from("financial_transactions")
            .select("type, amount")
            .eq("user_id", request.user_id)
            .gte("date", monthStart);

        let monthIncome = 0, monthExpense = 0;
        for (const t of monthTx || []) {
            if (t.type === "income") monthIncome += Number(t.amount);
            else monthExpense += Number(t.amount);
        }

        const systemPrompt = `# VOCÊ É UM CONSULTOR FINANCEIRO PESSOAL

Você é uma secretária/consultora financeira inteligente que ajuda o usuário a gerenciar suas finanças pessoais via WhatsApp.

## PERSONALIDADE
- Amigável, profissional e empática
- Usa emojis com moderação (2-3 por mensagem)
- Mensagens curtas e diretas (WhatsApp)
- Proativa: dá dicas de economia quando relevante
- Celebra conquistas financeiras do usuário

## CONTEXTO ATUAL
- Mês atual: ${monthStart}
- Receitas do mês: R$ ${monthIncome.toFixed(2)}
- Gastos do mês: R$ ${monthExpense.toFixed(2)}
- Saldo do mês: R$ ${(monthIncome - monthExpense).toFixed(2)}

## ÚLTIMAS TRANSAÇÕES
${recentContext || "Nenhuma transação registrada ainda."}

## COMO INTERPRETAR MENSAGENS
- "Gastei 50 no mercado" → add_transaction(expense, 50, "Mercado", "Alimentação")
- "Paguei 1500 de aluguel" → add_transaction(expense, 1500, "Aluguel", "Moradia")
- "Recebi 3000 de salário" → add_transaction(income, 3000, "Salário", "Salário")
- "Uber 25 reais" → add_transaction(expense, 25, "Uber", "Transporte")
- "Quanto gastei esse mês?" → get_summary(month)
- "Me mostra por categoria" → get_by_category(month)
- "Lista meus gastos" → list_transactions(month, expense)
- "Apaga o último" → delete_transaction(last)

## CATEGORIAS DISPONÍVEIS
Gastos: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Contas, Outros
Receitas: Salário, Freelance, Investimentos, Vendas, Outros

## REGRAS
1. SEMPRE use as tools para registrar/consultar - nunca invente dados
2. Categorize automaticamente com base na descrição
3. Se o valor ou descrição estiver ambíguo, PERGUNTE antes de registrar
4. Após registrar, confirme com um resumo curto
5. Quando gastos ultrapassarem orçamento, ALERTE o usuário
6. Responda SEMPRE em português brasileiro`;

        // Call Lovable AI Gateway
        const messages: any[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: request.message },
        ];

        let finalResponse = "";
        let maxIterations = 5;

        while (maxIterations > 0) {
            maxIterations--;

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${lovableApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "google/gemini-3-flash-preview",
                    messages,
                    tools,
                    tool_choice: "auto",
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            });

            if (!aiResponse.ok) {
                if (aiResponse.status === 429) {
                    finalResponse = "⏳ Estou sobrecarregada no momento. Tente novamente em alguns segundos!";
                } else if (aiResponse.status === 402) {
                    finalResponse = "⚠️ Serviço temporariamente indisponível. Tente mais tarde!";
                } else {
                    console.error("[Financial AI] Gateway error:", aiResponse.status, await aiResponse.text());
                    finalResponse = "😔 Desculpe, tive um problema ao processar. Tente novamente!";
                }
                break;
            }

            const aiData = await aiResponse.json();
            const choice = aiData.choices?.[0];

            if (!choice) {
                finalResponse = "Desculpe, não consegui processar sua mensagem. Tente novamente!";
                break;
            }

            const assistantMessage = choice.message;
            messages.push(assistantMessage);

            // If there are tool calls, execute them
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolName = toolCall.function.name;
                    let toolArgs: any;
                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments);
                    } catch (parseError) {
                        console.error(`[Financial AI] Failed to parse tool args for ${toolName}:`, toolCall.function.arguments);
                        messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: "Erro ao processar argumentos da ferramenta.",
                        });
                        continue;
                    }
                    console.log(`[Financial AI] Tool call: ${toolName}`, toolArgs);

                    const result = await executeTool(supabase, request.user_id, toolName, toolArgs);
                    console.log(`[Financial AI] Tool result: ${result}`);

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: result,
                    });
                }
                // Continue loop to let AI process tool results
                continue;
            }

            // No tool calls - this is the final text response
            finalResponse = assistantMessage.content || "✅";
            break;
        }

        console.log("[Financial AI] Final response:", finalResponse);

        // Send response via Evolution API
        if (!evolutionApiKey) {
            console.warn("[Financial AI] EVOLUTION_API_KEY not configured - cannot send WhatsApp response");
        }
        if (finalResponse && evolutionApiKey) {
            try {
                await fetch(`${evolutionApiUrl}/message/sendText/${request.instance_name}`, {
                    method: "POST",
                    headers: {
                        apikey: evolutionApiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        number: request.sender_phone,
                        text: finalResponse,
                    }),
                });
            } catch (sendError) {
                console.error("[Financial AI] Error sending message:", sendError);
            }
        }

        return new Response(JSON.stringify({ success: true, response: finalResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[Financial AI] Error:", error);
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
