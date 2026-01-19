// =============================================================================
// Commerce Payment - Gera PIX e processa pagamentos
// =============================================================================
// Função ISOLADA para geração de códigos PIX e processamento de pagamentos
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
    action: "generate_pix" | "confirm_payment" | "get_payment_info";
    store_id: string;
    order_id?: string;
    amount?: number;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const request: PaymentRequest = await req.json();
        console.log("[Commerce Payment] Request:", JSON.stringify(request, null, 2));

        // Busca configurações de pagamento da loja
        const { data: store, error: storeError } = await supabase
            .from("commerce_stores")
            .select("*")
            .eq("id", request.store_id)
            .single();

        if (storeError || !store) {
            throw new Error("Store not found");
        }

        const { data: paymentSettings } = await supabase
            .from("commerce_payment_settings")
            .select("*")
            .eq("store_id", request.store_id)
            .eq("payment_method", "pix")
            .eq("is_enabled", true)
            .single();

        switch (request.action) {
            case "generate_pix": {
                if (!request.order_id) {
                    throw new Error("Order ID is required");
                }

                // Busca o pedido
                const { data: order, error: orderError } = await supabase
                    .from("commerce_orders")
                    .select("*")
                    .eq("id", request.order_id)
                    .single();

                if (orderError || !order) {
                    throw new Error("Order not found");
                }

                // Busca cliente
                const { data: customer } = await supabase
                    .from("commerce_customers")
                    .select("*")
                    .eq("id", order.customer_id)
                    .single();

                // Gera código PIX Copia e Cola (EMV)
                // Formato básico do PIX EMV
                const pixKey = paymentSettings?.pix_key || "";
                const pixKeyType = paymentSettings?.pix_key_type || "random";
                const merchantName = paymentSettings?.pix_holder_name || store.name;
                const amount = order.total;
                const txId = order.order_number.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25);

                // Monta o código PIX EMV
                const pixCode = generatePixCode({
                    pixKey,
                    merchantName,
                    merchantCity: "SAO PAULO", // Pode ser configurável
                    amount,
                    txId,
                });

                // Atualiza pedido com referência do pagamento
                await supabase
                    .from("commerce_orders")
                    .update({
                        payment_reference: txId,
                        payment_status: "pending",
                    })
                    .eq("id", request.order_id);

                return new Response(
                    JSON.stringify({
                        success: true,
                        pix_code: pixCode,
                        pix_key: pixKey,
                        pix_holder: merchantName,
                        amount: amount,
                        order_number: order.order_number,
                        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "confirm_payment": {
                if (!request.order_id) {
                    throw new Error("Order ID is required");
                }

                // Atualiza o pedido como pago
                const { data: order, error: orderError } = await supabase
                    .from("commerce_orders")
                    .update({
                        status: "paid",
                        payment_status: "paid",
                        paid_at: new Date().toISOString(),
                    })
                    .eq("id", request.order_id)
                    .select()
                    .single();

                if (orderError) {
                    throw new Error("Failed to confirm payment");
                }

                // Registra analytics
                await supabase.from("commerce_analytics").insert({
                    store_id: request.store_id,
                    event_type: "payment_confirmed",
                    order_id: request.order_id,
                    data: { amount: order.total },
                });

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: "Payment confirmed",
                        order_number: order.order_number,
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_payment_info": {
                return new Response(
                    JSON.stringify({
                        success: true,
                        payment_methods: {
                            pix: {
                                enabled: !!paymentSettings,
                                key: paymentSettings?.pix_key,
                                key_type: paymentSettings?.pix_key_type,
                                holder_name: paymentSettings?.pix_holder_name,
                            },
                        },
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            default:
                throw new Error("Invalid action");
        }
    } catch (error) {
        console.error("[Commerce Payment] Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// Função para gerar código PIX EMV
function generatePixCode(params: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txId: string;
}): string {
    const { pixKey, merchantName, merchantCity, amount, txId } = params;

    // Função auxiliar para formatar TLV (Tag-Length-Value)
    const tlv = (tag: string, value: string): string => {
        const length = value.length.toString().padStart(2, "0");
        return `${tag}${length}${value}`;
    };

    // Merchant Account Information (tag 26)
    const gui = tlv("00", "BR.GOV.BCB.PIX");
    const key = tlv("01", pixKey);
    const merchantAccount = tlv("26", gui + key);

    // Transaction Amount (tag 54)
    const transactionAmount = amount > 0 ? tlv("54", amount.toFixed(2)) : "";

    // Additional Data (tag 62)
    const txIdField = tlv("05", txId);
    const additionalData = tlv("62", txIdField);

    // Monta o payload base
    let payload = "";
    payload += tlv("00", "01"); // Payload Format Indicator
    payload += merchantAccount; // Merchant Account Information
    payload += tlv("52", "0000"); // Merchant Category Code
    payload += tlv("53", "986"); // Transaction Currency (BRL)
    payload += transactionAmount; // Transaction Amount
    payload += tlv("58", "BR"); // Country Code
    payload += tlv("59", merchantName.substring(0, 25).toUpperCase()); // Merchant Name
    payload += tlv("60", merchantCity.substring(0, 15).toUpperCase()); // Merchant City
    payload += additionalData; // Additional Data

    // Adiciona o CRC16 (tag 63)
    payload += "6304";
    const crc = calculateCRC16(payload);
    payload += crc;

    return payload;
}

// Calcula CRC16-CCITT-FALSE
function calculateCRC16(payload: string): string {
    let crc = 0xffff;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ polynomial) & 0xffff;
            } else {
                crc = (crc << 1) & 0xffff;
            }
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
}
