
-- Add followup configuration columns to n8n_fluxogpt
ALTER TABLE n8n_fluxogpt ADD COLUMN IF NOT EXISTS followup_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE n8n_fluxogpt ADD COLUMN IF NOT EXISTS followup_delay_minutes integer NOT NULL DEFAULT 5;

-- Replace the disparar_followup_clonefy function with new logic
CREATE OR REPLACE FUNCTION disparar_followup_clonefy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      url := 'https://webhook.dcsaudeautomacao.com/webhook/follow-up',
      headers := jsonb_build_object('Content-Type', 'application/json'),
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
$$;
