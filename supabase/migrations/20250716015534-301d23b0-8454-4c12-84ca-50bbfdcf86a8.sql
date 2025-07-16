-- Criar bucket para arquivos dos assistentes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assistant-media', 'assistant-media', true);

-- Criar políticas para o bucket assistant-media
CREATE POLICY "Users can view assistant media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assistant-media');

CREATE POLICY "Users can upload assistant media files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assistant-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their assistant media files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'assistant-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their assistant media files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'assistant-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar tabela para arquivos dos assistentes
CREATE TABLE public.assistant_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'document'
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela assistant_media
ALTER TABLE public.assistant_media ENABLE ROW LEVEL SECURITY;

-- Criar políticas para assistant_media
CREATE POLICY "Users can view their assistant media" 
ON public.assistant_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their assistant media" 
ON public.assistant_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their assistant media" 
ON public.assistant_media 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their assistant media" 
ON public.assistant_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_assistant_media_updated_at
BEFORE UPDATE ON public.assistant_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar automaticamente as instruções dos assistentes
CREATE OR REPLACE FUNCTION public.update_assistant_instructions_with_media()
RETURNS TRIGGER AS $$
DECLARE
  media_files TEXT;
  current_instructions TEXT;
  base_instructions TEXT;
  media_section TEXT;
BEGIN
  -- Buscar instruções atuais do assistente
  SELECT instructions INTO current_instructions 
  FROM assistants 
  WHERE id = COALESCE(NEW.assistant_id, OLD.assistant_id);
  
  -- Remover seção de arquivos existente das instruções
  base_instructions := regexp_replace(
    COALESCE(current_instructions, ''), 
    '\n\n--- ARQUIVOS DISPONÍVEIS ---.*?--- FIM ARQUIVOS ---', 
    '', 
    'gs'
  );
  
  -- Buscar todos os arquivos do assistente
  SELECT STRING_AGG(
    CASE 
      WHEN file_type = 'image' THEN '• ' || file_name || ' (IMAGEM): ' || file_url || COALESCE(' - ' || description, '')
      WHEN file_type = 'video' THEN '• ' || file_name || ' (VÍDEO): ' || file_url || COALESCE(' - ' || description, '')
      WHEN file_type = 'document' THEN '• ' || file_name || ' (DOCUMENTO): ' || file_url || COALESCE(' - ' || description, '')
      ELSE '• ' || file_name || ': ' || file_url || COALESCE(' - ' || description, '')
    END,
    E'\n'
  ) INTO media_files
  FROM assistant_media 
  WHERE assistant_id = COALESCE(NEW.assistant_id, OLD.assistant_id);
  
  -- Criar seção de arquivos se existirem arquivos
  IF media_files IS NOT NULL THEN
    media_section := E'\n\n--- ARQUIVOS DISPONÍVEIS ---\n' ||
                    'Você tem acesso aos seguintes arquivos para enviar nas conversas do WhatsApp:\n\n' ||
                    media_files || E'\n\n' ||
                    'Para enviar arquivos no WhatsApp, use a função send_media com:\n' ||
                    '- URL do arquivo (usar exatamente como listado acima)\n' ||
                    '- Tipo: "image" para imagens, "video" para vídeos, "document" para documentos\n' ||
                    '- Legenda opcional descrevendo o arquivo\n' ||
                    '--- FIM ARQUIVOS ---';
  ELSE
    media_section := '';
  END IF;
  
  -- Atualizar instruções do assistente
  UPDATE assistants 
  SET instructions = base_instructions || media_section,
      updated_at = now()
  WHERE id = COALESCE(NEW.assistant_id, OLD.assistant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar instruções automaticamente
CREATE TRIGGER trigger_update_assistant_instructions_insert
  AFTER INSERT ON public.assistant_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assistant_instructions_with_media();

CREATE TRIGGER trigger_update_assistant_instructions_update
  AFTER UPDATE ON public.assistant_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assistant_instructions_with_media();

CREATE TRIGGER trigger_update_assistant_instructions_delete
  AFTER DELETE ON public.assistant_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_assistant_instructions_with_media();