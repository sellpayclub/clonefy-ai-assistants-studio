-- Create a sequence for n8n_fluxogpt.id and set as default
CREATE SEQUENCE IF NOT EXISTS public.n8n_fluxogpt_id_seq;
ALTER TABLE public.n8n_fluxogpt ALTER COLUMN id SET DEFAULT nextval('public.n8n_fluxogpt_id_seq');
-- Set the sequence to start after the current max id to avoid conflicts
SELECT setval('public.n8n_fluxogpt_id_seq', COALESCE((SELECT MAX(id) FROM public.n8n_fluxogpt), 0) + 1, false);