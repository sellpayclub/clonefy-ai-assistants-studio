import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseServiceKey } from "../_shared/openai-responses.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const evolutionUrl = Deno.env.get("EVOLUTION_API_URL") ?? "https://evolutionapi.clonefyia.com";
const evolutionKey = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const admin = createClient(supabaseUrl, getSupabaseServiceKey());

type Run = {
  id: string;
  funnel_id: string;
  started_by: string;
  session_id: string;
  instance_name: string;
  contact_number: string;
  current_step_position: number;
  status: string;
};

type Step = {
  id: string;
  position: number;
  step_type: "text" | "audio" | "image" | "video" | "document" | "wait" | "wait_for_reply";
  asset_id: string | null;
  content: string | null;
  delay_seconds: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticatedUser(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

function renderVariables(value: string, contactName: string | null, contactNumber: string) {
  return value
    .replaceAll("{{nome}}", contactName || "")
    .replaceAll("{nome}", contactName || "")
    .replaceAll("{{telefone}}", contactNumber)
    .replaceAll("{telefone}", contactNumber);
}

async function pauseAi(run: Run) {
  const takeoverUntil = new Date(Date.now() + 99 * 365 * 24 * 60 * 60 * 1000).toISOString();
  await Promise.all([
    admin.from("live_chat_sessions").update({
      status: "human_takeover",
      human_takeover_until: takeoverUntil,
    }).eq("id", run.session_id),
    admin.from("n8n_fluxogpt").update({
      human_takeover_until: takeoverUntil,
      last_sender: "human",
    }).eq("nomeinstancia", run.instance_name).eq("whatsappuser", run.contact_number),
  ]);
}

async function settleAi(run: Run, resumeImmediately = false) {
  let takeoverUntil: string | null = null;
  let sessionStatus = "ai_active";

  if (!resumeImmediately) {
    const { data: setting } = await admin.from("whatsapp_takeover_settings")
      .select("auto_takeover_hours")
      .eq("user_id", run.started_by)
      .eq("instance_name", run.instance_name)
      .maybeSingle();
    const hours = Number(setting?.auto_takeover_hours ?? 2);
    takeoverUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    sessionStatus = "human_takeover";
  }

  await Promise.all([
    admin.from("live_chat_sessions").update({
      status: sessionStatus,
      human_takeover_until: takeoverUntil,
    }).eq("id", run.session_id),
    admin.from("n8n_fluxogpt").update({
      human_takeover_until: takeoverUntil,
      last_sender: "human",
    }).eq("nomeinstancia", run.instance_name).eq("whatsappuser", run.contact_number),
  ]);
}

async function sendStep(run: Run, step: Step) {
  if (!evolutionKey) throw new Error("EVOLUTION_API_KEY não configurada");

  const { data: session } = await admin.from("live_chat_sessions")
    .select("contact_name, source, assistant_id, assistant_name")
    .eq("id", run.session_id).single();

  if (!session || session.source !== "whatsapp") {
    throw new Error("O funil só pode ser enviado em uma conversa do WhatsApp");
  }

  let content = step.content ?? "";
  let mediaType = step.step_type;
  let mediaUrl: string | null = null;
  let assetName = "";

  if (step.asset_id) {
    const { data: asset, error } = await admin.from("sales_media_assets")
      .select("name, media_type, content, storage_path, caption, file_name")
      .eq("id", step.asset_id).eq("is_active", true).single();
    if (error || !asset) throw new Error("Material da etapa não foi encontrado");

    assetName = asset.name;
    mediaType = asset.media_type;
    content = asset.content || asset.caption || content;

    if (asset.storage_path) {
      const { data: signed, error: signedError } = await admin.storage
        .from("sales-assets").createSignedUrl(asset.storage_path, 3600);
      if (signedError || !signed?.signedUrl) throw new Error("Não foi possível liberar o arquivo para envio");
      mediaUrl = signed.signedUrl;
    }
  }

  content = renderVariables(content, session.contact_name, run.contact_number);
  const headers = { "Content-Type": "application/json", apikey: evolutionKey };
  let response: Response;

  if (mediaType === "text") {
    response = await fetch(`${evolutionUrl}/message/sendText/${run.instance_name}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ number: run.contact_number, text: content }),
    });
  } else if (mediaType === "audio") {
    response = await fetch(`${evolutionUrl}/message/sendWhatsAppAudio/${run.instance_name}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ number: run.contact_number, audio: mediaUrl }),
    });
  } else {
    response = await fetch(`${evolutionUrl}/message/sendMedia/${run.instance_name}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        number: run.contact_number,
        mediatype: mediaType,
        media: mediaUrl,
        caption: content,
        fileName: assetName || undefined,
      }),
    });
  }

  if (!response.ok) throw new Error(`Falha no WhatsApp: ${await response.text()}`);

  const displayContent = mediaType === "text" ? content : content || `[${mediaType}] ${assetName}`;
  await Promise.all([
    admin.from("live_chat_messages").insert({
      user_id: run.started_by,
      session_id: run.session_id,
      instance_name: run.instance_name,
      contact_number: run.contact_number,
      contact_name: session.contact_name,
      sender_type: "human",
      content: displayContent,
      message_type: mediaType,
      media_url: mediaUrl,
      source: "whatsapp",
      assistant_id: session.assistant_id,
      assistant_name: session.assistant_name,
      is_read: true,
    }),
    admin.from("live_chat_sessions").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: displayContent.slice(0, 100),
      last_sender_type: "human",
    }).eq("id", run.session_id),
    admin.from("sales_funnel_events").insert({
      run_id: run.id,
      step_id: step.id,
      event_type: "message_sent",
      details: { media_type: mediaType, asset_name: assetName },
    }),
  ]);
}

async function advanceRun(run: Run) {
  for (let guard = 0; guard < 30; guard += 1) {
    const { data: step, error } = await admin.from("sales_funnel_steps")
      .select("id, position, step_type, asset_id, content, delay_seconds")
      .eq("funnel_id", run.funnel_id)
      .eq("position", run.current_step_position)
      .maybeSingle();

    if (error) throw error;
    if (!step) {
      const { data: funnel } = await admin.from("sales_funnels")
        .select("flow_kind").eq("id", run.funnel_id).single();
      await admin.from("sales_funnel_runs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        next_run_at: null,
      }).eq("id", run.id);
      await admin.from("sales_funnel_events").insert({ run_id: run.id, event_type: "completed" });
      await settleAi(run, funnel?.flow_kind === "automation");
      return "completed";
    }

    const typedStep = step as Step;
    if (typedStep.step_type === "wait_for_reply") {
      await admin.from("sales_funnel_runs").update({
        status: "waiting_reply",
        next_run_at: null,
      }).eq("id", run.id);
      await admin.from("sales_funnel_events").insert({
        run_id: run.id,
        step_id: typedStep.id,
        event_type: "waiting_reply",
        details: { delay_after_reply_seconds: typedStep.delay_seconds },
      });
      return "waiting_reply";
    }

    if (typedStep.step_type === "wait") {
      const nextRunAt = new Date(Date.now() + typedStep.delay_seconds * 1000).toISOString();
      run.current_step_position += 1;
      await admin.from("sales_funnel_runs").update({
        current_step_position: run.current_step_position,
        status: "waiting_time",
        next_run_at: nextRunAt,
      }).eq("id", run.id);
      return "waiting_time";
    }

    await sendStep(run, typedStep);
    run.current_step_position += 1;

    if (typedStep.delay_seconds > 0) {
      const nextRunAt = new Date(Date.now() + typedStep.delay_seconds * 1000).toISOString();
      await admin.from("sales_funnel_runs").update({
        current_step_position: run.current_step_position,
        status: "waiting_time",
        next_run_at: nextRunAt,
      }).eq("id", run.id);
      return "waiting_time";
    }

    await admin.from("sales_funnel_runs").update({
      current_step_position: run.current_step_position,
      status: "processing",
      next_run_at: null,
    }).eq("id", run.id);
  }

  throw new Error("O funil excedeu 30 etapas consecutivas sem espera");
}

async function processDueRuns() {
  const now = new Date().toISOString();
  const { data: runs, error } = await admin.from("sales_funnel_runs")
    .select("*")
    .in("status", ["running", "waiting_time"])
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .order("next_run_at", { ascending: true, nullsFirst: true })
    .limit(20);
  if (error) throw error;

  const results = [];
  for (const candidate of runs || []) {
    const { data: claimed } = await admin.from("sales_funnel_runs")
      .update({ status: "processing", updated_at: now })
      .eq("id", candidate.id)
      .eq("status", candidate.status)
      .select("*")
      .maybeSingle();
    if (!claimed) continue;

    try {
      results.push({ id: claimed.id, status: await advanceRun(claimed as Run) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida";
      await admin.from("sales_funnel_runs").update({ status: "failed", last_error: message }).eq("id", claimed.id);
      await settleAi(claimed as Run, true);
      results.push({ id: claimed.id, status: "failed", error: message });
    }
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    if (body.action === "tick") return json({ success: true, results: await processDueRuns() });

    const user = await authenticatedUser(req);
    if (!user) return json({ error: "Não autorizado" }, 401);

    if (body.action === "start") {
      const { data: session } = await admin.from("live_chat_sessions")
        .select("*").eq("id", body.session_id).eq("user_id", user.id).single();
      if (!session || session.source !== "whatsapp") return json({ error: "Conversa do WhatsApp não encontrada" }, 404);

      const { data: funnel } = await admin.from("sales_funnels")
        .select("id, library_id, is_active").eq("id", body.funnel_id).eq("is_active", true).single();
      if (!funnel) return json({ error: "Funil não encontrado ou inativo" }, 404);

      const { data: membership } = await admin.from("sales_library_members")
        .select("role").eq("library_id", funnel.library_id).eq("user_id", user.id).maybeSingle();
      if (!membership) return json({ error: "Você não tem acesso a este funil" }, 403);

      const { data: run, error } = await admin.from("sales_funnel_runs").insert({
        funnel_id: funnel.id,
        started_by: user.id,
        session_id: session.id,
        instance_name: session.instance_name,
        contact_number: session.contact_number,
        status: "processing",
      }).select("*").single();
      if (error) return json({ error: error.code === "23505" ? "Já existe um funil ativo nesta conversa" : error.message }, 409);

      await pauseAi(run as Run);
      try {
        const status = await advanceRun(run as Run);
        return json({ success: true, run_id: run.id, status });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha desconhecida";
        await admin.from("sales_funnel_runs").update({ status: "failed", last_error: message }).eq("id", run.id);
        await settleAi(run as Run, true);
        throw error;
      }
    }

    if (body.action === "cancel") {
      const { data: run } = await admin.from("sales_funnel_runs")
        .select("*").eq("id", body.run_id).eq("started_by", user.id).maybeSingle();
      if (!run) return json({ error: "Execução não encontrada" }, 404);
      await admin.from("sales_funnel_runs").update({ status: "cancelled", next_run_at: null }).eq("id", run.id);
      await settleAi(run as Run, true);
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("sales-funnel-engine", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
