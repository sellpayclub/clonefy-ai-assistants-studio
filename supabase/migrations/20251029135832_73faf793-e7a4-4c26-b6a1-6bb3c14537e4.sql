-- Adicionar política RLS para permitir leitura pública das customizações do widget
-- Isso é necessário para o chat embed funcionar sem autenticação

CREATE POLICY "Public can view active widget customizations"
ON public.widget_customizations
FOR SELECT
USING (is_active = true);