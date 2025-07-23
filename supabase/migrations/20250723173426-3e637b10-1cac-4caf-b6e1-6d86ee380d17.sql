-- Criar tabela para arquivos de conhecimento dos assistentes
CREATE TABLE public.assistant_knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  openai_file_id TEXT, -- ID do arquivo no OpenAI
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela assistant_knowledge_files
ALTER TABLE public.assistant_knowledge_files ENABLE ROW LEVEL SECURITY;

-- Criar políticas para assistant_knowledge_files
CREATE POLICY "Users can view their assistant knowledge files" 
ON public.assistant_knowledge_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their assistant knowledge files" 
ON public.assistant_knowledge_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their assistant knowledge files" 
ON public.assistant_knowledge_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their assistant knowledge files" 
ON public.assistant_knowledge_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_assistant_knowledge_files_updated_at
BEFORE UPDATE ON public.assistant_knowledge_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para arquivos de conhecimento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assistant-knowledge', 'assistant-knowledge', false);

-- Criar políticas para o bucket assistant-knowledge
CREATE POLICY "Users can view their knowledge files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assistant-knowledge' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload knowledge files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assistant-knowledge' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their knowledge files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'assistant-knowledge' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their knowledge files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'assistant-knowledge' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);