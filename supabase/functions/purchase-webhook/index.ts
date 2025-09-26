import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper para logs detalhados
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [PURCHASE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("=== WEBHOOK RECEBIDO ===");
    logStep("Method", req.method);
    logStep("Headers", Object.fromEntries(req.headers.entries()));

    if (req.method !== "POST") {
      logStep("ERROR: Method not allowed", req.method);
      return new Response("Method not allowed", { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Criar cliente Supabase usando service role para bypass de RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Ler o payload do webhook
    const payload = await req.text();
    logStep("Raw payload", payload);

    let webhookData;
    try {
      webhookData = JSON.parse(payload);
      logStep("Parsed webhook data", webhookData);
    } catch (error) {
      logStep("ERROR: Invalid JSON payload", error instanceof Error ? error.message : 'Unknown error');
      return new Response("Invalid JSON", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Extrair informações do webhook (ajustar conforme seu processador de pagamento)
    // Estrutura comum para webhooks de pagamento:
    const {
      email,
      status,
      payment_id,
      amount,
      currency = "BRL",
      customer_email,
      transaction_id,
      event_type,
      // Adicione outros campos conforme necessário
    } = webhookData;

    // Email pode vir em diferentes campos dependendo do processador
    const customerEmail = email || customer_email || webhookData.customer?.email;
    const paymentId = payment_id || transaction_id || webhookData.id;
    const paymentStatus = status || webhookData.status || webhookData.event_type;

    logStep("Extracted data", {
      email: customerEmail,
      status: paymentStatus,
      payment_id: paymentId,
      amount,
      currency
    });

    if (!customerEmail) {
      logStep("ERROR: Email não encontrado no webhook");
      return new Response("Email não encontrado", { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Determinar se o pagamento foi aprovado
    // Ajuste estas condições conforme seu processador de pagamento
    const isApproved = (
      paymentStatus === "approved" ||
      paymentStatus === "paid" ||
      paymentStatus === "completed" ||
      paymentStatus === "success" ||
      event_type === "payment.approved" ||
      event_type === "payment.paid"
    );

    logStep("Payment approval status", { isApproved, status: paymentStatus });

    // Registrar/atualizar assinante na tabela
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from("paid_subscribers")
      .upsert({
        email: customerEmail,
        payment_status: isApproved ? "approved" : "pending",
        payment_id: paymentId,
        amount: amount ? parseFloat(amount) : null,
        currency,
        payment_processor: "sellpay",
        subscription_start: isApproved ? new Date().toISOString() : null,
        subscription_end: isApproved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // 30 dias
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (subscriberError) {
      logStep("ERROR: Erro ao salvar assinante", subscriberError);
      throw subscriberError;
    }

    logStep("Subscriber data saved", subscriberData);

    // Se pagamento aprovado, atualizar quotas do usuário
    if (isApproved) {
      logStep("Payment approved, upgrading user");
      
      const { error: upgradeError } = await supabaseClient.rpc(
        'upgrade_user_to_paid',
        { target_email: customerEmail }
      );

      if (upgradeError) {
        logStep("ERROR: Erro ao fazer upgrade do usuário", upgradeError);
        // Não retornar erro aqui pois o assinante foi salvo
      } else {
        logStep("User upgraded successfully");
      }
    }

    logStep("=== WEBHOOK PROCESSADO COM SUCESSO ===");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook processado com sucesso",
        data: {
          email: customerEmail,
          status: paymentStatus,
          approved: isApproved
        }
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Erro geral", { message: errorMessage, stack: error instanceof Error ? error.stack : 'No stack trace' });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});