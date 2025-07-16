-- Criar função para obter email do usuário por user_id
CREATE OR REPLACE FUNCTION public.get_user_email(target_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(
      raw_user_meta_data->>'email',
      email
    ) as user_email
  FROM auth.users 
  WHERE id = target_user_id
  LIMIT 1;
$$;

-- Atualizar função para incluir email nas estatísticas de uso
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
    COALESCE(w.connection_count, 0) as current_whatsapp_connections,
    uq.plan_type,
    uq.created_at
  FROM public.user_quotas uq
  LEFT JOIN (
    SELECT user_id, COUNT(*) as assistant_count 
    FROM public.assistants 
    GROUP BY user_id
  ) a ON uq.user_id = a.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as connection_count 
    FROM public.whatsapp_connections 
    GROUP BY user_id
  ) w ON uq.user_id = w.user_id
  WHERE (target_user_id IS NULL OR uq.user_id = target_user_id);
END;
$$;