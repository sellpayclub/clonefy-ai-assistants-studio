-- Tornar buckets públicos para que a IA possa acessar os arquivos
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('assistant-knowledge', 'assistant-files');

-- Verificar se existem triggers para atualizar instruções com arquivos
-- Criar trigger para atualizar instruções quando arquivos de mídia são modificados
DROP TRIGGER IF EXISTS update_assistant_instructions_media_trigger ON assistant_media;
CREATE TRIGGER update_assistant_instructions_media_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assistant_media 
    FOR EACH ROW EXECUTE FUNCTION update_assistant_instructions_with_media();

-- Criar trigger para atualizar instruções quando arquivos de conhecimento são modificados  
DROP TRIGGER IF EXISTS update_assistant_instructions_knowledge_trigger ON assistant_knowledge_files;
CREATE TRIGGER update_assistant_instructions_knowledge_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assistant_knowledge_files
    FOR EACH ROW EXECUTE FUNCTION update_assistant_instructions_with_media();

-- Garantir que a função de mídia também trate arquivos de conhecimento
CREATE OR REPLACE FUNCTION public.update_assistant_instructions_with_files()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  media_files TEXT;
  knowledge_files TEXT;
  current_instructions TEXT;
  base_instructions TEXT;
  files_section TEXT;
  assistant_id_val UUID;
BEGIN
  -- Determinar assistant_id baseado na operação
  assistant_id_val := COALESCE(NEW.assistant_id, OLD.assistant_id);
  
  -- Buscar instruções atuais do assistente
  SELECT instructions INTO current_instructions 
  FROM assistants 
  WHERE id = assistant_id_val;
  
  -- Remover seção de arquivos existente das instruções
  base_instructions := regexp_replace(
    COALESCE(current_instructions, ''), 
    '\n\n--- ARQUIVOS DISPONÍVEIS ---.*?--- FIM ARQUIVOS ---', 
    '', 
    'gs'
  );
  
  -- Buscar arquivos de mídia do assistente
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
  WHERE assistant_id = assistant_id_val;
  
  -- Buscar arquivos de conhecimento do assistente  
  SELECT STRING_AGG(
    '• ' || file_name || ' (CONHECIMENTO): ' || file_url || COALESCE(' - ' || description, ''),
    E'\n'
  ) INTO knowledge_files
  FROM assistant_knowledge_files 
  WHERE assistant_id = assistant_id_val;
  
  -- Criar seção de arquivos se existirem arquivos
  IF media_files IS NOT NULL OR knowledge_files IS NOT NULL THEN
    files_section := E'\n\n--- ARQUIVOS DISPONÍVEIS ---\n' ||
                    'Você tem acesso aos seguintes arquivos para usar nas conversas:\n\n';
    
    IF media_files IS NOT NULL THEN
      files_section := files_section || 'ARQUIVOS DE MÍDIA (para enviar no WhatsApp):\n' || media_files || E'\n\n';
    END IF;
    
    IF knowledge_files IS NOT NULL THEN
      files_section := files_section || 'ARQUIVOS DE CONHECIMENTO (para consultar informações):\n' || knowledge_files || E'\n\n';
    END IF;
    
    files_section := files_section ||
                    'COMO USAR OS ARQUIVOS:\n' ||
                    '- MÍDIA: Use a função send_media com o URL exato listado acima\n' ||
                    '- CONHECIMENTO: Consulte o conteúdo destes arquivos para responder perguntas\n' ||
                    '- IMPORTANTE: Use sempre os URLs COMPLETOS listados acima\n' ||
                    '--- FIM ARQUIVOS ---';
  ELSE
    files_section := '';
  END IF;
  
  -- Atualizar instruções do assistente
  UPDATE assistants 
  SET instructions = base_instructions || files_section,
      updated_at = now()
  WHERE id = assistant_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Atualizar triggers para usar a nova função
DROP TRIGGER IF EXISTS update_assistant_instructions_media_trigger ON assistant_media;
CREATE TRIGGER update_assistant_instructions_media_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assistant_media 
    FOR EACH ROW EXECUTE FUNCTION update_assistant_instructions_with_files();

DROP TRIGGER IF EXISTS update_assistant_instructions_knowledge_trigger ON assistant_knowledge_files;  
CREATE TRIGGER update_assistant_instructions_knowledge_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assistant_knowledge_files
    FOR EACH ROW EXECUTE FUNCTION update_assistant_instructions_with_files();