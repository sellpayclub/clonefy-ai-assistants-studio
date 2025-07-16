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