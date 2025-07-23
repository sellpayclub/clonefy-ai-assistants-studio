-- Forçar atualização das instruções para assistentes que já têm ferramentas de calendário
UPDATE assistants 
SET tools = tools,
    updated_at = now()
WHERE tools IS NOT NULL 
  AND tools::text LIKE '%calendar%' 
  AND user_id = '139b35c6-af34-4b26-8c58-6020d520c266';