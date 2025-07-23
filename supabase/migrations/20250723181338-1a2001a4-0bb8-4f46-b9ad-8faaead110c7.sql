-- Create calendar_settings table for managing assistant calendar configurations
CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL,
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '18:00',
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- Monday to Friday
  slot_duration INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
  buffer_time INTEGER NOT NULL DEFAULT 15, -- Buffer time between appointments in minutes
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assistant_id)
);

-- Create appointments table for managing appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_settings
CREATE POLICY "Users can view their own calendar settings" 
ON public.calendar_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar settings" 
ON public.calendar_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar settings" 
ON public.calendar_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar settings" 
ON public.calendar_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON public.calendar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create default calendar settings when assistant tools include calendar
CREATE OR REPLACE FUNCTION public.create_default_calendar_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the assistant has calendar tools and create default settings
  IF NEW.tools IS NOT NULL AND NEW.tools::text LIKE '%calendar%' THEN
    INSERT INTO public.calendar_settings (user_id, assistant_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (assistant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create calendar settings when assistant is created/updated with calendar tools
CREATE TRIGGER on_assistant_calendar_tools_added
  AFTER INSERT OR UPDATE ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION public.create_default_calendar_settings();