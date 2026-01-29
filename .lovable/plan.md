
# Plano: Integração Agendify com Assistentes IA Clonefy

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

**Status:** Todos os componentes implementados e prontos para uso.

### Componentes Criados:
1. ✅ Tabela `agendify_configs` com RLS policies
2. ✅ Edge Function `agendify-proxy` 
3. ✅ Tools do Agendify no `openai-assistants`
4. ✅ Processamento de tool calls no `whatsapp-webhook`
5. ✅ UI de configuração com componente `AgendifyIntegration`

## Visão Geral
- Listar serviços disponíveis
- Buscar profissionais
- Verificar horários disponíveis
- Criar agendamentos
- Cancelar/reagendar consultas
- Buscar clientes
- Consultar dados financeiros

## Arquitetura Proposta

```text
+------------------+     +-------------------+     +------------------+
|   Assistente IA  | --> | agendify-proxy    | --> |   API Agendify   |
|   (WhatsApp/Web) |     | (Edge Function)   |     | (Sistema Externo)|
+------------------+     +-------------------+     +------------------+
         |                       |
         v                       v
+------------------+     +-------------------+
| OpenAI Assistants|     | agendify_configs  |
| (Tool Calling)   |     | (Tabela Supabase) |
+------------------+     +-------------------+
```

## Componentes a Criar

### 1. Tabela de Configuração (agendify_configs)

Nova tabela para armazenar as credenciais do Agendify por usuário/assistente:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK para auth.users |
| assistant_id | UUID | FK para assistants |
| tenant_id | UUID | x-tenant-id do Agendify |
| api_base_url | TEXT | URL base da API (default: https://agendamento-agendify.com) |
| is_active | BOOLEAN | Se a integração está ativa |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

### 2. Edge Function: agendify-proxy

Nova função para fazer proxy das chamadas para a API do Agendify:

**Ações suportadas:**
- `list_services` - Listar serviços
- `list_professionals` - Listar profissionais
- `check_availability` - Verificar disponibilidade
- `create_appointment` - Criar agendamento
- `cancel_appointment` - Cancelar agendamento
- `list_appointments` - Listar agendamentos
- `search_clients` - Buscar clientes
- `get_finance_stats` - Obter dados financeiros

### 3. Atualização do OpenAI Assistants

Modificar a função `openai-assistants` para:
- Adicionar flag `agendify_enabled`
- Registrar as tools do Agendify quando habilitado
- Passar o `tenant_id` nas chamadas

**Novas Tools para OpenAI:**

```json
{
  "type": "function",
  "function": {
    "name": "agendify_list_services",
    "description": "Lista os serviços disponíveis no sistema de agendamento"
  }
},
{
  "type": "function",
  "function": {
    "name": "agendify_check_availability",
    "description": "Verifica horários disponíveis para agendamento",
    "parameters": {
      "date": "string (YYYY-MM-DD)",
      "serviceId": "string",
      "professionalId": "string (opcional)"
    }
  }
},
{
  "type": "function",
  "function": {
    "name": "agendify_create_appointment",
    "description": "Cria um novo agendamento",
    "parameters": {
      "clientPhone": "string",
      "clientName": "string",
      "serviceId": "string",
      "professionalId": "string",
      "date": "string (YYYY-MM-DD)",
      "time": "string (HH:MM)",
      "notes": "string (opcional)"
    }
  }
}
```

### 4. Atualização do WhatsApp Webhook

Modificar `whatsapp-webhook` para:
- Detectar quando o assistente chama funções `agendify_*`
- Buscar configuração do Agendify
- Chamar a edge function `agendify-proxy`
- Retornar resultado para o assistente

### 5. Interface de Configuração

Adicionar na página de Assistentes:
- Toggle para habilitar Agendify
- Campo para inserir o Tenant ID
- Botão para testar conexão
- Link para documentação

## Fluxo de Funcionamento

**Fluxo do Usuário (Configuração):**
1. Usuário acessa seu Agendify em Configurações > Desenvolvedor
2. Copia o Tenant ID (UUID)
3. No Clonefy, edita o assistente
4. Ativa "Integração Agendify"
5. Cola o Tenant ID
6. Salva

**Fluxo de Conversa (Runtime):**
1. Cliente manda mensagem: "Quero agendar um corte"
2. WhatsApp Webhook recebe a mensagem
3. OpenAI detecta intenção e chama `agendify_list_services`
4. Webhook detecta tool call e chama `agendify-proxy`
5. Proxy faz GET /api/v1/services com x-tenant-id
6. Retorna serviços para o assistente
7. Assistente pergunta qual serviço e data
8. Processo continua até agendamento finalizado

## Detalhes Técnicos

### Segurança
- Tenant ID armazenado apenas no servidor
- RLS para garantir que usuário só acessa suas configs
- Validação de ownership do assistente

### Tratamento de Erros
- Timeout de 10s para chamadas ao Agendify
- Retry automático em falhas temporárias
- Mensagens amigáveis para o cliente

### Cache
- Cache de 5 min para lista de serviços
- Cache de 5 min para lista de profissionais
- Sem cache para disponibilidade (tempo real)

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx-agendify-integration.sql` | Criar | Tabela e policies |
| `supabase/functions/agendify-proxy/index.ts` | Criar | Edge function proxy |
| `supabase/functions/openai-assistants/index.ts` | Modificar | Adicionar tools do Agendify |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar | Processar tool calls do Agendify |
| `src/pages/Assistants.tsx` | Modificar | Adicionar UI de configuração |
| `src/hooks/useAgendifyConfig.ts` | Criar | Hook para gerenciar configs |

## Estimativa de Implementação

1. **Banco de Dados** - Tabela e policies
2. **agendify-proxy** - Edge function completa
3. **openai-assistants** - Adicionar tools
4. **whatsapp-webhook** - Processar tool calls
5. **Interface** - Toggle + campo Tenant ID

## Próximos Passos (Pós-Aprovação)

1. Criar a migração SQL
2. Implementar edge function agendify-proxy
3. Atualizar openai-assistants
4. Atualizar whatsapp-webhook
5. Criar interface de configuração
6. Testar end-to-end
