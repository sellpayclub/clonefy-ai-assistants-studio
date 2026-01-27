-- Create user_branding table for whitelabel customization
CREATE TABLE public.user_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  logo_icon_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_branding_user_id_key UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own branding" 
ON public.user_branding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own branding" 
ON public.user_branding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own branding" 
ON public.user_branding 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own branding" 
ON public.user_branding 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_branding_updated_at
BEFORE UPDATE ON public.user_branding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();