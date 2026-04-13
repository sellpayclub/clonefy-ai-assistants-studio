CREATE OR REPLACE FUNCTION public.admin_get_global_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  caller_email text;
BEGIN
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS DISTINCT FROM 'personaldann@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM auth.users),
    'total_leads', (SELECT count(*) FROM crm_leads),
    'active_sessions', (
      SELECT count(*) FROM live_chat_sessions
      WHERE status IN ('ai_active', 'human_takeover')
        AND last_message_at > now() - interval '24 hours'
    ),
    'total_connections', (SELECT count(*) FROM n8n_fluxogpt),
    'total_assistants', (SELECT count(*) FROM assistants)
  ) INTO result;

  RETURN result;
END;
$$;