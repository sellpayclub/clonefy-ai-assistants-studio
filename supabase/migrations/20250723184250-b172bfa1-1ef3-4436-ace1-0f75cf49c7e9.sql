-- Trigger manual update for existing assistants with calendar tools
UPDATE assistants 
SET tools = tools, updated_at = now() 
WHERE tools::text LIKE '%calendar%';