// =============================================================================
// Financial Webhook - Recebe mensagens do WhatsApp para agente financeiro
// COMPLETAMENTE ISOLADA do sistema principal de assistentes e commerce
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
        extendedTextMessage?: { text: string };
    };
    pushName?: string;
}

interface WebhookPayload {
    event: string;
    instance: string;
    data: WhatsAppMessage | WhatsAppMessage[];
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload: WebhookPayload = await req.json();
        console.log("[Financial Webhook] Event:", payload.event, "Instance:", payload.instance);

        if (payload.event !== "messages.upsert") {
            return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const instanceName = payload.instance;
        const messages = Array.isArray(payload.data) ? payload.data : [payload.data];

        // Find financial account by instance name
        const { data: account, error: accError } = await supabase
            .from("financial_accounts")
            .select("*")
            .eq("whatsapp_instance_name", instanceName)
            .eq("whatsapp_connected", true)
            .single();

        if (accError || !account) {
            console.log("[Financial Webhook] Account not found for instance:", instanceName);
            return new Response(JSON.stringify({ success: false, message: "Account not found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        for (const msg of messages) {
            if (msg.key.fromMe) continue;

            // Ignorar mensagens de grupo
            if (msg.key.remoteJid.includes("@g.us")) continue;

            const senderPhone = msg.key.remoteJid.replace("@s.whatsapp.net", "");
            let messageContent = "";

            if (msg.message?.conversation) {
                messageContent = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                messageContent = msg.message.extendedTextMessage.text;
            }

            if (!messageContent) continue;

            console.log(`[Financial Webhook] Message from ${senderPhone}: ${messageContent}`);

            // Call financial-ai
            try {
                const aiResponse = await fetch(`${supabaseUrl}/functions/v1/financial-ai`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                        user_id: account.user_id,
                        instance_name: instanceName,
                        sender_phone: senderPhone,
                        message: messageContent,
                    }),
                });

                if (aiResponse.ok) {
                    const aiResult = await aiResponse.json();
                    console.log("[Financial Webhook] AI result:", JSON.stringify(aiResult));
                } else {
                    console.error("[Financial Webhook] AI returned error:", aiResponse.status, await aiResponse.text().catch(() => ""));
                }
            } catch (aiError) {
                console.error("[Financial Webhook] Error calling AI:", aiError);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[Financial Webhook] Error:", error);
        return new Response(JSON.stringify({ success: false, error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
