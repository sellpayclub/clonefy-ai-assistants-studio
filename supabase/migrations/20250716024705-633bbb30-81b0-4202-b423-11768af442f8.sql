-- Create user quotas table for managing user limits
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  max_assistants INTEGER NOT NULL DEFAULT 1,
  max_whatsapp_connections INTEGER NOT NULL DEFAULT 1,
  plan_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- Create policies for users to view their own quotas
CREATE POLICY "Users can view their own quotas" 
ON public.user_quotas 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for admin to manage all quotas
CREATE POLICY "Admin can manage all quotas" 
ON public.user_quotas 
FOR ALL 
USING (auth.uid()::text = '139b35c6-af34-4b26-8c58-6020d520c266');

-- Create function to automatically create quotas for new users
CREATE OR REPLACE FUNCTION public.create_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, max_assistants, max_whatsapp_connections, plan_type)
  VALUES (NEW.id, 1, 1, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create quotas when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_quota ON auth.users;
CREATE TRIGGER on_auth_user_created_quota
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_quota();

-- Create function to get user usage stats
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  max_assistants INTEGER,
  max_whatsapp_connections INTEGER,
  current_assistants BIGINT,
  current_whatsapp_connections BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uq.user_id,
    uq.max_assistants,
    uq.max_whatsapp_connections,
    COALESCE(a.assistant_count, 0) as current_assistants,
    COALESCE(w.connection_count, 0) as current_whatsapp_connections
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
  WHERE (target_user_id IS NULL OR uq.user_id = target_user_id)
    AND (target_user_id IS NULL OR uq.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updating timestamps
CREATE TRIGGER update_user_quotas_updated_at
BEFORE UPDATE ON public.user_quotas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();