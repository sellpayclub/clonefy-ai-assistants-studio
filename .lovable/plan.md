## Objetivo
Revisar as funções novas (prospecção + disparo), corrigir os problemas reais encontrados e implementar a "limpeza/apagar dados" para não sobrecarregar CRM e Chat ao vivo.

## O que já está OK (não vou mexer)
- `prospect-companies` e `prospect-outreach`: presentes, registradas no `config.toml`, com tabelas `prospect_outreach_campaigns`/`prospect_outreach_queue` e cron `prospect-outreach-queue-job` (roda a cada minuto) — tudo funcional.
- Frontend `Prospeccao.tsx`, `ProspectOutreachModal.tsx`, `useProspeccao.ts`, `call-outreach.ts`: fluxo completo (busca → seleção → disparo → CRM). TypeScript compila limpo.
- Deploy das edge functions é **automático** no Lovable — os comandos `supabase functions deploy` que você colou não são necessários.

## Problemas encontrados e correções

### 1. Furo de segurança no `prospect-outreach` (disparo)
As ações `dispatch_one` e `process_queue` rodam **antes** da checagem de login e sem nenhum segredo. Hoje qualquer um poderia acionar disparos chutando um `queue_id`.
- Corrigir: exigir validação (header com `CRON_SECRET` já existente nos secrets, ou token de serviço) para essas ações internas chamadas pelo cron.
- Ajustar a função SQL `process_prospect_outreach_queue` para enviar esse header.

### 2. Verificação de runtime do fluxo real
Como o build está limpo, vou rodar o app (login + página de Prospecção) para reproduzir a busca e o disparo de verdade e capturar erros de runtime/console que não aparecem em compilação. Corrijo o que aparecer.

### 3. Limpeza / apagar dados (CRM + Chat ao vivo)
Hoje existe só exclusão de 1 lead por vez; não há limpeza em massa. Vou implementar de forma segura:
- Funções SQL `SECURITY DEFINER` (escopadas a `auth.uid()`) para apagar em lote respeitando o limite de 1000 linhas do Supabase:
  - Apagar leads selecionados / por período (ex.: mais antigos que X dias) / por status.
  - Apagar sessões de Chat ao vivo (e mensagens vinculadas) por período/encerradas.
- UI:
  - CRM (`CRMLeads.tsx`): ação "Apagar selecionados" e "Limpar antigos" com diálogo de confirmação.
  - Chat ao vivo (`LiveChat.tsx`): "Limpar conversas antigas/encerradas" com confirmação.
- Confirmação obrigatória (AlertDialog) para evitar exclusão acidental.

## Fora de escopo (não vou tocar)
- Os ~98 avisos do linter Supabase são pré-existentes e amplos (RLS INFO, SECURITY DEFINER WARN, versão do Postgres). Não são desta feature e mexer neles arrisca estabilidade — deixo como está, salvo se você pedir.
- Lógica de autenticação central (regra de estabilidade do projeto).

## Detalhes técnicos
- Migrations novas: funções `delete_crm_leads_bulk(...)` e `cleanup_live_chat_sessions(...)` com `search_path=public`, escopadas ao usuário; grants para `authenticated`.
- `prospect-outreach/index.ts`: gate de segredo nas ações `dispatch_one`/`process_queue`; `process_prospect_outreach_queue()` passa o header com o segredo.
- Frontend: hooks `useCRMLeads`/`useLiveChat` ganham mutations de limpeza em lote + botões com AlertDialog.
- Validação: rodar o fluxo no preview (busca, disparo, limpeza) e conferir console/network sem erros.
