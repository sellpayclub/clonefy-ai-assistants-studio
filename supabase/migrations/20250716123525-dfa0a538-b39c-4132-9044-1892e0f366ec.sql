-- Criar tabela para emails autorizados
CREATE TABLE authorized_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP DEFAULT now(),
  notes TEXT
);

-- Habilitar RLS
ALTER TABLE authorized_emails ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar emails (assumindo que o admin tem ID específico)
CREATE POLICY "Admin can manage authorized emails" 
ON authorized_emails 
FOR ALL 
USING ((auth.uid())::text = '139b35c6-af34-4b26-8c58-6020d520c266'::text);

-- Política para todos poderem ler (necessário para validação no registro)
CREATE POLICY "Everyone can read authorized emails" 
ON authorized_emails 
FOR SELECT 
USING (true);