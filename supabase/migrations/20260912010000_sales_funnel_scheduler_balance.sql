-- Balance timing precision with the Edge Function quota on smaller projects.
DO $$
DECLARE
  existing_job RECORD;
BEGIN
  FOR existing_job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'sales-funnel-engine-every-30-seconds',
      'sales-funnel-engine-every-5-seconds',
      'sales-funnel-engine-every-10-seconds'
    )
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'sales-funnel-engine-every-10-seconds',
  '10 seconds',
  $$SELECT net.http_post(
    url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/sales-funnel-engine',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"action":"tick"}'::jsonb
  )$$
);
