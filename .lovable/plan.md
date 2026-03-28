

## Plano: Criar página "Documentação Técnica" (admin-only)

### O que será feito

Criar uma nova página `/docs-tecnico` acessível **apenas pelo admin** (via `RestrictedRoute`), contendo a documentação completa do software CLONEFY — arquitetura, tabelas, edge functions, fluxos, integrações e como tudo funciona. Será uma página dentro do app com seções organizadas por accordion/tabs.

### Estrutura da Documentação

A página terá as seguintes seções:

1. **Visão Geral do Sistema** — stack (React + Vite + Supabase + Tailwind), deploy (Vercel), estrutura de pastas
2. **Autenticação & Acesso** — Supabase Auth, emails autorizados, admin check por email, `RestrictedRoute`
3. **Banco de Dados** — todas as tabelas principais: `n8n_fluxogpt`, `user_quotas`, `authorized_emails`, `crm_leads`, `commerce_*`, `followup_*`, etc.
4. **Edge Functions** — lista de todas as 35+ functions com descrição do que cada uma faz
5. **Módulos do Sistema**:
   - Agentes IA (OpenAI Assistants API)
   - WhatsApp (Evolution API + webhooks)
   - Telegram (bot + webhooks)
   - Chat Flutuante (widget embed)
   - CRM Leads (kanban + pipeline)
   - Follow-up Automático (CRON + webhook externo)
   - Loja WhatsApp (commerce_*)
   - Financeiro IA
   - Chat ao Vivo (live chat)
   - Agendamento (Calendar + Google Calendar)
6. **Integrações Externas** — Evolution API, OpenAI, ElevenLabs, Kiwify, Agendify, webhook N8N
7. **Frontend** — rotas, lazy loading, sidebar, temas, i18n (4 idiomas), branding customizável
8. **Segurança** — RLS policies, admin password, RestrictedRoute, quotas por usuário

### Implementação Técnica

| Arquivo | Ação |
|---|---|
| `src/pages/TechnicalDocs.tsx` | Nova página com toda a documentação em seções accordion |
| `src/App.tsx` | Adicionar rota `/docs-tecnico` dentro de `RestrictedRoute` |
| `src/components/AppSidebar.tsx` | Adicionar item "Docs Técnico" no menu (adminOnly) com ícone `FileText` |

### Detalhes

- Página read-only, sem interações com banco — é puro conteúdo estático organizado em accordions
- Visível apenas para admin (`RestrictedRoute` + `adminOnly` no sidebar)
- Toda a documentação hardcoded no componente (não precisa de API)
- Estilo consistente com o resto do app (cards, badges, accordions do shadcn)

