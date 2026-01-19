// =============================================================================
// Commerce Webhook - Recebe mensagens do WhatsApp para lojas
// =============================================================================
// Esta função é ISOLADA do sistema principal de assistentes
// Processa apenas mensagens para lojas de e-commerce
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
    key: {
        remoteJid: string;
        fromMe: boolean;
        id: string;
    };
    message?: {
        conversation?: string;
        extendedTextMessage?: {
            text: string;
        };
        imageMessage?: {
            url?: string;
            caption?: string;
        };
        audioMessage?: {
            url?: string;
        };
    };
    messageTimestamp?: number;
    pushName?: string;
}

interface WebhookPayload {
    event: string;
    instance: string;
    data: WhatsAppMessage | WhatsAppMessage[];
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload: WebhookPayload = await req.json();
        console.log("[Commerce Webhook] Received:", JSON.stringify(payload, null, 2));

        // Processa apenas eventos de mensagens
        if (payload.event !== "messages.upsert") {
            return new Response(
                JSON.stringify({ success: true, message: "Event ignored" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const instanceId = payload.instance;
        const messages = Array.isArray(payload.data) ? payload.data : [payload.data];

        // Busca a loja pelo instance_id
        const { data: store, error: storeError } = await supabase
            .from("commerce_stores")
            .select("*")
            .eq("whatsapp_instance_id", instanceId)
            .eq("is_active", true)
            .single();

        if (storeError || !store) {
            console.log("[Commerce Webhook] Store not found for instance:", instanceId);
            return new Response(
                JSON.stringify({ success: false, message: "Store not found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("[Commerce Webhook] Found store:", store.name);

        for (const msg of messages) {
            // Ignora mensagens enviadas por nós
            if (msg.key.fromMe) continue;

            // Extrai número do cliente
            const customerPhone = msg.key.remoteJid.replace("@s.whatsapp.net", "");
            const customerName = msg.pushName || "Cliente";

            // Extrai conteúdo da mensagem
            let messageContent = "";
            let messageType = "text";
            let mediaUrl = "";

            if (msg.message?.conversation) {
                messageContent = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                messageContent = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage) {
                messageType = "image";
                messageContent = msg.message.imageMessage.caption || "[Imagem]";
                mediaUrl = msg.message.imageMessage.url || "";
            } else if (msg.message?.audioMessage) {
                messageType = "audio";
                messageContent = "[Áudio]";
                mediaUrl = msg.message.audioMessage.url || "";
            }

            if (!messageContent && messageType === "text") {
                console.log("[Commerce Webhook] Empty message, skipping");
                continue;
            }

            console.log(`[Commerce Webhook] Processing message from ${customerPhone}: ${messageContent}`);

            // Encontra ou cria o cliente
            const { data: customerId } = await supabase.rpc("find_or_create_customer", {
                p_store_id: store.id,
                p_whatsapp_number: customerPhone,
                p_name: customerName,
            });

            if (!customerId) {
                console.error("[Commerce Webhook] Failed to find/create customer");
                continue;
            }

            // Busca ou cria conversa ativa
            let { data: conversation } = await supabase
                .from("commerce_conversations")
                .select("*")
                .eq("store_id", store.id)
                .eq("customer_id", customerId)
                .eq("status", "active")
                .single();

            if (!conversation) {
                const { data: newConversation, error: convError } = await supabase
                    .from("commerce_conversations")
                    .insert({
                        store_id: store.id,
                        customer_id: customerId,
                        status: "active",
                        current_cart: { items: [] },
                        context: {},
                    })
                    .select()
                    .single();

                if (convError) {
                    console.error("[Commerce Webhook] Error creating conversation:", convError);
                    continue;
                }
                conversation = newConversation;
            }

            // Salva a mensagem do cliente
            await supabase.from("commerce_messages").insert({
                conversation_id: conversation.id,
                sender_type: "customer",
                content: messageContent,
                message_type: messageType,
                media_url: mediaUrl || null,
                metadata: { whatsapp_id: msg.key.id },
            });

            // Atualiza timestamp da conversa
            await supabase
                .from("commerce_conversations")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", conversation.id);

            // Se a conversa está em modo "human_takeover", não processa com IA
            if (conversation.status === "human_takeover") {
                console.log("[Commerce Webhook] Conversation in human takeover mode, skipping AI");
                continue;
            }

            // Chama a função de IA para processar a mensagem
            try {
                const aiResponse = await fetch(`${supabaseUrl}/functions/v1/commerce-ai`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                        store_id: store.id,
                        conversation_id: conversation.id,
                        customer_id: customerId,
                        customer_phone: customerPhone,
                        message: messageContent,
                        message_type: messageType,
                    }),
                });

                const aiResult = await aiResponse.json();
                console.log("[Commerce Webhook] AI Response:", aiResult);
            } catch (aiError) {
                console.error("[Commerce Webhook] Error calling AI:", aiError);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "Messages processed" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[Commerce Webhook] Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
