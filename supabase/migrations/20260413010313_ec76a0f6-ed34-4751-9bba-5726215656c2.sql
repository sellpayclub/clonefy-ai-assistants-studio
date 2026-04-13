
-- Admin function: get global stats
CREATE OR REPLACE FUNCTION public.admin_get_global_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  admin_email TEXT;
BEGIN
  -- Verify caller is admin
  SELECT email INTO admin_email FROM auth.users WHERE id = auth.uid();
  IF admin_email IS DISTINCT FROM 'personaldann@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_leads', (SELECT COUNT(*) FROM public.crm_leads),
    'active_sessions', (SELECT COUNT(*) FROM public.live_chat_sessions WHERE status IN ('ai_active', 'human_takeover')),
    'total_connections', (
      (SELECT COUNT(*) FROM public.whatsapp_connections) +
      (SELECT COUNT(DISTINCT nomeinstancia) FROM public.n8n_fluxogpt WHERE emailuser IS NOT NULL)
    ),
    'total_assistants', (SELECT COUNT(*) FROM public.assistants WHERE is_active = true)
  ) INTO result;

  RETURN result;
END;
$$;

-- Admin function: get all leads (optionally filtered by user)
CREATE OR REPLACE FUNCTION public.admin_get_all_leads(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  name TEXT,
  whatsapp_number TEXT,
  email TEXT,
  company TEXT,
  status TEXT,
  source TEXT,
  pipeline_stage TEXT,
  lead_score INT,
  sentiment TEXT,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  tags TEXT[],
  intent_summary TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT;
BEGIN
  SELECT auth.users.email INTO admin_email FROM auth.users WHERE auth.users.id = auth.uid();
  IF admin_email IS DISTINCT FROM 'personaldann@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    public.get_user_email(l.user_id) AS user_email,
    l.name,
    l.whatsapp_number,
    l.email,
    l.company,
    l.status,
    l.source,
    l.pipeline_stage,
    l.lead_score,
    l.sentiment,
    l.last_interaction,
    l.created_at,
    l.tags,
    l.intent_summary
  FROM public.crm_leads l
  WHERE (target_user_id IS NULL OR l.user_id = target_user_id)
  ORDER BY l.created_at DESC
  LIMIT 500;
END;
$$;

-- Admin function: get all live chat sessions (optionally filtered by user)
CREATE OR REPLACE FUNCTION public.admin_get_all_sessions(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email TEXT,
  contact_number TEXT,
  contact_name TEXT,
  instance_name TEXT,
  status TEXT,
  source TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INT,
  assistant_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT;
BEGIN
  SELECT auth.users.email INTO admin_email FROM auth.users WHERE auth.users.id = auth.uid();
  IF admin_email IS DISTINCT FROM 'personaldann@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    public.get_user_email(s.user_id) AS user_email,
    s.contact_number,
    s.contact_name,
    s.instance_name,
    s.status,
    s.source,
    s.last_message_at,
    s.last_message_preview,
    s.unread_count,
    s.assistant_name,
    s.created_at
  FROM public.live_chat_sessions s
  WHERE (target_user_id IS NULL OR s.user_id = target_user_id)
  ORDER BY s.last_message_at DESC NULLS LAST
  LIMIT 500;
END;
$$;
