

# CRM Melhorado - Plano Seguro (Sem Quebrar Nada)

## Principio de seguranca

Todas as mudancas sao **aditivas**. Nenhuma coluna existente sera renomeada ou removida. Nenhuma edge function sera modificada. Os dados da IA continuam fluindo normalmente.

---

## O que muda no banco de dados

### Novas colunas em `crm_leads` (todas opcionais, sem afetar dados existentes)
- `company` (text) - empresa
- `position` (text) - cargo
- `address` (text) - endereco
- `cpf_cnpj` (text) - documento
- `pipeline_stage` (text, default 'novo') - etapa do funil
- `custom_fields` (jsonb, default '{}') - campos extras

### Nova tabela `crm_pipeline_stages`
Etapas configuraveis do pipeline por usuario:
- id, user_id, name, color, sort_order, created_at
- RLS: usuario gerencia suas proprias etapas
- Etapas padrao criadas automaticamente: Novo, Contato Feito, Qualificado, Proposta, Negociacao, Fechado, Perdido

### Nova tabela `crm_lead_notes`
Historico de anotacoes (usuario + IA):
- id, lead_id, user_id, content, created_by ('user'/'ai'), created_at
- RLS: usuario gerencia suas proprias notas

### RLS adicional em `crm_leads`
- Adicionar politica INSERT (para criar leads manualmente)
- Adicionar politica DELETE (para excluir leads)
- As politicas existentes de SELECT e UPDATE continuam intactas

---

## O que muda no frontend

### Pagina CRM (`CRMLeads.tsx`)
- Toggle no topo: Lista (atual) / Kanban (novo)
- Botao "+ Novo Lead" que abre modal de criacao
- Painel de filtros avancados (substituindo o botao de filtro vazio atual)
- A lista existente continua identica, apenas com coluna de pipeline_stage visivel

### Kanban (`LeadKanban.tsx` - NOVO)
- Colunas = etapas do pipeline do usuario
- Drag-and-drop nativo (HTML5, sem biblioteca extra)
- Cards com: nome, score badge, tags, ultima interacao
- Arrastar entre colunas atualiza `pipeline_stage`

### Formulario de Lead (`LeadForm.tsx` - NOVO)
- Modal para criar lead manualmente
- Campos: nome, whatsapp, email, empresa, cargo, endereco, documento, tags, etapa do pipeline, notas
- Tambem usado para edicao no drawer

### Drawer de detalhes (`LeadDetailsDrawer.tsx`)
- Nova aba "Editar" com formulario completo
- Nova secao de notas na aba "Detalhes"
- As abas existentes (Visao Geral, Analise IA, Documentos, Detalhes) continuam iguais

### Filtros (`LeadFilters.tsx` - NOVO)
- Filtro por etapa do pipeline, score, fonte, tags, urgencia, periodo

### Config de Pipeline (`PipelineSettings.tsx` - NOVO)
- Modal para gerenciar etapas: adicionar, renomear, mudar cor, reordenar, excluir

### Tags (`TagInput.tsx` - NOVO)
- Componente de chips com autocomplete de tags existentes

### Notas (`LeadNotesSection.tsx` - NOVO)
- Timeline de notas com campo para adicionar
- Indicador visual: usuario vs IA

### Hook centralizado (`useCRMLeads.ts` - NOVO)
- useQuery para listar leads com filtros
- useMutation para criar, editar, excluir leads
- useMutation para notas
- useMutation para mover no pipeline

---

## O que NAO muda (garantia de seguranca)

- **Edge functions**: `whatsapp-webhook` e `widget-chat` continuam gravando leads normalmente. Eles usam `service_role` e nao sao afetados por novas colunas (colunas novas sao todas nullable com defaults).
- **Colunas existentes**: nenhuma coluna e renomeada, removida ou tem tipo alterado.
- **RLS existente**: as policies "Leads View" (SELECT) e "Leads Update" (UPDATE) continuam intactas. Apenas adicionamos INSERT e DELETE.
- **Analise IA**: os campos `conversation_analysis`, `key_topics`, `customer_questions`, `objections`, `products_mentioned`, `urgency_level`, `next_action`, `sentiment` continuam sendo preenchidos pela IA sem alteracao.
- **Drawer atual**: as 4 abas existentes permanecem identicas. So adicionamos uma 5a aba "Editar".

---

## Detalhes tecnicos

### Migration SQL
```text
-- Novas colunas (todas opcionais, sem quebrar nada)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'novo';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}';

-- Politicas que faltam
CREATE POLICY "Leads Insert" ON crm_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leads Delete" ON crm_leads FOR DELETE USING (auth.uid() = user_id);

-- Pipeline stages configuravel
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

-- Notas do lead
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
```

### Sequencia de implementacao
1. Migration SQL (schema aditivo)
2. Hook `useCRMLeads.ts` (logica centralizada)
3. Componentes novos: TagInput, LeadForm, LeadFilters, LeadNotesSection, PipelineSettings, LeadKanban
4. Atualizar LeadDetailsDrawer (adicionar aba Editar + notas)
5. Atualizar CRMLeads.tsx (toggle kanban, filtros, botao novo lead)

### Kanban: drag-and-drop nativo
Usando `draggable`, `onDragStart`, `onDragOver`, `onDrop` do HTML5. Zero dependencias extras.

### Interface Lead atualizada
A interface TypeScript do Lead ganha os novos campos opcionais (`company?`, `position?`, etc.), mantendo todos os existentes.
