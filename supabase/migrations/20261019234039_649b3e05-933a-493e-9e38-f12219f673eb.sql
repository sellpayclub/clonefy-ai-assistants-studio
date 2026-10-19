DROP FUNCTION IF EXISTS public.cleanup_live_chat_sessions(integer, boolean);

CREATE OR REPLACE FUNCTION public.cleanup_live_chat_sessions(p_days integer, p_only_closed boolean DEFAULT true, p_batch integer DEFAULT 200)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
  cutoff timestamptz;
  ids uuid[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  IF p_days IS NULL OR p_days < 0 THEN
    RAISE EXCEPTION 'Número de dias inválido';
  END IF;

  cutoff := now() - (p_days || ' days')::interval;

  SELECT array_agg(id) INTO ids FROM (
    SELECT s.id FROM public.live_chat_sessions s
    WHERE s.user_id = auth.uid()
      AND COALESCE(s.last_message_at, s.created_at) < cutoff
      AND (p_only_closed = false OR s.status = 'closed')
    LIMIT LEAST(GREATEST(COALESCE(p_batch, 200), 1), 500)
  ) t;

  IF ids IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM public.sales_funnel_runs WHERE session_id = ANY(ids);
  DELETE FROM public.live_chat_messages WHERE session_id = ANY(ids);
  DELETE FROM public.live_chat_sessions WHERE id = ANY(ids) AND user_id = auth.uid();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.cleanup_live_chat_sessions(integer, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_live_chat_sessions(integer, boolean, integer) TO authenticated;