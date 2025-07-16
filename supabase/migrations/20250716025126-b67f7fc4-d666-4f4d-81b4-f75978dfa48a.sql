-- Create quotas for existing users who don't have them yet
INSERT INTO public.user_quotas (user_id, max_assistants, max_whatsapp_connections, plan_type)
SELECT 
  au.id as user_id,
  1 as max_assistants,
  1 as max_whatsapp_connections,
  'free' as plan_type
FROM auth.users au
LEFT JOIN public.user_quotas uq ON au.id = uq.user_id
WHERE uq.user_id IS NULL;

-- Create your admin quota if it doesn't exist
INSERT INTO public.user_quotas (user_id, max_assistants, max_whatsapp_connections, plan_type)
VALUES ('139b35c6-af34-4b26-8c58-6020d520c266', 10, 10, 'admin')
ON CONFLICT (user_id) DO UPDATE SET
  max_assistants = 10,
  max_whatsapp_connections = 10,
  plan_type = 'admin';