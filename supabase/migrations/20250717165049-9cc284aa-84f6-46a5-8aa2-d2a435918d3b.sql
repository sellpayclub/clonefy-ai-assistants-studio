-- Criar tabela para controlar assinantes pagos
CREATE TABLE public.paid_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  payment_processor TEXT DEFAULT 'sellpay',
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.paid_subscribers ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar tudo
CREATE POLICY "Admin can manage all paid subscribers" 
ON public.paid_subscribers 
FOR ALL 
USING (auth.uid()::text = '139b35c6-af34-4b26-8c58-6020d520c266');

-- Política para edge functions inserir/atualizar
CREATE POLICY "Edge functions can insert/update paid subscribers" 
ON public.paid_subscribers 
FOR ALL 
USING (true);

-- Função para atualizar user_quotas quando pagamento for aprovado
CREATE OR REPLACE FUNCTION public.upgrade_user_to_paid(target_email TEXT)
RETURNS VOID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Buscar user_id pelo email
    SELECT auth.users.id INTO target_user_id
    FROM auth.users 
    WHERE auth.users.email = target_email
    OR auth.users.raw_user_meta_data->>'email' = target_email
    LIMIT 1;
    
    -- Se encontrou o usuário, atualizar as quotas
    IF target_user_id IS NOT NULL THEN
        UPDATE public.user_quotas 
        SET 
            plan_type = 'premium',
            max_assistants = 10,
            max_whatsapp_connections = 10,
            updated_at = now()
        WHERE user_id = target_user_id;
        
        -- Se não existe quota para o usuário, criar
        INSERT INTO public.user_quotas (user_id, plan_type, max_assistants, max_whatsapp_connections)
        VALUES (target_user_id, 'premium', 10, 10)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Atualizar paid_subscribers com user_id
        UPDATE public.paid_subscribers 
        SET user_id = target_user_id 
        WHERE email = target_email AND user_id IS NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar timestamps
CREATE TRIGGER update_paid_subscribers_updated_at
BEFORE UPDATE ON public.paid_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();