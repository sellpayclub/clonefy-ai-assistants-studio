-- Atualizar função get_user_usage_stats para contar corretamente as conexões WhatsApp incluindo n8n_fluxogpt
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(target_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  user_id uuid, 
  user_email text, 
  max_assistants integer, 
  max_whatsapp_connections integer, 
  current_assistants bigint, 
  current_whatsapp_connections bigint, 
  plan_type text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uq.user_id,
    public.get_user_email(uq.user_id) as user_email,
    uq.max_assistants,
    uq.max_whatsapp_connections,
    COALESCE(a.assistant_count, 0) as current_assistants,
    COALESCE(wc.whatsapp_count, 0) + COALESCE(n8n.n8n_count, 0) as current_whatsapp_connections,
    uq.plan_type,
    uq.created_at
  FROM public.user_quotas uq
  LEFT JOIN (
    SELECT assistants.user_id, COUNT(*) as assistant_count 
    FROM public.assistants 
    WHERE assistants.is_active = true
    GROUP BY assistants.user_id
  ) a ON uq.user_id = a.user_id
  LEFT JOIN (
    SELECT whatsapp_connections.user_id, COUNT(*) as whatsapp_count 
    FROM public.whatsapp_connections 
    GROUP BY whatsapp_connections.user_id
  ) wc ON uq.user_id = wc.user_id
  LEFT JOIN (
    SELECT 
      auth.users.id as user_id,
      COUNT(*) as n8n_count 
    FROM public.n8n_fluxogpt 
    JOIN auth.users ON auth.users.email = n8n_fluxogpt.emailuser 
      OR auth.users.raw_user_meta_data->>'email' = n8n_fluxogpt.emailuser
    GROUP BY auth.users.id
  ) n8n ON uq.user_id = n8n.user_id
  WHERE (target_user_id IS NULL OR uq.user_id = target_user_id);
END;
$$;