
-- Replace the function to ONLY inject media files, NOT knowledge files
CREATE OR REPLACE FUNCTION public.update_assistant_instructions_with_files()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
  media_files TEXT;
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
  
  -- Buscar APENAS arquivos de mídia do assistente (NÃO knowledge files)
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
  
  -- Criar seção de arquivos se existirem arquivos de mídia
  IF media_files IS NOT NULL THEN
    files_section := E'\n\n--- ARQUIVOS DISPONÍVEIS ---\n' ||
                    'Você tem acesso aos seguintes arquivos para enviar nas conversas do WhatsApp:\n\n' ||
                    'ARQUIVOS DE MÍDIA (para enviar no WhatsApp):\n' || media_files || E'\n\n' ||
                    'COMO USAR OS ARQUIVOS:\n' ||
                    '- Use a função send_media com o URL exato listado acima\n' ||
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
