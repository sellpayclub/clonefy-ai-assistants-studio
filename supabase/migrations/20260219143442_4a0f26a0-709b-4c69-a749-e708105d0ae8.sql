
-- Novas colunas em crm_leads (todas opcionais, sem afetar dados existentes)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'novo';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}';

-- Politicas INSERT e DELETE que faltam no crm_leads
CREATE POLICY "Leads Insert" ON crm_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leads Delete" ON crm_leads FOR DELETE USING (auth.uid() = user_id);

-- Tabela de etapas do pipeline configuravel por usuario
CREATE TABLE crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_stages_all" ON crm_pipeline_stages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela de notas/historico do lead
CREATE TABLE crm_lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_by text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE crm_lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_notes_all" ON crm_lead_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
