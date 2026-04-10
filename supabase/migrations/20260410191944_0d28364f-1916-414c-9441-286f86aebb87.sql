-- Corrigir contatos existentes de TODAS as instâncias que têm follow-up ativado
-- Identificamos as instâncias com follow-up ligado (registro de conexão = whatsappuser IN ('Conectado','Connected'))
-- e atualizamos TODOS os contatos dessas instâncias

UPDATE n8n_fluxogpt AS contato
SET 
  followup_enabled = true,
  followup_count = 0
FROM (
  SELECT DISTINCT nomeinstancia
  FROM n8n_fluxogpt
  WHERE followup_enabled = true
    AND whatsappuser IN ('Conectado', 'Connected')
    AND emailuser IS NOT NULL
) AS config_ativa
WHERE contato.nomeinstancia = config_ativa.nomeinstancia
  AND contato.whatsappuser NOT IN ('Conectado', 'Connected')
  AND (contato.followup_enabled = false OR contato.followup_count != 0);