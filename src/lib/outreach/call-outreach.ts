import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase-config';

function parseErrorPayload(payload: Record<string, unknown>, status: number): string {
  if (typeof payload.msg === 'string') return payload.msg;
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.message === 'string') return payload.message;
  return `Erro ${status} no disparo WhatsApp`;
}

/** Chama prospect-outreach com apikey garantido (fix invalid credentials em produção). */
export async function callOutreachFunction<T>(
  body: Record<string, unknown>,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/prospect-outreach`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let payload: Record<string, unknown> = {};
  const rawText = await response.text();
  try {
    payload = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    if (!response.ok) {
      throw new Error(rawText.slice(0, 200) || `Erro ${response.status} no disparo WhatsApp`);
    }
  }

  if (!response.ok) {
    throw new Error(parseErrorPayload(payload, response.status));
  }

  if (typeof payload.error === 'string') {
    throw new Error(payload.error);
  }

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
