-- Migration: Add follow-up columns to n8n_fluxogpt
-- This adds columns needed for the automatic follow-up system

-- Add columns for tracking last message and follow-up count
ALTER TABLE public.n8n_fluxogpt 
ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_sender text DEFAULT 'bot',
ADD COLUMN IF NOT EXISTS followup_count integer DEFAULT 0;

-- Create index for faster cron queries
CREATE INDEX IF NOT EXISTS idx_n8n_fluxogpt_followup 
ON public.n8n_fluxogpt (last_sender, last_message_at, followup_count)
WHERE whatsappuser IS NOT NULL AND threadid IS NOT NULL;

-- Function to trigger follow-up
CREATE OR REPLACE FUNCTION disparar_followup_clonefy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r record;
  agora timestamptz := now();
  service_role_key text;
BEGIN
  -- Get service role key from vault or settings
  service_role_key := current_setting('app.supabase_service_role_key', true);
  
  FOR r IN
    SELECT 
      id, 
      nomeinstancia, 
      whatsappuser, 
      threadid, 
      idassistentgpt,
      followup_count,
      "ApiELEVEN",
      "IDvoz"
    FROM n8n_fluxogpt
    WHERE 
      last_sender = 'bot'
      AND whatsappuser IS NOT NULL
      AND whatsappuser != ''
      AND threadid IS NOT NULL
      AND threadid != ''
      AND idassistentgpt IS NOT NULL
      AND idassistentgpt != ''
      AND (
        -- 1st follow-up: 5 minutes, count = 0
        (followup_count = 0 AND last_message_at < agora - interval '5 minutes')
        OR
        -- 2nd follow-up: 10 minutes after 1st (15 min total), count = 1
        (followup_count = 1 AND last_message_at < agora - interval '10 minutes')
        OR
        -- 3rd follow-up: 24 hours after 2nd (ÚLTIMO - depois para), count = 2
        (followup_count = 2 AND last_message_at < agora - interval '24 hours')
      )
      -- Máximo 3 follow-ups - depois disso PARA
      AND followup_count < 3
  LOOP
    -- Call the follow-up Edge Function
    PERFORM net.http_post(
      url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/whatsapp-followup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'id', r.id,
        'instanceName', r.nomeinstancia,
        'contactNumber', r.whatsappuser,
        'threadId', r.threadid,
        'assistantId', r.idassistentgpt,
        'followupNumber', r.followup_count + 1,
        'elevenLabsApiKey', r."ApiELEVEN",
        'voiceId', r."IDvoz"
      )
    );
    
    -- Mark as follow-up sent to avoid duplicate calls
    UPDATE n8n_fluxogpt 
    SET followup_count = followup_count + 1
    WHERE id = r.id;
    
  END LOOP;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION disparar_followup_clonefy() IS 'Triggers automatic follow-up messages for leads who have not responded';
