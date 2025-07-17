-- Atualizar a função para contar apenas assistentes ativos
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_id uuid, user_email text, max_assistants integer, max_whatsapp_connections integer, current_assistants bigint, current_whatsapp_connections bigint, plan_type text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    uq.user_id,
    public.get_user_email(uq.user_id) as user_email,
    uq.max_assistants,
    uq.max_whatsapp_connections,
    COALESCE(a.assistant_count, 0) as current_assistants,
    COALESCE(w.connection_count, 0) as current_whatsapp_connections,
    uq.plan_type,
    uq.created_at
  FROM public.user_quotas uq
  LEFT JOIN (
    SELECT assistants.user_id, COUNT(*) as assistant_count 
    FROM public.assistants 
    WHERE assistants.is_active = true  -- APENAS assistentes ativos
    GROUP BY assistants.user_id
  ) a ON uq.user_id = a.user_id
  LEFT JOIN (
    SELECT whatsapp_connections.user_id, COUNT(*) as connection_count 
    FROM public.whatsapp_connections 
    GROUP BY whatsapp_connections.user_id
  ) w ON uq.user_id = w.user_id
  WHERE (target_user_id IS NULL OR uq.user_id = target_user_id);
END;
$function$