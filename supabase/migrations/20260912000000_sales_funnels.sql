-- Shared sales media library and stateful WhatsApp funnels.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE public.sales_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Biblioteca comercial',
  share_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sales_library_members (
  library_id UUID NOT NULL REFERENCES public.sales_libraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('owner', 'editor', 'seller')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (library_id, user_id)
);

CREATE OR REPLACE FUNCTION public.is_sales_library_member(_library_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sales_library_members
    WHERE library_id = _library_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_sales_library(_library_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sales_library_members
    WHERE library_id = _library_id AND user_id = _user_id AND role IN ('owner', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.add_sales_library_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.sales_library_members (library_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_sales_library_owner_after_insert
AFTER INSERT ON public.sales_libraries
FOR EACH ROW EXECUTE FUNCTION public.add_sales_library_owner();

CREATE OR REPLACE FUNCTION public.join_sales_library(_share_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _library_id UUID;
BEGIN
  SELECT id INTO _library_id
  FROM public.sales_libraries
  WHERE share_code = upper(trim(_share_code));

  IF _library_id IS NULL THEN
    RAISE EXCEPTION 'Código de compartilhamento inválido';
  END IF;

  INSERT INTO public.sales_library_members (library_id, user_id, role)
  VALUES (_library_id, auth.uid(), 'seller') ON CONFLICT DO NOTHING;
  RETURN _library_id;
END;
$$;

CREATE TABLE public.sales_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.sales_libraries(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'Geral',
  media_type TEXT NOT NULL CHECK (media_type IN ('text', 'audio', 'image', 'video', 'document')),
  content TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_name TEXT,
  caption TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sales_asset_has_content CHECK (
    (media_type = 'text' AND content IS NOT NULL) OR
    (media_type <> 'text' AND storage_path IS NOT NULL)
  )
);

CREATE TABLE public.sales_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES public.sales_libraries(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  flow_kind TEXT NOT NULL DEFAULT 'automation' CHECK (flow_kind IN ('automation', 'quick_reply')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sales_funnel_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.sales_funnels(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('text', 'audio', 'image', 'video', 'document', 'wait', 'wait_for_reply')),
  asset_id UUID REFERENCES public.sales_media_assets(id) ON DELETE SET NULL,
  content TEXT,
  delay_seconds INTEGER NOT NULL DEFAULT 0 CHECK (delay_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (funnel_id, position),
  CONSTRAINT sales_step_has_payload CHECK (
    step_type IN ('wait', 'wait_for_reply') OR asset_id IS NOT NULL OR content IS NOT NULL
  )
);

CREATE TABLE public.sales_funnel_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.sales_funnels(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  current_step_position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'processing', 'waiting_time', 'waiting_reply', 'paused', 'completed', 'cancelled', 'failed')),
  next_run_at TIMESTAMPTZ,
  last_error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_sales_funnel_per_session
ON public.sales_funnel_runs(session_id)
WHERE status IN ('running', 'processing', 'waiting_time', 'waiting_reply', 'paused');

CREATE INDEX sales_funnel_runs_due_idx
ON public.sales_funnel_runs(next_run_at)
WHERE status IN ('running', 'waiting_time');

CREATE TABLE public.sales_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.sales_funnel_runs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.sales_funnel_steps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_library_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sales libraries" ON public.sales_libraries
FOR SELECT USING (owner_id = auth.uid() OR public.is_sales_library_member(id));
CREATE POLICY "Users can create sales libraries" ON public.sales_libraries
FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update sales libraries" ON public.sales_libraries
FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete sales libraries" ON public.sales_libraries
FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Members can view memberships" ON public.sales_library_members
FOR SELECT USING (user_id = auth.uid() OR public.can_manage_sales_library(library_id));
CREATE POLICY "Managers can add members" ON public.sales_library_members
FOR INSERT WITH CHECK (public.can_manage_sales_library(library_id));
CREATE POLICY "Managers can update members" ON public.sales_library_members
FOR UPDATE USING (public.can_manage_sales_library(library_id));
CREATE POLICY "Managers can remove members" ON public.sales_library_members
FOR DELETE USING (public.can_manage_sales_library(library_id) OR user_id = auth.uid());

CREATE POLICY "Members can view sales assets" ON public.sales_media_assets
FOR SELECT USING (public.is_sales_library_member(library_id));
CREATE POLICY "Managers can insert sales assets" ON public.sales_media_assets
FOR INSERT WITH CHECK (public.can_manage_sales_library(library_id) AND created_by = auth.uid());
CREATE POLICY "Managers can update sales assets" ON public.sales_media_assets
FOR UPDATE USING (public.can_manage_sales_library(library_id));
CREATE POLICY "Managers can delete sales assets" ON public.sales_media_assets
FOR DELETE USING (public.can_manage_sales_library(library_id));

CREATE POLICY "Members can view sales funnels" ON public.sales_funnels
FOR SELECT USING (public.is_sales_library_member(library_id));
CREATE POLICY "Managers can insert sales funnels" ON public.sales_funnels
FOR INSERT WITH CHECK (public.can_manage_sales_library(library_id) AND created_by = auth.uid());
CREATE POLICY "Managers can update sales funnels" ON public.sales_funnels
FOR UPDATE USING (public.can_manage_sales_library(library_id));
CREATE POLICY "Managers can delete sales funnels" ON public.sales_funnels
FOR DELETE USING (public.can_manage_sales_library(library_id));

CREATE POLICY "Members can view sales steps" ON public.sales_funnel_steps
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.sales_funnels f
  WHERE f.id = funnel_id AND public.is_sales_library_member(f.library_id)
));
CREATE POLICY "Managers can insert sales steps" ON public.sales_funnel_steps
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales_funnels f
  WHERE f.id = funnel_id AND public.can_manage_sales_library(f.library_id)
));
CREATE POLICY "Managers can update sales steps" ON public.sales_funnel_steps
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.sales_funnels f
  WHERE f.id = funnel_id AND public.can_manage_sales_library(f.library_id)
));
CREATE POLICY "Managers can delete sales steps" ON public.sales_funnel_steps
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.sales_funnels f
  WHERE f.id = funnel_id AND public.can_manage_sales_library(f.library_id)
));

CREATE POLICY "Users can view their funnel runs" ON public.sales_funnel_runs
FOR SELECT USING (started_by = auth.uid());
CREATE POLICY "Users can view their funnel events" ON public.sales_funnel_events
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.sales_funnel_runs r WHERE r.id = run_id AND r.started_by = auth.uid()
));

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('sales-assets', 'sales-assets', false, 104857600)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sales members can read files" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'sales-assets'
  AND public.is_sales_library_member(((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "Sales managers can upload files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'sales-assets'
  AND public.can_manage_sales_library(((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "Sales managers can update files" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'sales-assets'
  AND public.can_manage_sales_library(((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "Sales managers can delete files" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'sales-assets'
  AND public.can_manage_sales_library(((storage.foldername(name))[1])::uuid)
);

GRANT EXECUTE ON FUNCTION public.join_sales_library(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sales_library_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_sales_library(UUID, UUID) TO authenticated, service_role;

-- Poll due flow runs. The endpoint only processes already-due records.
SELECT cron.schedule(
  'sales-funnel-engine-every-30-seconds',
  '30 seconds',
  $$SELECT net.http_post(
    url := 'https://ekfkrwueqwpqakpsrsjt.supabase.co/functions/v1/sales-funnel-engine',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"action":"tick"}'::jsonb
  )$$
);
