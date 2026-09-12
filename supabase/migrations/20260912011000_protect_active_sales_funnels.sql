-- Prevent active executions from losing their steps or being deleted mid-run.
CREATE OR REPLACE FUNCTION public.protect_active_sales_funnel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_funnel_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'sales_funnels' OR TG_OP = 'DELETE' THEN
    target_funnel_id := OLD.id;
    IF TG_TABLE_NAME = 'sales_funnel_steps' THEN
      target_funnel_id := OLD.funnel_id;
    END IF;
  ELSE
    target_funnel_id := NEW.funnel_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.sales_funnel_runs
    WHERE funnel_id = target_funnel_id
      AND status IN ('running', 'processing', 'waiting_time', 'waiting_reply', 'paused')
  ) THEN
    RAISE EXCEPTION 'Pare as execuções ativas antes de alterar ou excluir este funil';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_active_sales_funnel() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_active_sales_funnel_delete ON public.sales_funnels;
CREATE TRIGGER protect_active_sales_funnel_delete
BEFORE DELETE ON public.sales_funnels
FOR EACH ROW EXECUTE FUNCTION public.protect_active_sales_funnel();

DROP TRIGGER IF EXISTS protect_active_sales_funnel_steps ON public.sales_funnel_steps;
CREATE TRIGGER protect_active_sales_funnel_steps
BEFORE INSERT OR UPDATE OR DELETE ON public.sales_funnel_steps
FOR EACH ROW EXECUTE FUNCTION public.protect_active_sales_funnel();
