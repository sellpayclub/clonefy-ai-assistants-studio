-- Create widget customizations table
CREATE TABLE public.widget_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL,
  widget_name TEXT NOT NULL DEFAULT 'Assistente Virtual',
  avatar_url TEXT,
  button_icon_url TEXT,
  welcome_message TEXT DEFAULT 'Olá! Como posso ajudar você hoje?',
  primary_color TEXT NOT NULL DEFAULT '#0066cc',
  secondary_color TEXT NOT NULL DEFAULT '#f8f9fa',
  text_color TEXT NOT NULL DEFAULT '#333333',
  button_position TEXT NOT NULL DEFAULT 'right' CHECK (button_position IN ('left', 'right')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assistant_id)
);

-- Create widget analytics table for daily metrics
CREATE TABLE public.widget_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_user_messages INTEGER NOT NULL DEFAULT 0,
  total_bot_messages INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  avg_session_duration INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assistant_id, date)
);

-- Create widget sessions table for individual sessions
CREATE TABLE public.widget_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  assistant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  conversation_id UUID,
  visitor_ip TEXT,
  user_agent TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  messages_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.widget_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for widget_customizations
CREATE POLICY "Users can view their own widget customizations" 
ON public.widget_customizations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widget customizations" 
ON public.widget_customizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget customizations" 
ON public.widget_customizations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget customizations" 
ON public.widget_customizations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for widget_analytics
CREATE POLICY "Users can view their own widget analytics" 
ON public.widget_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widget analytics" 
ON public.widget_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget analytics" 
ON public.widget_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for widget_sessions
CREATE POLICY "Users can view their own widget sessions" 
ON public.widget_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widget sessions" 
ON public.widget_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget sessions" 
ON public.widget_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_widget_customizations_assistant_id ON public.widget_customizations(assistant_id);
CREATE INDEX idx_widget_analytics_assistant_id_date ON public.widget_analytics(assistant_id, date);
CREATE INDEX idx_widget_sessions_assistant_id ON public.widget_sessions(assistant_id);
CREATE INDEX idx_widget_sessions_conversation_id ON public.widget_sessions(conversation_id);

-- Create trigger for updated_at
CREATE TRIGGER update_widget_customizations_updated_at
BEFORE UPDATE ON public.widget_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_analytics_updated_at
BEFORE UPDATE ON public.widget_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_sessions_updated_at
BEFORE UPDATE ON public.widget_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();