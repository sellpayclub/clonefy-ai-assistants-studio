import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config';

async function extractInvokeError(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === 'object' && data !== null && 'error' in data) {
    const msg = (data as { error?: string }).error;
    if (msg) return msg;
  }

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
      if (body?.msg) return String(body.msg);
    } catch {
      try {
        const text = await error.context.text();
        if (text) return text.slice(0, 300);
      } catch {
        /* ignore */
      }
    }
  }

  if (error instanceof Error) return error.message;
  return 'Erro no disparo WhatsApp';
}

/** Chama prospect-outreach via SDK (apikey automático) com fallback fetch. */
export async function callOutreachFunction<T>(
  body: Record<string, unknown>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const { data, error } = await supabase.functions.invoke('prospect-outreach', {
    body,
  });

  if (error) {
    throw new Error(await extractInvokeError(error, data));
  }

  if (data && typeof data === 'object' && data !== null && 'error' in data) {
    const msg = (data as { error?: string }).error;
    if (msg) throw new Error(msg);
  }

  if (data != null) {
    return data as T;
  }

  // Fallback fetch direto
  const response = await fetch(`${SUPABASE_URL}/functions/v1/prospect-outreach`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    if (!response.ok) {
      throw new Error(rawText.slice(0, 300) || `Erro ${response.status}`);
    }
  }

  if (!response.ok) {
    const detail =
      (typeof payload.error === 'string' && payload.error) ||
      (typeof payload.message === 'string' && payload.message) ||
      rawText.slice(0, 300) ||
      `Erro ${response.status}`;
    throw new Error(detail);
  }

  if (typeof payload.error === 'string') throw new Error(payload.error);
  return payload as T;
}

export async function getOutreachCampaignStatus(campaignId: string) {
  return callOutreachFunction<{
    id: string;
    status: string;
    total_leads: number;
    sent_count: number;
    failed_count: number;
    pending_count: number;
  }>({
    action: 'get_campaign_status',
    campaign_id: campaignId,
  });
}

export async function startOutreachCampaign(params: {
  companies: unknown[];
  messageTemplate: string;
  whatsappInstance: string;
  delaySeconds: number;
  importToCrm: boolean;
  campaignName?: string;
  searchContext?: Record<string, unknown>;
}) {
  return callOutreachFunction<{
    campaignId: string;
    queued: number;
    skipped: number;
    estimatedMinutes: number;
  }>({
    action: 'start_campaign',
    companies: params.companies,
    message_template: params.messageTemplate,
    whatsapp_instance: params.whatsappInstance,
    delay_seconds: params.delaySeconds,
    import_to_crm: params.importToCrm,
    campaign_name: params.campaignName,
    search_context: params.searchContext,
  });
}
