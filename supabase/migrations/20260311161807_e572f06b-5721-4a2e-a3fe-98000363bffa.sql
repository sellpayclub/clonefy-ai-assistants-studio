CREATE TABLE public.whatsapp_takeover_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  auto_takeover_hours numeric NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, instance_name)
);

ALTER TABLE public.whatsapp_takeover_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own takeover settings"
  ON public.whatsapp_takeover_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_takeover_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_takeover_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();