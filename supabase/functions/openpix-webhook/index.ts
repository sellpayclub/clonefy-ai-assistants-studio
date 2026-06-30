// =============================================================================
// OpenPix Webhook - Confirma pagamento PIX e credita o Saldo de API
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-openpix-signature",
};

const OPENPIX_BASE = "https://api.openpix.com.br/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("OPENPIX_APP_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const payload = await req.json().catch(() => ({}));
    console.log("[openpix-webhook] evento:", payload?.event ?? "(teste/sem evento)");

    const charge = payload?.charge;
    const correlationID = charge?.correlationID;

    // Teste de configuração do webhook ou payload sem cobrança -> 200 OK
    if (!correlationID) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revalida o status diretamente na OpenPix (segurança)
    let status = charge?.status;
    if (appId) {
      try {
        const resp = await fetch(`${OPENPIX_BASE}/charge/${correlationID}`, {
          headers: { Authorization: appId },
        });
        const data = await resp.json().catch(() => ({}));
        if (data?.charge?.status) status = data.charge.status;
      } catch (e) {
        console.error("[openpix-webhook] falha ao revalidar:", e);
      }
    }

    if (status !== "COMPLETED" && status !== "CONFIRMED") {
      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Localiza transação pendente
    const { data: tx } = await admin
      .from("api_wallet_transactions")
      .select("*")
      .eq("openpix_correlation_id", correlationID)
      .maybeSingle();

    if (!tx) {
      console.log("[openpix-webhook] transação não encontrada para", correlationID);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tx.status === "paid") {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("api_wallet_transactions")
      .update({ status: "paid" })
      .eq("id", tx.id)
      .eq("status", "pending");

    await admin.rpc("credit_api_wallet", {
      _user_id: tx.user_id,
      _amount: Number(tx.amount_brl),
      _correlation_id: correlationID,
    });

    console.log(`[openpix-webhook] crédito de R$${tx.amount_brl} para ${tx.user_id}`);

    return new Response(JSON.stringify({ ok: true, credited: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[openpix-webhook] erro:", error);
    // Retorna 200 para evitar reenvios em loop por erro nosso
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
