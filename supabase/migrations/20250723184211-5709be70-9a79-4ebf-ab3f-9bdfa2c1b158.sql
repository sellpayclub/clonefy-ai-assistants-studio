-- Criar trigger para atualizar instruções quando assistente for modificado
CREATE OR REPLACE TRIGGER update_assistant_calendar_instructions
AFTER INSERT OR UPDATE OF tools ON assistants
FOR EACH ROW
EXECUTE FUNCTION public.update_assistant_instructions_with_calendar();