-- Prospecção: campanhas de disparo WhatsApp com fila escalonada

CREATE TABLE IF NOT EXISTS public.prospect_outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Prospecção WhatsApp',
  message_template TEXT NOT NULL,
  whatsapp_instance TEXT NOT NULL,
  assistant_id TEXT,
  delay_seconds INTEGER NOT NULL DEFAULT 45,
  import_to_crm BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'cancelled', 'failed')),
  total_leads INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  search_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prospect_outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.prospect_outreach_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  crm_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_outreach_campaigns_user
  ON public.prospect_outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_campaigns_status
  ON public.prospect_outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_queue_pending
  ON public.prospect_outreach_queue(scheduled_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_prospect_outreach_queue_campaign
  ON public.prospect_outreach_queue(campaign_id);

ALTER TABLE public.prospect_outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_outreach_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach campaigns"
  ON public.prospect_outreach_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own outreach campaigns"
  ON public.prospect_outreach_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach campaigns"
  ON public.prospect_outreach_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own outreach queue"
  ON public.prospect_outreach_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach queue"
  ON public.prospect_outreach_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach queue"
  ON public.prospect_outreach_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.process_prospect_outreach_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  r record;
  agora timestamptz := now();
BEGIN
  FOR r IN
    SELECT
      q.id AS queue_id,
      q.campaign_id,
      q.user_id,
      q.whatsapp_number,
      q.message_body,
      q.lead_name,
      q.cnpj,
      c.whatsapp_instance,
      c.assistant_id
    FROM public.prospect_outreach_queue q
    JOIN public.prospect_outreach_campaigns c ON c.id = q.campaign_id
    WHERE q.status = 'pending'
      AND q.scheduled_at <= agora
      AND c.status = 'running'
    ORDER BY q.scheduled_at
    LIMIT 5
  LOOP
    UPDATE public.prospect_outreach_queue
    SET status = 'processing', attempts = attempts + 1
    WHERE id = r.queue_id;

    PERFORM net.http_post(
      url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/prospect-outreach',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmtyd3VlcXdwcWFrcHNyc2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ0NDYsImV4cCI6MjA2ODE2MDQ0Nn0.MvmEk3Kdg419WFIp2ZwAuMXDyU6ZqIkntdseniluhOk'
      ),
      body := jsonb_build_object(
        'action', 'dispatch_one',
        'queue_id', r.queue_id
      )
    );
  END LOOP;
END;
$function$;

COMMENT ON FUNCTION public.process_prospect_outreach_queue() IS
  'Processa fila de disparo WhatsApp da prospecção via cron';

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prospect-outreach-queue-job') THEN
    PERFORM cron.unschedule('prospect-outreach-queue-job');
  END IF;
END;
$cron$;

SELECT cron.schedule(
  'prospect-outreach-queue-job',
  '* * * * *',
  $$SELECT public.process_prospect_outreach_queue();$$
);
