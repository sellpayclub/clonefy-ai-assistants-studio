-- Create Google Calendar integration table
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT, -- Google Calendar ID or Apple Calendar URL
  calendar_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, assistant_id, provider)
);

-- Enable RLS
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar integrations" 
ON public.calendar_integrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar integrations" 
ON public.calendar_integrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations" 
ON public.calendar_integrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations" 
ON public.calendar_integrations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_integrations_updated_at
BEFORE UPDATE ON public.calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for sync logs
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  external_event_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_external', 'from_external')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync logs
CREATE POLICY "Users can view their sync logs" 
ON public.calendar_sync_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.calendar_integrations ci 
  WHERE ci.id = calendar_sync_logs.integration_id 
  AND ci.user_id = auth.uid()
));