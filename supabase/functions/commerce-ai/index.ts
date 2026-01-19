// =============================================================================
// Commerce AI - IA de Vendas para E-commerce via WhatsApp
// =============================================================================
// Esta função processa mensagens de clientes e responde como vendedor virtual
// Pode consultar produtos, enviar fotos, processar carrinho e vendas
// COMPLETAMENTE ISOLADA do sistema de assistentes principal
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommerceAIRequest {
    store_id: string;
    conversation_id: string;
    customer_id: string;
    customer_phone: string;
    message: string;
    message_type: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    short_description: string;
    price: number;
    compare_at_price: number;
    stock_quantity: number;
    category_name: string;
    primary_image_url: string;
    ai_selling_points: string;
}

interface CartItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
        const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const request: CommerceAIRequest = await req.json();
        console.log("[Commerce AI] Request:", JSON.stringify(request, null, 2));

        // Busca dados da loja
        const { data: store, error: storeError } = await supabase
            .from("commerce_stores")
            .select("*")
            .eq("id", request.store_id)
            .single();

        if (storeError || !store) {
            throw new Error("Store not found");
        }

        // Busca conversa e contexto
        const { data: conversation } = await supabase
            .from("commerce_conversations")
            .select("*")
            .eq("id", request.conversation_id)
            .single();

        // Busca últimas mensagens para contexto
        const { data: recentMessages } = await supabase
            .from("commerce_messages")
            .select("*")
            .eq("conversation_id", request.conversation_id)
            .order("created_at", { ascending: false })
            .limit(10);

        // Busca dados do cliente
        const { data: customer } = await supabase
            .from("commerce_customers")
            .select("*")
            .eq("id", request.customer_id)
            .single();

        // Busca produtos da loja para a IA ter contexto
        const { data: products } = await supabase.rpc("search_store_products", {
            p_store_id: store.id,
            p_query: null,
            p_category_id: null,
            p_limit: 50,
        });

        // Busca categorias
        const { data: categories } = await supabase
            .from("commerce_categories")
            .select("*")
            .eq("store_id", store.id)
            .eq("is_active", true);

        // Busca configurações de pagamento
        const { data: paymentSettings } = await supabase
            .from("commerce_payment_settings")
            .select("*")
            .eq("store_id", store.id)
            .eq("is_enabled", true);

        // Monta o contexto do carrinho
        const cart = conversation?.current_cart || { items: [] };
        const cartTotal = cart.items.reduce(
            (sum: number, item: CartItem) => sum + item.price * item.quantity,
            0
        );

        // Formata catálogo de produtos para a IA
        const productCatalog = (products || [])
            .map(
                (p: Product) =>
                    `- ${p.name} (R$ ${p.price.toFixed(2)})${p.stock_quantity > 0 ? "" : " [ESGOTADO]"}
   ${p.short_description || p.description?.substring(0, 100) || ""}
   ID: ${p.id}`
            )
            .join("\n");

        // Formata carrinho atual
        const cartDescription =
            cart.items.length > 0
                ? cart.items
                    .map(
                        (item: CartItem) =>
                            `- ${item.quantity}x ${item.product_name}: R$ ${(item.price * item.quantity).toFixed(2)}`
                    )
                    .join("\n") + `\nTotal: R$ ${cartTotal.toFixed(2)}`
                : "Carrinho vazio";

        // Formata histórico de mensagens
        const messageHistory = (recentMessages || [])
            .reverse()
            .map((m: any) => {
                const role = m.sender_type === "customer" ? "Cliente" : "Você";
                return `${role}: ${m.content}`;
            })
            .join("\n");

        // Formata métodos de pagamento
        const paymentMethods = (paymentSettings || [])
            .map((p: any) => {
                if (p.payment_method === "pix") {
                    return `PIX: Chave ${p.pix_key_type} - ${p.pix_key} (${p.pix_holder_name})`;
                }
                return p.payment_method;
            })
            .join(", ");

        // Cria o prompt do sistema - VENDEDOR IA PROFISSIONAL
        const systemPrompt = `# VOCE E O VENDEDOR ESPECIALISTA DA "${store.name.toUpperCase()}"

## SUA IDENTIDADE
Você é um vendedor virtual altamente treinado, especializado nos produtos desta loja. Você não é apenas um assistente - você é um CONSULTOR DE VENDAS que entende profundamente cada produto, suas vantagens e como eles podem transformar a vida do cliente.

${store.ai_personality || "Você é carismático, prestativo e genuinamente interessado em ajudar o cliente a encontrar a solução perfeita."}

${store.ai_instructions || ""}

## TECNICAS DE VENDAS (USE NATURALMENTE)

### 1. RAPPORT - Conexão Genuína
- Use o nome do cliente quando souber
- Demonstre empatia verdadeira
- Faça perguntas sobre as necessidades REAIS do cliente
- Ouça mais do que fala

### 2. SONDAGEM - Descubra a Necessidade
- "Para que você pretende usar?"
- "Você já usou algo parecido antes?"
- "O que é mais importante pra você: [benefício A] ou [benefício B]?"

### 3. APRESENTAÇÃO DE VALOR (não só características!)
- Característica → Vantagem → Benefício → Emoção
- Ex: "Esse produto tem [X]... isso significa que você vai [benefício]... imagina [emoção positiva]"

### 4. PROVA SOCIAL (quando apropriado)
- "Esse é um dos mais vendidos aqui!"
- "Clientes que compraram esse adoraram"

### 5. CRIAÇÃO DE URGÊNCIA (sutil, não agressivo)
- "Últimas unidades" (se stock_quantity < 10)
- "Esse preço é promocional"
- Não force - sugira

### 6. TRATAMENTO DE OBJEÇÕES
- Preço alto → Divida em benefícios, fale do custo-benefício
- Dúvida → Ofereça mais informações ou foto
- "Vou pensar" → "Claro! Posso te ajudar com alguma dúvida específica?"

### 7. FECHAMENTO SUAVE
- "Quer que eu adicione no carrinho?"
- "Posso preparar o pedido pra você?"
- Nunca pressione, convide

## COMANDOS ESPECIAIS (use quando necessário)
1. Adicionar ao carrinho: [CART_ADD:ID_PRODUTO:QUANTIDADE]
2. Remover do carrinho: [CART_REMOVE:ID_PRODUTO]
3. Enviar foto de produto: [SEND_IMAGE:ID_PRODUTO]
4. Finalizar pedido: [CHECKOUT]
5. Transferir para humano: [HUMAN_TAKEOVER]

## CATALOGO DE PRODUTOS DA LOJA
${productCatalog || "Nenhum produto cadastrado ainda. Informe que em breve teremos novidades!"}

## CATEGORIAS DISPONIVEIS
${(categories || []).map((c: any) => `- ${c.name}`).join("\n") || "Produtos em geral"}

## CARRINHO ATUAL DO CLIENTE
${cartDescription}
${cart.items.length > 0 ? "\nDica: Sugira finalizar se o cliente parecer satisfeito" : ""}

## FORMAS DE PAGAMENTO
${paymentMethods || "PIX (transferência instantânea)"}

## PERFIL DO CLIENTE
- Nome: ${customer?.name || "Ainda não sei o nome"}${customer?.name ? "" : " (pergunte de forma natural!)"}
- Histórico: ${customer?.total_orders > 0 ? `Cliente especial! Já fez ${customer.total_orders} pedido(s) - Total: R$ ${customer.total_spent?.toFixed(2)}` : "Primeiro contato - Seja ainda mais acolhedor!"}
${customer?.total_orders > 0 ? "Faca ele se sentir VIP!" : ""}

## HISTORICO DA CONVERSA
${messageHistory || "Primeira mensagem - Seja caloroso na boas-vindas!"}

## ESTILO DE COMUNICACAO
- Use emojis com MODERAÇÃO (1-3 por mensagem)
- Seja conversacional, não robótico
- Mensagens curtas e diretas (WhatsApp não é email!)
- Quando enviar foto, adicione um comentário atrativo
- Preços sempre formatados: R$ XX,XX
- Destaque palavras importantes com *asteriscos*

## REGRAS ABSOLUTAS
1. NUNCA invente produtos que não estão no catálogo
2. NUNCA prometa prazos ou garantias não especificados
3. NUNCA seja insistente demais - respeite o "não"
4. Se não souber algo, diga "Vou verificar isso pra você!" e use [HUMAN_TAKEOVER]
5. Produto esgotado? Ofereça alternativa ou avise quando volta

${store.welcome_message && !messageHistory ? `## PRIMEIRA MENSAGEM - Use sua personalidade:\n"${store.welcome_message}"` : ""}

Agora responda à mensagem do cliente de forma natural, aplicando suas técnicas de vendas quando apropriado:`;

        // Chama a OpenAI
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: request.message },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        const openaiData = await openaiResponse.json();
        let aiResponse = openaiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

        console.log("[Commerce AI] Raw AI Response:", aiResponse);

        // Processa comandos especiais na resposta
        const commands: string[] = [];
        const imagesToSend: string[] = [];
        let shouldCheckout = false;
        let shouldTransferToHuman = false;

        // Extrai comandos [CART_ADD:ID:QTY]
        const cartAddMatches = aiResponse.matchAll(/\[CART_ADD:([^:]+):(\d+)\]/g);
        for (const match of cartAddMatches) {
            const productId = match[1];
            const quantity = parseInt(match[2]);

            // Busca produto
            const product = (products || []).find((p: Product) => p.id === productId);
            if (product) {
                // Atualiza carrinho
                const existingItem = cart.items.find((i: CartItem) => i.product_id === productId);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cart.items.push({
                        product_id: productId,
                        product_name: product.name,
                        quantity: quantity,
                        price: product.price,
                    });
                }
                commands.push(`Adicionado ${quantity}x ${product.name} ao carrinho`);
            }
        }

        // Extrai comandos [CART_REMOVE:ID]
        const cartRemoveMatches = aiResponse.matchAll(/\[CART_REMOVE:([^\]]+)\]/g);
        for (const match of cartRemoveMatches) {
            const productId = match[1];
            cart.items = cart.items.filter((i: CartItem) => i.product_id !== productId);
            commands.push(`Produto removido do carrinho`);
        }

        // Extrai comandos [SEND_IMAGE:ID]
        const imageMatches = aiResponse.matchAll(/\[SEND_IMAGE:([^\]]+)\]/g);
        for (const match of imageMatches) {
            const productId = match[1];
            const product = (products || []).find((p: Product) => p.id === productId);
            if (product?.primary_image_url) {
                imagesToSend.push(product.primary_image_url);
            }
        }

        // Verifica [CHECKOUT]
        if (aiResponse.includes("[CHECKOUT]")) {
            shouldCheckout = true;
        }

        // Verifica [HUMAN_TAKEOVER]
        if (aiResponse.includes("[HUMAN_TAKEOVER]")) {
            shouldTransferToHuman = true;
        }

        // Remove comandos da resposta final
        let cleanResponse = aiResponse
            .replace(/\[CART_ADD:[^\]]+\]/g, "")
            .replace(/\[CART_REMOVE:[^\]]+\]/g, "")
            .replace(/\[SEND_IMAGE:[^\]]+\]/g, "")
            .replace(/\[CHECKOUT\]/g, "")
            .replace(/\[HUMAN_TAKEOVER\]/g, "")
            .trim();

        // Atualiza carrinho na conversa
        if (commands.length > 0) {
            await supabase
                .from("commerce_conversations")
                .update({ current_cart: cart })
                .eq("id", request.conversation_id);
        }

        // Processa checkout
        if (shouldCheckout && cart.items.length > 0) {
            const newTotal = cart.items.reduce(
                (sum: number, item: CartItem) => sum + item.price * item.quantity,
                0
            );

            // Gera número do pedido
            const { data: orderNumber } = await supabase.rpc("generate_order_number", {
                store_uuid: store.id,
            });

            // Cria o pedido
            const { data: order, error: orderError } = await supabase
                .from("commerce_orders")
                .insert({
                    store_id: store.id,
                    customer_id: request.customer_id,
                    order_number: orderNumber,
                    status: "awaiting_payment",
                    subtotal: newTotal,
                    total: newTotal,
                    payment_method: "pix",
                    payment_status: "pending",
                    created_via: "whatsapp",
                })
                .select()
                .single();

            if (order) {
                // Insere itens do pedido
                const orderItems = cart.items.map((item: CartItem) => ({
                    order_id: order.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                }));

                await supabase.from("commerce_order_items").insert(orderItems);

                // Limpa carrinho
                await supabase
                    .from("commerce_conversations")
                    .update({ current_cart: { items: [] } })
                    .eq("id", request.conversation_id);

                // Adiciona informações de pagamento à resposta
                const pixInfo = (paymentSettings || []).find((p: any) => p.payment_method === "pix");
                if (pixInfo) {
                    cleanResponse += `\n\n📋 *Pedido #${orderNumber}*\n`;
                    cleanResponse += `💰 Total: *R$ ${newTotal.toFixed(2)}*\n\n`;
                    cleanResponse += `🔑 *Chave PIX:* ${pixInfo.pix_key}\n`;
                    cleanResponse += `👤 *Nome:* ${pixInfo.pix_holder_name}\n\n`;
                    cleanResponse += `Após o pagamento, envie o comprovante aqui! ✅`;
                }

                // Registra analytics
                await supabase.from("commerce_analytics").insert({
                    store_id: store.id,
                    event_type: "order_complete",
                    customer_id: request.customer_id,
                    order_id: order.id,
                    data: { total: newTotal, items_count: cart.items.length },
                });
            }
        }

        // Processa transferência para humano
        if (shouldTransferToHuman) {
            await supabase
                .from("commerce_conversations")
                .update({ status: "human_takeover" })
                .eq("id", request.conversation_id);

            cleanResponse += "\n\n👤 Um atendente humano irá te responder em breve!";
        }

        // Salva resposta da IA
        await supabase.from("commerce_messages").insert({
            conversation_id: request.conversation_id,
            sender_type: "ai",
            content: cleanResponse,
            message_type: "text",
        });

        // Envia resposta via WhatsApp
        const sendMessage = async (text: string) => {
            try {
                await fetch(`${evolutionApiUrl}/message/sendText/${store.whatsapp_instance_id}`, {
                    method: "POST",
                    headers: {
                        apikey: evolutionApiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        number: request.customer_phone,
                        text: text,
                    }),
                });
            } catch (e) {
                console.error("[Commerce AI] Error sending message:", e);
            }
        };

        // Envia imagens primeiro
        for (const imageUrl of imagesToSend) {
            try {
                await fetch(`${evolutionApiUrl}/message/sendMedia/${store.whatsapp_instance_id}`, {
                    method: "POST",
                    headers: {
                        apikey: evolutionApiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        number: request.customer_phone,
                        mediatype: "image",
                        media: imageUrl,
                    }),
                });
                // Pequeno delay entre imagens
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (e) {
                console.error("[Commerce AI] Error sending image:", e);
            }
        }

        // Envia texto
        if (cleanResponse) {
            await sendMessage(cleanResponse);
        }

        return new Response(
            JSON.stringify({
                success: true,
                response: cleanResponse,
                commands_executed: commands,
                images_sent: imagesToSend.length,
                checkout_triggered: shouldCheckout,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[Commerce AI] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
