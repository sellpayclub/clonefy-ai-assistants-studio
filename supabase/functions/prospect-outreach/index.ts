import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") ||
  "https://evolutionapi.clonefyia.com";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") ||
  "94805bfbb25f77f37a029f5a3dbfe62b";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

interface ProspectCompany {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string | null;
  email: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  socioPrincipal: string | null;
  cnae: string | null;
  cnaeDescricao: string | null;
  situacao: string;
  hasPhone: boolean;
}

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json?.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return digits;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function renderTemplate(template: string, company: ProspectCompany): string {
  const nome = company.socioPrincipal || company.nomeFantasia || company.razaoSocial || "Cliente";
  const empresa = company.nomeFantasia || company.razaoSocial || "sua empresa";
  return template
    .replace(/\{nome\}/gi, nome)
    .replace(/\{empresa\}/gi, empresa)
    .replace(/\{cidade\}/gi, company.cidade || "")
    .replace(/\{uf\}/gi, company.uf || "")
    .replace(/\{socio\}/gi, company.socioPrincipal || "")
    .replace(/\{cnpj\}/gi, company.cnpj || "");
}

function hasValidPhone(company: ProspectCompany): boolean {
  const digits = (company.telefone || "").replace(/\D/g, "");
  return digits.length >= 11;
}

function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

async function sendWhatsAppMessage(
  instanceName: string,
  number: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedNumber = number.replace(/\D/g, "");
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number: formattedNumber, text: message }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      try {
        const parsed = JSON.parse(errText);
        const msg = parsed?.message || parsed?.error || parsed?.response?.message;
        if (msg) return { success: false, error: String(msg) };
      } catch {
        /* texto puro */
      }
      if (/invalid credentials/i.test(errText)) {
        return {
          success: false,
          error:
            "Chave da Evolution API inválida. Configure EVOLUTION_API_KEY nos secrets do Supabase.",
        };
      }
      return { success: false, error: errText.slice(0, 300) };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

async function upsertCrmLead(
  userId: string,
  company: ProspectCompany,
  whatsappNumber: string,
  meta: { ramo: string; cidade: string },
): Promise<string | null> {
  const cleanCnpj = company.cnpj.replace(/\D/g, "");
  const tagSlug = `${meta.ramo}-${meta.cidade}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const leadData = {
    user_id: userId,
    name: company.nomeFantasia || company.razaoSocial || "Empresa",
    company: company.razaoSocial,
    whatsapp_number: whatsappNumber,
    email: company.email,
    cpf_cnpj: formatCnpj(cleanCnpj),
    address: company.endereco,
    source: "prospeccao",
    pipeline_stage: "novo",
    lead_score: 30,
    status: "aberto",
    intent_summary: company.cnaeDescricao
      ? `Prospecção CNPJ: ${company.cnaeDescricao}`
      : "Lead prospectado por CNPJ (Receita Federal)",
    tags: ["prospeccao", "cnpj", "outreach", tagSlug].filter(Boolean),
    last_interaction: new Date().toISOString(),
    custom_fields: {
      socio_principal: company.socioPrincipal,
      cnae: company.cnae,
      cidade: company.cidade,
      uf: company.uf,
      data_source: "cnpj",
    },
  };

  const { data, error } = await supabase
    .from("crm_leads")
    .upsert(leadData, { onConflict: "user_id,whatsapp_number" })
    .select("id")
    .single();

  if (error) {
    console.error("CRM upsert error:", error);
    return null;
  }
  return data?.id || null;
}

async function validateInstance(userEmail: string, instanceName: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const normalizedInstance = instanceName.trim();

  const { data: rows, error } = await supabase
    .from("n8n_fluxogpt")
    .select("nomeinstancia, idassistentgpt, emailuser")
    .ilike("nomeinstancia", normalizedInstance)
    .not("emailuser", "is", null);

  if (error) {
    console.error("validateInstance db error:", error);
    throw new Error(`Erro ao buscar conexão WhatsApp: ${error.message}`);
  }

  const data = (rows || []).find(
    (row) => (row.emailuser || "").trim().toLowerCase() === normalizedEmail,
  );

  if (!data) {
    throw new Error(
      `Conexão "${normalizedInstance}" não encontrada para ${userEmail}. Verifique em Conexões WhatsApp.`,
    );
  }
  if (!data.idassistentgpt?.trim()) {
    throw new Error("Esta conexão não tem assistente IA configurado");
  }

  const statusResponse = await fetch(
    `${EVOLUTION_API_URL}/instance/connectionState/${data.nomeinstancia}`,
    { headers: { apikey: EVOLUTION_API_KEY } },
  );
  if (statusResponse.ok) {
    const statusData = await statusResponse.json();
    const state = statusData?.instance?.state || statusData?.state;
    if (state && state !== "open") {
      throw new Error("WhatsApp desconectado. Reconecte em Conexões WhatsApp.");
    }
  }

  return data;
}

async function startCampaign(
  userId: string,
  userEmail: string,
  data: Record<string, unknown>,
) {
  const companies = (data.companies || []) as ProspectCompany[];
  const messageTemplate = String(data.message_template || "").trim();
  const whatsappInstance = String(data.whatsapp_instance || "").trim();
  const delaySeconds = Math.min(Math.max(Number(data.delay_seconds) || 45, 30), 120);
  const importToCrm = data.import_to_crm !== false;
  const campaignName = String(data.campaign_name || "Prospecção WhatsApp");

  if (!messageTemplate) throw new Error("Template de mensagem é obrigatório");
  if (!whatsappInstance) throw new Error("Selecione uma conexão WhatsApp");
  if (!companies.length) throw new Error("Nenhuma empresa selecionada");

  const instance = await validateInstance(userEmail, whatsappInstance);

  const validLeads: { company: ProspectCompany; phone: string; message: string }[] = [];
  let skipped = 0;

  for (const company of companies) {
    if (!hasValidPhone(company)) {
      skipped++;
      continue;
    }
    const phone = formatWhatsAppNumber(company.telefone!);
    validLeads.push({
      company,
      phone,
      message: renderTemplate(messageTemplate, company),
    });
  }

  if (!validLeads.length) {
    throw new Error("Nenhum lead com telefone válido para disparo");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("prospect_outreach_campaigns")
    .insert({
      user_id: userId,
      name: campaignName,
      message_template: messageTemplate,
      whatsapp_instance: whatsappInstance,
      assistant_id: instance.idassistentgpt,
      delay_seconds: delaySeconds,
      import_to_crm: importToCrm,
      status: "running",
      total_leads: validLeads.length,
      skipped_count: skipped,
      search_context: data.search_context || {},
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Erro ao criar campanha: ${campaignError?.message}`);
  }

  const meta = {
    ramo: (data.search_context as any)?.ramo || "prospeccao",
    cidade: (data.search_context as any)?.municipioNome || "",
  };

  const baseTime = Date.now();
  const queueItems = [];

  for (let i = 0; i < validLeads.length; i++) {
    const lead = validLeads[i];
    let crmLeadId: string | null = null;

    if (importToCrm) {
      crmLeadId = await upsertCrmLead(userId, lead.company, lead.phone, meta);
    }

    const jitterMs = Math.floor(Math.random() * 10000);
    const scheduledAt = new Date(baseTime + i * delaySeconds * 1000 + jitterMs).toISOString();

    queueItems.push({
      campaign_id: campaign.id,
      user_id: userId,
      cnpj: lead.company.cnpj,
      lead_name: lead.company.nomeFantasia || lead.company.razaoSocial,
      whatsapp_number: lead.phone,
      message_body: lead.message,
      scheduled_at: scheduledAt,
      status: "pending",
      crm_lead_id: crmLeadId,
    });
  }

  const { error: queueError } = await supabase
    .from("prospect_outreach_queue")
    .insert(queueItems);

  if (queueError) {
    await supabase
      .from("prospect_outreach_campaigns")
      .update({ status: "failed" })
      .eq("id", campaign.id);
    throw new Error(`Erro ao criar fila: ${queueError.message}`);
  }

  const estimatedMinutes = Math.ceil((validLeads.length * delaySeconds) / 60);

  return {
    campaignId: campaign.id,
    queued: validLeads.length,
    skipped,
    estimatedMinutes,
  };
}

async function dispatchOne(queueId: string) {
  const { data: item, error: itemError } = await supabase
    .from("prospect_outreach_queue")
    .select("*")
    .eq("id", queueId)
    .single();

  if (itemError || !item) {
    throw new Error(`Item da fila não encontrado: ${itemError?.message}`);
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("prospect_outreach_campaigns")
    .select("id, user_id, whatsapp_instance, assistant_id, status, sent_count, failed_count")
    .eq("id", item.campaign_id)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Campanha não encontrada: ${campaignError?.message}`);
  }

  if (campaign.status !== "running") {
    await supabase
      .from("prospect_outreach_queue")
      .update({ status: "skipped", error_message: "Campanha não está ativa" })
      .eq("id", queueId);
    return { status: "skipped" };
  }

  const sendResult = await sendWhatsAppMessage(
    campaign.whatsapp_instance,
    item.whatsapp_number,
    item.message_body,
  );

  if (!sendResult.success) {
    const attempts = (item.attempts || 0) + 1;
    const newStatus = attempts >= 3 ? "failed" : "pending";
    const retryDelay = attempts * 60 * 1000;

    await supabase
      .from("prospect_outreach_queue")
      .update({
        status: newStatus,
        attempts,
        error_message: sendResult.error,
        scheduled_at: newStatus === "pending"
          ? new Date(Date.now() + retryDelay).toISOString()
          : item.scheduled_at,
      })
      .eq("id", queueId);

    if (newStatus === "failed") {
      await supabase
        .from("prospect_outreach_campaigns")
        .update({ failed_count: (campaign.failed_count || 0) + 1 })
        .eq("id", campaign.id);
    }

    throw new Error(sendResult.error || "Falha ao enviar");
  }

  await supabase
    .from("prospect_outreach_queue")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", queueId);

  await supabase
    .from("prospect_outreach_campaigns")
    .update({ sent_count: (campaign.sent_count || 0) + 1 })
    .eq("id", campaign.id);

  await supabase
    .from("live_chat_sessions")
    .upsert(
      {
        user_id: item.user_id,
        instance_name: campaign.whatsapp_instance,
        contact_number: item.whatsapp_number.replace(/\D/g, ""),
        contact_name: item.lead_name,
        source: "whatsapp",
        status: "ai_active",
        assistant_id: campaign.assistant_id,
        last_message_at: new Date().toISOString(),
        last_message_preview: item.message_body.substring(0, 100),
        last_sender_type: "bot",
      },
      { onConflict: "user_id,instance_name,contact_number" },
    );

  const { count: pendingCount } = await supabase
    .from("prospect_outreach_queue")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .in("status", ["pending", "processing"]);

  if ((pendingCount || 0) === 0) {
    await supabase
      .from("prospect_outreach_campaigns")
      .update({ status: "completed" })
      .eq("id", campaign.id);
  }

  return { status: "sent", queue_id: queueId };
}

async function getCampaignStatus(campaignId: string, userId: string) {
  const { data: campaign, error } = await supabase
    .from("prospect_outreach_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (error || !campaign) {
    throw new Error("Campanha não encontrada");
  }

  const { count: pendingCount } = await supabase
    .from("prospect_outreach_queue")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "pending");

  return {
    id: campaign.id,
    status: campaign.status,
    total_leads: campaign.total_leads,
    sent_count: campaign.sent_count,
    failed_count: campaign.failed_count,
    skipped_count: campaign.skipped_count,
    pending_count: pendingCount || 0,
  };
}

async function processQueueBatch() {
  const now = new Date().toISOString();
  const { data: items } = await supabase
    .from("prospect_outreach_queue")
    .select("id, campaign_id")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .limit(5);

  let processed = 0;
  for (const item of items || []) {
    const { data: campaign } = await supabase
      .from("prospect_outreach_campaigns")
      .select("status")
      .eq("id", item.campaign_id)
      .single();

    if (campaign?.status !== "running") continue;

    await supabase
      .from("prospect_outreach_queue")
      .update({ status: "processing", attempts: 1 })
      .eq("id", item.id);

    try {
      await dispatchOne(item.id);
      processed++;
    } catch (err) {
      console.error("Dispatch error:", err);
    }
  }

  return { processed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action as string;

    const authHeader = req.headers.get("Authorization");
    const isCronDispatch = action === "dispatch_one" && body.queue_id && authHeader;

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    if (action === "dispatch_one" && body.queue_id) {
      const result = await dispatchOne(body.queue_id);
      return jsonResponse(result);
    }

    if (action === "process_queue") {
      const result = await processQueueBatch();
      return jsonResponse(result);
    }

    if (!userId) {
      console.warn("prospect-outreach: 401", { action, hasAuth: !!authHeader });
      return jsonResponse({ error: "Não autorizado — faça login novamente" }, 401);
    }

    console.log("prospect-outreach:", { action, userId, userEmail });

    switch (action) {
      case "start_campaign":
        if (!userEmail) {
          return jsonResponse({ error: "E-mail do usuário não encontrado" }, 400);
        }
        return jsonResponse(await startCampaign(userId, userEmail, body));

      case "get_campaign_status":
        return jsonResponse(
          await getCampaignStatus(body.campaign_id, userId),
        );

      default:
        return jsonResponse({ error: "Ação inválida" }, 400);
    }
  } catch (error) {
    console.error("prospect-outreach error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erro interno" },
      500,
    );
  }
});
