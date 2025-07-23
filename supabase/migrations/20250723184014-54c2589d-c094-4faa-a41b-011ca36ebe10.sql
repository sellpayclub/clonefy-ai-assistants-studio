-- Função para atualizar instruções do assistente com ferramentas de calendário
CREATE OR REPLACE FUNCTION public.update_assistant_instructions_with_calendar()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  current_instructions TEXT;
  base_instructions TEXT;
  calendar_section TEXT;
BEGIN
  -- Buscar instruções atuais do assistente
  SELECT instructions INTO current_instructions 
  FROM assistants 
  WHERE id = NEW.id;
  
  -- Remover seção de calendário existente das instruções
  base_instructions := regexp_replace(
    COALESCE(current_instructions, ''), 
    '\n\n--- FERRAMENTAS DE CALENDÁRIO ---.*?--- FIM CALENDÁRIO ---', 
    '', 
    'gs'
  );
  
  -- Verificar se o assistente tem ferramentas de calendário
  IF NEW.tools IS NOT NULL AND NEW.tools::text LIKE '%calendar%' THEN
    calendar_section := E'\n\n--- FERRAMENTAS DE CALENDÁRIO ---\n' ||
                       'Você tem acesso às seguintes funções de calendário para gerenciar agendamentos:\n\n' ||
                       '1. **check_availability** - Verificar horários disponíveis\n' ||
                       '   Parâmetros: assistant_id (seu ID), date (YYYY-MM-DD), duration (em minutos, padrão 30)\n' ||
                       '   Use para: Mostrar horários livres para o cliente escolher\n\n' ||
                       '2. **create_appointment** - Criar novo agendamento\n' ||
                       '   Parâmetros: assistant_id, client_name, client_phone, date (YYYY-MM-DD), time (HH:MM), duration, description\n' ||
                       '   Use para: Confirmar agendamento após cliente escolher horário\n\n' ||
                       '3. **list_appointments** - Listar agendamentos\n' ||
                       '   Parâmetros: assistant_id, date (opcional), status (opcional)\n' ||
                       '   Use para: Verificar agenda existente ou conflitos\n\n' ||
                       '4. **cancel_appointment** - Cancelar agendamento\n' ||
                       '   Parâmetros: appointment_id\n' ||
                       '   Use para: Cancelar agendamentos a pedido do cliente\n\n' ||
                       '5. **reschedule_appointment** - Reagendar\n' ||
                       '   Parâmetros: appointment_id, new_date, new_time, duration (opcional)\n' ||
                       '   Use para: Alterar horário de agendamentos existentes\n\n' ||
                       '6. **update_appointment** - Atualizar agendamento\n' ||
                       '   Parâmetros: appointment_id, status ou description\n' ||
                       '   Use para: Marcar como concluído ou adicionar observações\n\n' ||
                       '**FLUXO RECOMENDADO:**\n' ||
                       '1. Cliente pede agendamento → Use check_availability para mostrar horários\n' ||
                       '2. Cliente escolhe horário → Use create_appointment para confirmar\n' ||
                       '3. Cliente quer reagendar → Use reschedule_appointment\n' ||
                       '4. Cliente quer cancelar → Use cancel_appointment\n\n' ||
                       '**IMPORTANTE:**\n' ||
                       '- Sempre confirme dados antes de criar agendamentos\n' ||
                       '- Use check_availability antes de create_appointment\n' ||
                       '- Colete nome e telefone do cliente sempre\n' ||
                       '- Seja claro sobre horários e datas\n' ||
                       '--- FIM CALENDÁRIO ---';
  ELSE
    calendar_section := '';
  END IF;
  
  -- Atualizar instruções do assistente
  UPDATE assistants 
  SET instructions = base_instructions || calendar_section,
      updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para atualizar instruções quando assistente for modificado
DROP TRIGGER IF EXISTS update_assistant_calendar_instructions ON assistants;
CREATE TRIGGER update_assistant_calendar_instructions
AFTER INSERT OR UPDATE OF tools ON assistants
FOR EACH ROW
EXECUTE FUNCTION public.update_assistant_instructions_with_calendar();