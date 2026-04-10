-- Resetar followup_count de TODOS os contatos antigos bloqueados em TODAS as instâncias
UPDATE n8n_fluxogpt
SET followup_count = 0
WHERE followup_count = 3
  AND whatsappuser NOT IN ('Conectado', 'Connected');