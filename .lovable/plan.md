

# Plano: Agente Financeiro IA - 100% Isolado

## Principio de Isolamento

O modulo financeiro seguira o **mesmo padrao do Commerce**: webhook proprio, edge function propria, tabelas proprias, paginas proprias. **Zero alteracoes** no `whatsapp-webhook/index.ts` ou em qualquer outro arquivo existente (exceto `App.tsx`, `AppSidebar.tsx` e `config.toml` para adicionar rotas/menu).

```text
Commerce (referencia):                    Financeiro (novo):
commerce-webhook  ──> commerce-ai         financial-webhook ──> financial-ai
commerce_stores, commerce_orders...       financial_accounts, financial_transactions...
CommerceStore.tsx, CommerceOrders.tsx      FinancialDashboard.tsx, FinancialTransactions.tsx
CommerceConnectWhatsApp.tsx               FinancialConnect.tsx
```

## Banco de Dados (4 tabelas novas, isoladas)

| Tabela | Colunas Principais |
|--------|-------------------|
| `financial_accounts` | id, user_id, whatsapp_instance_name, whatsapp_connected, currency (BRL), monthly_income, created_at, updated_at |
| `financial_transactions` | id, user_id, type (income/expense), amount, description, category, date, payment_method, notes, source (whatsapp/manual), created_at |
| `financial_categories` | id, user_id, name, type (income/expense), icon, color, budget_limit, is_default |
| `financial_budgets` | id, user_id, category, month (YYYY-MM), limit_amount, spent_amount |

Todas com **RLS**: `user_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE.

Categorias padrao criadas automaticamente via trigger ao inserir `financial_accounts`:
- Gastos: Alimentacao, Transporte, Moradia, Saude, Educacao, Lazer, Contas, Outros
- Receitas: Salario, Freelance, Investimentos, Vendas, Outros

## Edge Functions (2 novas, isoladas)

### 1. `financial-webhook` (verify_jwt = false)
- Recebe mensagens do Evolution API (webhook proprio)
- Identifica loja financeira pelo `instance_name`
- Extrai texto da mensagem
- Chama `financial-ai` passando user_id, mensagem, numero
- **NAO toca** no whatsapp-webhook existente

### 2. `financial-ai` (verify_jwt = false)
- Recebe mensagem do usuario
- Usa **Lovable AI Gateway** (gemini-3-flash-preview) com tool calling
- Tools disponiveis:

| Tool | Descricao |
|------|-----------|
| `add_transaction` | Registrar gasto ou ganho com categoria automatica |
| `list_transactions` | Listar transacoes com filtros (periodo, categoria, tipo) |
| `get_summary` | Resumo financeiro do periodo (dia/semana/mes) |
| `get_balance` | Saldo atual (receitas - gastos) |
| `get_by_category` | Gastos agrupados por categoria |
| `set_budget` | Definir orcamento mensal por categoria |
| `delete_transaction` | Apagar transacao por descricao/valor |
| `edit_transaction` | Editar transacao existente |

- O agente interpreta linguagem natural:
  - "Gastei 50 no mercado" -> add_transaction(expense, 50, Alimentacao)
  - "Recebi 3000 de salario" -> add_transaction(income, 3000, Salario)
  - "Quanto gastei esse mes?" -> get_summary(month)
  - "Apaga o ultimo gasto" -> delete_transaction(last)
- Responde via Evolution API (sendText) direto ao usuario

## Frontend (3 paginas novas)

### `/financeiro` - Dashboard Principal
- Wizard de setup: se nao tem `financial_account`, mostra botao "Ativar Agente Financeiro"
- Se conectado, exibe:
  - **4 Cards KPI**: Saldo do mes, Receitas, Gastos, % Economizado
  - **LineChart** (Recharts): Evolucao receitas vs gastos ultimos 30 dias
  - **PieChart**: Distribuicao de gastos por categoria
  - **BarChart**: Comparativo mensal (ultimos 6 meses)
  - **Progress bars**: Orcamento por categoria vs gasto real
- Filtro de periodo: 7d, 30d, 90d, ano

### `/financeiro/transacoes` - Planilha Completa
- Tabela com todas as transacoes
- Filtros: periodo, categoria, tipo (gasto/ganho), valor min/max
- Busca por descricao
- Edicao inline (clicar para editar)
- Adicionar transacao manual (botao + modal)
- Exportar CSV
- Paginacao

### `/financeiro/conectar` - Conexao WhatsApp
- Mesmo padrao do `CommerceConnectWhatsApp.tsx`
- Cria instancia Evolution API dedicada (`financial_USERID`)
- Webhook apontando para `financial-webhook`
- QR Code + polling de status

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/FinancialDashboard.tsx` | Dashboard com graficos e KPIs |
| `src/pages/FinancialTransactions.tsx` | Planilha/tabela de transacoes |
| `src/pages/FinancialConnect.tsx` | Wizard de conexao WhatsApp |
| `src/hooks/useFinancialData.ts` | Hook para queries financeiras |
| `supabase/functions/financial-webhook/index.ts` | Webhook isolado |
| `supabase/functions/financial-ai/index.ts` | Agente IA com tool calling |

## Arquivos a Modificar (somente adicoes)

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | 3 rotas novas: /financeiro, /financeiro/transacoes, /financeiro/conectar |
| `src/components/AppSidebar.tsx` | 1 item novo no menu: "Financeiro IA" (icone Wallet) |
| `supabase/config.toml` | 2 funcoes novas: financial-webhook, financial-ai (verify_jwt = false) |

**Nenhum arquivo existente sera alterado de forma destrutiva.** Somente adicoes de rotas, menu e config.

## Detalhes Tecnicos

### Prompt do Agente (system message no financial-ai)
O agente sera instruido como consultor financeiro pessoal:
- Fala em portugues, amigavel e profissional
- Categoriza automaticamente cada transacao
- Alerta quando gastos ultrapassam orcamento configurado
- Da dicas de economia baseadas no perfil de gastos
- Formata relatorios com emojis para WhatsApp
- Confirma antes de apagar/editar transacoes

### Lovable AI Gateway (nao OpenAI direto)
Usa `https://ai.gateway.lovable.dev/v1/chat/completions` com `LOVABLE_API_KEY` (ja configurado). Modelo: `google/gemini-3-flash-preview` com tool calling para structured output.

### Seguranca
- RLS em todas as tabelas: `user_id = auth.uid()`
- Edge functions usam `SUPABASE_SERVICE_ROLE_KEY` internamente
- Webhook valida que a instancia pertence a um `financial_account` antes de processar
- Dados financeiros nunca expostos sem autenticacao

