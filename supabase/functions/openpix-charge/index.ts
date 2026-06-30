// =============================================================================
// OpenPix Charge - Gera cobrança PIX (Woovi/OpenPix) para recarregar Saldo de API
// =============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENPIX_BASE = "https://api.openpix.com.br/api/v1";

// Valores de recarga permitidos (BRL). Mínimo ~US$10.
const ALLOWED_AMOUNTS = [55, 110, 220, 440, 880];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("OPENPIX_APP_ID");
    if (!appId) throw new Error("OPENPIX_APP_ID não configurado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identificar usuário a partir do JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "create";

    // -------------------------------------------------------------------------
    // CHECK: revalida o status de uma cobrança e credita se já foi paga
    // (fallback caso o webhook ainda não esteja configurado no painel)
    // -------------------------------------------------------------------------
    if (action === "check") {
      const correlationID = String(body.correlationID ?? "");
      if (!correlationID) {
        return new Response(JSON.stringify({ error: "correlationID obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tx } = await admin
        .from("api_wallet_transactions")
        .select("*")
        .eq("openpix_correlation_id", correlationID)
        .eq("user_id", userId)
        .maybeSingle();

      if (!tx) {
        return new Response(JSON.stringify({ status: "not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (tx.status === "paid") {
        return new Response(JSON.stringify({ status: "paid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Consulta na OpenPix
      const resp = await fetch(`${OPENPIX_BASE}/charge/${correlationID}`, {
        headers: { Authorization: appId },
      });
      const data = await resp.json().catch(() => ({}));
      const status = data?.charge?.status;

      if (status === "COMPLETED" || status === "CONFIRMED") {
        await admin
          .from("api_wallet_transactions")
          .update({ status: "paid" })
          .eq("id", tx.id)
          .eq("status", "pending");

        await admin.rpc("credit_api_wallet", {
          _user_id: userId,
          _amount: Number(tx.amount_brl),
          _correlation_id: correlationID,
        });

        return new Response(JSON.stringify({ status: "paid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------------------
    // CREATE: cria a cobrança PIX
    // -------------------------------------------------------------------------
    const amount = Number(body.amount_brl);
    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correlationID = crypto.randomUUID();
    const valueCents = Math.round(amount * 100);

    const chargeResp = await fetch(`${OPENPIX_BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID,
        value: valueCents,
        comment: `Recarga Saldo de API - R$${amount.toFixed(2)}`,
      }),
    });

    const chargeData = await chargeResp.json();
    if (!chargeResp.ok || !chargeData?.charge) {
      console.error("[openpix-charge] erro OpenPix:", JSON.stringify(chargeData));
      throw new Error(chargeData?.error || "Falha ao criar cobrança PIX");
    }

    const charge = chargeData.charge;

    // Registra transação pendente
    await admin.from("api_wallet_transactions").insert({
      user_id: userId,
      type: "recharge",
      amount_brl: amount,
      description: `Recarga PIX R$${amount.toFixed(2)}`,
      openpix_correlation_id: correlationID,
      openpix_charge_id: charge.identifier ?? charge.globalID ?? null,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        correlationID,
        brCode: charge.brCode,
        qrCodeImage: charge.qrCodeImage,
        amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[openpix-charge] erro:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
