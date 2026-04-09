
-- 1. Atualizar cron job followup-scheduler-job com anon key correta
SELECT cron.unschedule('followup-scheduler-job');

SELECT cron.schedule(
  'followup-scheduler-job',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/followup-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmtyd3VlcXdwcWFrcHNyc2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ0NDYsImV4cCI6MjA2ODE2MDQ0Nn0.MvmEk3Kdg419WFIp2ZwAuMXDyU6ZqIkntdseniluhOk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 2. Corrigir disparar_followups_automaticos() para incluir Authorization header
CREATE OR REPLACE FUNCTION public.disparar_followups_automaticos()
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
            s.id as schedule_id,
            s.lead_id,
            s.campaign_id,
            s.step_number,
            s.message_template,
            l.name as lead_name,
            l.whatsapp_number,
            l.openai_thread_id,
            l.human_takeover_until,
            c.whatsapp_instance,
            c.openai_assistant_id,
            c.min_interval_minutes,
            c.max_daily_messages,
            c.start_hour,
            c.end_hour,
            c.working_days,
            c.random_delay_seconds
        FROM public.followup_schedules s
        JOIN public.followup_leads l ON s.lead_id = l.id
        JOIN public.followup_campaigns c ON s.campaign_id = c.id
        WHERE 
            s.status = 'pending'
            AND s.scheduled_at <= agora
            AND c.status = 'active'
            AND l.status IN ('new', 'contacted', 'interested')
            AND (l.human_takeover_until IS NULL OR l.human_takeover_until < agora)
            AND EXTRACT(HOUR FROM agora) >= c.start_hour
            AND EXTRACT(HOUR FROM agora) < c.end_hour
            AND EXTRACT(DOW FROM agora)::int = ANY(c.working_days)
        ORDER BY s.scheduled_at
        LIMIT 10
    LOOP
        UPDATE public.followup_schedules 
        SET status = 'processing', attempts = attempts + 1
        WHERE id = r.schedule_id;
        
        PERFORM net.http_post(
            url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/followup-dispatcher',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmtyd3VlcXdwcWFrcHNyc2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ0NDYsImV4cCI6MjA2ODE2MDQ0Nn0.MvmEk3Kdg419WFIp2ZwAuMXDyU6ZqIkntdseniluhOk'
            ),
            body := jsonb_build_object(
                'schedule_id', r.schedule_id,
                'lead_id', r.lead_id,
                'campaign_id', r.campaign_id,
                'lead_name', r.lead_name,
                'whatsapp_number', r.whatsapp_number,
                'whatsapp_instance', r.whatsapp_instance,
                'assistant_id', r.openai_assistant_id,
                'thread_id', r.openai_thread_id,
                'step_number', r.step_number,
                'message_template', r.message_template
            )
        );
    END LOOP;
END;
$function$;
