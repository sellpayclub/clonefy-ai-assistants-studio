
CREATE OR REPLACE FUNCTION public.disparar_followup_clonefy()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r record;
  agora timestamptz := now();
BEGIN
  FOR r IN
    SELECT id, nomeinstancia, whatsappuser, threadid, idassistentgpt, followup_count, "ApiELEVEN", "IDvoz", followup_delay_minutes
    FROM n8n_fluxogpt
    WHERE 
      followup_enabled = true
      AND last_sender = 'bot'
      AND followup_count = 0
      AND whatsappuser IS NOT NULL AND whatsappuser != ''
      AND threadid IS NOT NULL AND threadid != ''
      AND idassistentgpt IS NOT NULL AND idassistentgpt != ''
      AND last_message_at < agora - (followup_delay_minutes || ' minutes')::interval
  LOOP
    PERFORM net.http_post(
      url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/whatsapp-followup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZmtyd3VlcXdwcWFrcHNyc2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ0NDYsImV4cCI6MjA2ODE2MDQ0Nn0.MvmEk3Kdg419WFIp2ZwAuMXDyU6ZqIkntdseniluhOk'
      ),
      body := jsonb_build_object(
        'id', r.id,
        'instanceName', r.nomeinstancia,
        'contactNumber', r.whatsappuser,
        'threadId', r.threadid,
        'assistantId', r.idassistentgpt,
        'followupNumber', 1,
        'elevenLabsApiKey', r."ApiELEVEN",
        'voiceId', r."IDvoz",
        'delayMinutes', r.followup_delay_minutes
      )
    );
    
    UPDATE n8n_fluxogpt SET followup_count = followup_count + 1 WHERE id = r.id;
  END LOOP;
END;
$function$;
