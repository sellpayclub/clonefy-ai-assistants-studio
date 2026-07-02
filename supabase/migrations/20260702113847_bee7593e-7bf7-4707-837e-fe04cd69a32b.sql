
-- Apagar leads do CRM em lote (por ids), apenas do usuário logado
CREATE OR REPLACE FUNCTION public.delete_crm_leads_bulk(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  WITH deleted AS (
    DELETE FROM public.crm_leads
    WHERE user_id = auth.uid()
      AND id = ANY(p_ids)
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$function$;

-- Limpar leads antigos do CRM (mais antigos que X dias), apenas do usuário logado
CREATE OR REPLACE FUNCTION public.cleanup_crm_leads_old(p_days integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
  cutoff timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'Número de dias inválido';
  END IF;

  cutoff := now() - (p_days || ' days')::interval;

  WITH deleted AS (
    DELETE FROM public.crm_leads
    WHERE user_id = auth.uid()
      AND created_at < cutoff
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$function$;

-- Limpar sessões do Chat ao vivo (e mensagens vinculadas), apenas do usuário logado
CREATE OR REPLACE FUNCTION public.cleanup_live_chat_sessions(p_days integer, p_only_closed boolean DEFAULT true)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
  cutoff timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'Número de dias inválido';
  END IF;

  cutoff := now() - (p_days || ' days')::interval;

  -- Apagar mensagens das sessões que serão removidas
  DELETE FROM public.live_chat_messages m
  WHERE m.user_id = auth.uid()
    AND m.session_id IN (
      SELECT s.id FROM public.live_chat_sessions s
      WHERE s.user_id = auth.uid()
        AND COALESCE(s.last_message_at, s.created_at) < cutoff
        AND (p_only_closed = false OR s.status = 'closed')
    );

  WITH deleted AS (
    DELETE FROM public.live_chat_sessions s
    WHERE s.user_id = auth.uid()
      AND COALESCE(s.last_message_at, s.created_at) < cutoff
      AND (p_only_closed = false OR s.status = 'closed')
    RETURNING s.id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_crm_leads_bulk(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_crm_leads_old(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_live_chat_sessions(integer, boolean) FROM anon;

GRANT EXECUTE ON FUNCTION public.delete_crm_leads_bulk(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_crm_leads_old(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_live_chat_sessions(integer, boolean) TO authenticated;
