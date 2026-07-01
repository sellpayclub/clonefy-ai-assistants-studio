import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ekfkrwueqwpqakpsrsjt.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

/** Chama prospect-outreach e expõe a mensagem real do body (não só "non-2xx"). */
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
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    /* resposta não-JSON */
  }

  if (!response.ok) {
    const detail =
      (typeof payload.error === 'string' && payload.error) ||
      (typeof payload.message === 'string' && payload.message) ||
      `Erro ${response.status} no disparo WhatsApp`;
    throw new Error(detail);
  }

  if (typeof payload.error === 'string') {
    throw new Error(payload.error);
  }

  return payload as T;
}
