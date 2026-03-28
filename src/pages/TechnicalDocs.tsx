import { FileText, Database, Server, Shield, Globe, Layers, Cpu, Smartphone, Bot, MessageSquare, Store, Wallet, Radio, Calendar, Users, Megaphone, Code, Zap, Key, Lock } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SectionIcon = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-5 h-5 text-primary" />
    <span>{label}</span>
  </div>
);

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-muted/50 border rounded-lg p-3 text-xs overflow-x-auto font-mono my-2">
    <code>{children}</code>
  </pre>
);

const TableDoc = ({ name, description, columns }: { name: string; description: string; columns: string[] }) => (
  <div className="border rounded-lg p-3 mb-3">
    <div className="flex items-center gap-2 mb-1">
      <Badge variant="outline" className="font-mono text-xs">{name}</Badge>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
    <p className="text-xs text-muted-foreground">Colunas: {columns.join(", ")}</p>
  </div>
);

const EdgeFnDoc = ({ name, description, auth }: { name: string; description: string; auth: string }) => (
  <div className="flex items-start gap-3 py-2 border-b last:border-b-0">
    <Badge variant={auth === "público" ? "destructive" : "secondary"} className="text-xs mt-0.5 shrink-0">{auth}</Badge>
    <div>
      <span className="font-mono text-sm font-medium">{name}</span>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const TechnicalDocs = () => {
  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Documentação Técnica — CLONEFY</h1>
          </div>
          <p className="text-muted-foreground">
            Documento completo do sistema para desenvolvedores. Cobre arquitetura, banco de dados, edge functions, módulos, integrações e segurança.
          </p>
          <Badge className="mt-2">Acesso restrito — Admin only</Badge>
        </div>

        <Accordion type="multiple" className="space-y-4">

          {/* 1. VISÃO GERAL */}
          <AccordionItem value="overview" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Layers} label="1. Visão Geral do Sistema" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Stack Tecnológica</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["React 18", "TypeScript", "Vite 5", "Tailwind CSS 3", "shadcn/ui", "Supabase", "Vercel", "TanStack Query"].map(t => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Estrutura de Pastas</h4>
                  <CodeBlock>{`src/
├── components/        # Componentes React reutilizáveis
│   ├── ui/            # shadcn/ui primitivos (button, dialog, etc.)
│   ├── crm/           # Componentes do CRM (kanban, forms)
│   ├── followup/      # Componentes do Follow-up
│   ├── live-chat/     # Chat ao vivo
│   └── widget/        # Personalização do widget embed
├── contexts/          # React Contexts (Auth, Language, Branding, Theme)
├── hooks/             # Custom hooks (useAssistants, useCRMLeads, etc.)
├── pages/             # Páginas/rotas do app
│   ├── followup/      # Páginas do sistema de follow-up
│   ├── ia/            # Páginas de soluções IA por setor
│   └── tools/         # Ferramentas (ClickGo, geradores)
├── integrations/      # Config Supabase (client, types)
├── translations/      # Arquivos i18n (pt, en, es, de)
├── data/              # JSON estáticos (nichos IA)
├── utils/             # Utilitários (performance cache)
└── lib/               # Helpers (auth-utils, cn)

supabase/
├── functions/         # 35+ Edge Functions (Deno)
├── migrations/        # Migrações SQL do banco
└── config.toml        # Configuração das functions

public/
├── embed-widget.js    # Script embed do chat flutuante
├── embed-widget-v2.js # V2 do embed
└── telegram-widget.js # Widget Telegram`}</CodeBlock>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Deploy</h4>
                  <p className="text-sm text-muted-foreground">
                    Frontend hospedado na <strong>Vercel</strong> com <code>vercel.json</code> configurando rewrites SPA. 
                    Backend (Edge Functions) roda no <strong>Supabase Edge Runtime</strong> (Deno). 
                    Banco de dados <strong>PostgreSQL</strong> gerenciado pelo Supabase.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. AUTENTICAÇÃO */}
          <AccordionItem value="auth" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Lock} label="2. Autenticação & Controle de Acesso" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Supabase Auth</h4>
                  <p className="text-sm text-muted-foreground">
                    Autenticação via <strong>Supabase Auth</strong> com email/senha e Google OAuth. 
                    O contexto <code>AuthContext.tsx</code> gerencia sessão, login, logout e reset de senha.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Emails Autorizados</h4>
                  <p className="text-sm text-muted-foreground">
                    Tabela <code>authorized_emails</code> controla quem pode se cadastrar. 
                    Na página de Auth, antes de criar conta, o sistema verifica se o email está na whitelist. 
                    O admin pode adicionar/remover emails pela página <code>/admin</code>.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Admin Check</h4>
                  <CodeBlock>{`// AppLayout.tsx
const ADMIN_EMAIL = 'personaldann@gmail.com';

export const RestrictedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};`}</CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Rotas restritas (Follow-up, Commerce, Financeiro, Docs Técnico) usam <code>RestrictedRoute</code>. 
                    No sidebar, itens com <code>adminOnly: true</code> são filtrados por email.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Quotas por Usuário</h4>
                  <p className="text-sm text-muted-foreground">
                    Tabela <code>user_quotas</code> limita assistentes, conexões WhatsApp e mensagens por usuário. 
                    Hook <code>useUserLimits</code> consulta e a edge function <code>check-user-limits</code> valida server-side.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. BANCO DE DADOS */}
          <AccordionItem value="database" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Database} label="3. Banco de Dados (PostgreSQL)" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  O sistema usa PostgreSQL gerenciado pelo Supabase. Todas as tabelas têm RLS (Row Level Security) habilitado. 
                  Abaixo estão as tabelas agrupadas por módulo.
                </p>

                <h4 className="font-semibold">Core / Agentes IA</h4>
                <TableDoc name="assistants" description="Agentes IA criados pelo usuário" columns={["id", "user_id", "name", "openai_assistant_id", "model", "instructions", "tools", "metadata", "is_active"]} />
                <TableDoc name="conversations" description="Conversas com agentes (threads OpenAI)" columns={["id", "user_id", "assistant_id", "openai_thread_id", "title", "whatsapp_contact"]} />
                <TableDoc name="files" description="Arquivos enviados para OpenAI" columns={["id", "user_id", "name", "file_path", "openai_file_id", "file_type"]} />
                <TableDoc name="assistant_files" description="Relação assistente ↔ arquivo" columns={["id", "assistant_id", "file_id"]} />
                <TableDoc name="assistant_knowledge_files" description="Base de conhecimento dos agentes" columns={["id", "assistant_id", "user_id", "file_name", "file_url", "openai_file_id"]} />
                <TableDoc name="assistant_media" description="Mídias dos agentes (imagens, PDFs)" columns={["id", "assistant_id", "user_id", "file_name", "file_type", "file_url"]} />

                <Separator />
                <h4 className="font-semibold">WhatsApp / Conexões</h4>
                <TableDoc name="n8n_fluxogpt" description="Conexões WhatsApp (Evolution API)" columns={["id", "emailuser", "instanceName", "apikey", "assistantId", "assistantName", "followup_enabled", "followup_delay_minutes", "group_enabled"]} />
                <TableDoc name="authorized_emails" description="Whitelist de emails permitidos" columns={["id", "email", "notes", "added_by"]} />
                <TableDoc name="user_quotas" description="Limites por usuário" columns={["id", "user_id", "max_assistants", "max_whatsapp_connections", "max_messages_per_month"]} />

                <Separator />
                <h4 className="font-semibold">CRM</h4>
                <TableDoc name="crm_leads" description="Leads capturados do WhatsApp" columns={["id", "user_id", "name", "whatsapp_number", "status", "pipeline_stage", "lead_score", "sentiment", "tags", "conversation_analysis"]} />
                <TableDoc name="crm_lead_notes" description="Notas manuais nos leads" columns={["id", "lead_id", "user_id", "content"]} />
                <TableDoc name="crm_lead_attachments" description="Arquivos anexados aos leads" columns={["id", "lead_id", "user_id", "file_name", "file_url", "source"]} />
                <TableDoc name="crm_pipeline_stages" description="Estágios do pipeline (customizável)" columns={["id", "user_id", "name", "color", "sort_order"]} />

                <Separator />
                <h4 className="font-semibold">Follow-up Automático</h4>
                <TableDoc name="followup_campaigns" description="Campanhas de follow-up" columns={["id", "user_id", "name", "status", "message_sequence", "whatsapp_instance", "max_followups", "working_days", "start_hour", "end_hour"]} />
                <TableDoc name="followup_leads" description="Leads dentro de campanhas" columns={["id", "campaign_id", "name", "whatsapp_number", "current_step", "status", "lead_score"]} />

                <Separator />
                <h4 className="font-semibold">Commerce (Loja WhatsApp)</h4>
                <TableDoc name="commerce_stores" description="Lojas do usuário" columns={["id", "user_id", "name", "whatsapp_number", "ai_personality", "welcome_message"]} />
                <TableDoc name="commerce_products" description="Produtos da loja" columns={["id", "store_id", "name", "price", "stock_quantity", "sku", "description"]} />
                <TableDoc name="commerce_orders" description="Pedidos" columns={["id", "store_id", "customer_id", "order_number", "status", "total", "payment_status"]} />
                <TableDoc name="commerce_customers" description="Clientes da loja" columns={["id", "store_id", "whatsapp_number", "name", "total_orders", "total_spent"]} />
                <TableDoc name="commerce_conversations" description="Conversas de venda" columns={["id", "store_id", "customer_id", "status", "current_cart"]} />
                <TableDoc name="commerce_messages" description="Mensagens das conversas" columns={["id", "conversation_id", "content", "sender_type"]} />
                <TableDoc name="commerce_categories" description="Categorias de produtos" columns={["id", "store_id", "name"]} />
                <TableDoc name="commerce_product_variants" description="Variantes dos produtos" columns={["id", "product_id", "name", "price", "stock_quantity"]} />
                <TableDoc name="commerce_payment_settings" description="Config de pagamento (PIX, gateway)" columns={["id", "store_id", "payment_method", "pix_key", "gateway_api_key"]} />

                <Separator />
                <h4 className="font-semibold">Financeiro IA</h4>
                <TableDoc name="financial_accounts" description="Conta financeira do usuário" columns={["id", "user_id", "currency", "monthly_income", "whatsapp_connected"]} />
                <TableDoc name="financial_transactions" description="Transações financeiras" columns={["id", "user_id", "type", "amount", "category", "description", "ai_categorized"]} />
                <TableDoc name="financial_categories" description="Categorias financeiras" columns={["id", "user_id", "name", "type", "budget_limit"]} />
                <TableDoc name="financial_budgets" description="Orçamentos mensais" columns={["id", "user_id", "category", "month", "limit_amount", "spent_amount"]} />

                <Separator />
                <h4 className="font-semibold">Agendamento</h4>
                <TableDoc name="appointments" description="Agendamentos" columns={["id", "user_id", "assistant_id", "client_name", "client_phone", "appointment_date", "appointment_time", "status"]} />
                <TableDoc name="calendar_settings" description="Config de horários" columns={["id", "user_id", "assistant_id", "working_hours_start", "working_hours_end", "working_days", "slot_duration"]} />
                <TableDoc name="calendar_integrations" description="Integração Google Calendar" columns={["id", "user_id", "provider", "access_token", "refresh_token", "calendar_id"]} />
                <TableDoc name="calendar_sync_logs" description="Logs de sincronização" columns={["id", "integration_id", "action", "status", "sync_direction"]} />

                <Separator />
                <h4 className="font-semibold">Outros</h4>
                <TableDoc name="daily_checklist" description="Checklist diário do dashboard" columns={["id", "user_id", "task_name", "completed", "date"]} />
                <TableDoc name="agendify_configs" description="Config do Agendify externo" columns={["id", "user_id", "assistant_id", "tenant_id", "api_base_url"]} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. EDGE FUNCTIONS */}
          <AccordionItem value="functions" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Server} label="4. Edge Functions (Supabase/Deno)" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Todas as funções rodam no Supabase Edge Runtime (Deno). Algumas requerem JWT, outras são públicas (webhooks).
                </p>

                <h4 className="font-semibold mb-2">Agentes IA</h4>
                <EdgeFnDoc name="openai-assistants" description="CRUD de assistentes na OpenAI (create, update, delete, list). Gerencia modelos, instructions e tools." auth="JWT" />
                <EdgeFnDoc name="chat-proxy" description="Envia mensagens para threads OpenAI e retorna respostas do assistente." auth="JWT" />
                <EdgeFnDoc name="chat-api" description="API de chat para o widget embed — cria threads e processa mensagens." auth="público" />
                <EdgeFnDoc name="web-scraper" description="Faz scraping de URLs para alimentar a base de conhecimento dos agentes." auth="JWT" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">WhatsApp (Evolution API)</h4>
                <EdgeFnDoc name="whatsapp-evolution" description="Gerencia instâncias Evolution API: create, list, delete, get_qr, check_status. Salva na tabela n8n_fluxogpt." auth="JWT" />
                <EdgeFnDoc name="whatsapp-webhook" description="Recebe webhooks da Evolution API (mensagens recebidas). Processa com OpenAI e responde via Evolution." auth="público" />
                <EdgeFnDoc name="whatsapp-webhook-test" description="Endpoint de teste para simular webhooks do WhatsApp." auth="público" />
                <EdgeFnDoc name="whatsapp-followup" description="Recebe callbacks do sistema de follow-up externo (N8N)." auth="público" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Telegram</h4>
                <EdgeFnDoc name="telegram-setup" description="Configura o webhook do bot Telegram na API do Telegram." auth="público" />
                <EdgeFnDoc name="telegram-bot" description="Gerencia bots: criar, listar, deletar, verificar status." auth="JWT" />
                <EdgeFnDoc name="telegram-webhook" description="Recebe mensagens do Telegram, processa com OpenAI e responde." auth="público" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Widget / Chat Embed</h4>
                <EdgeFnDoc name="widget-config" description="Retorna configuração do widget (cores, textos, posição) para o script embed." auth="público" />
                <EdgeFnDoc name="widget-chat" description="Processa mensagens do chat embed via OpenAI." auth="público" />
                <EdgeFnDoc name="widget-analytics" description="Registra eventos de analytics do widget (aberturas, mensagens, cliques)." auth="público" />
                <EdgeFnDoc name="add-sample-analytics" description="Gera dados de analytics de exemplo para demonstração." auth="JWT" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Follow-up</h4>
                <EdgeFnDoc name="followup-scheduler" description="CRON que verifica leads pendentes e agenda o envio de mensagens." auth="JWT" />
                <EdgeFnDoc name="followup-dispatcher" description="Envia mensagens de follow-up via Evolution API conforme a sequência da campanha." auth="JWT" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Commerce</h4>
                <EdgeFnDoc name="commerce-ai" description="IA de vendas: processa mensagens do cliente, sugere produtos, monta carrinho." auth="público" />
                <EdgeFnDoc name="commerce-payment" description="Gera cobranças PIX e processa pagamentos." auth="JWT" />
                <EdgeFnDoc name="commerce-webhook" description="Recebe webhooks de pagamento e atualiza status do pedido." auth="público" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Financeiro</h4>
                <EdgeFnDoc name="financial-ai" description="IA financeira: categoriza transações por mensagem WhatsApp, gera relatórios." auth="público" />
                <EdgeFnDoc name="financial-webhook" description="Recebe transações via WhatsApp e registra no banco." auth="público" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Agendamento</h4>
                <EdgeFnDoc name="calendar-management" description="CRUD de agendamentos e configurações de horários." auth="JWT" />
                <EdgeFnDoc name="google-calendar-auth" description="OAuth2 com Google Calendar: gera URL de autorização e troca code por tokens." auth="JWT" />
                <EdgeFnDoc name="ai-calendar-proxy" description="IA processa pedidos de agendamento via linguagem natural." auth="JWT" />
                <EdgeFnDoc name="agendify-proxy" description="Proxy para API do Agendify externo." auth="público" />

                <Separator className="my-3" />
                <h4 className="font-semibold mb-2">Outros</h4>
                <EdgeFnDoc name="check-user-limits" description="Verifica quotas do usuário (assistentes, conexões, mensagens)." auth="JWT" />
                <EdgeFnDoc name="send-email" description="Envia emails transacionais (boas-vindas, notificações)." auth="JWT" />
                <EdgeFnDoc name="live-chat-send" description="Envia mensagens do painel de chat ao vivo para o WhatsApp do cliente." auth="público" />
                <EdgeFnDoc name="purchase-webhook" description="Webhook Kiwify: libera acesso após compra." auth="público" />
                <EdgeFnDoc name="kiwify-webhook" description="Alternativa de webhook Kiwify para processamento de vendas." auth="público" />
                <EdgeFnDoc name="group-connection" description="Gerencia conexões de grupos WhatsApp." auth="JWT" />
                <EdgeFnDoc name="group-manager" description="Gerencia membros e configurações de grupos." auth="JWT" />
                <EdgeFnDoc name="group-webhook" description="Recebe mensagens de grupos WhatsApp." auth="público" />
                <EdgeFnDoc name="group-report-scheduler" description="Gera relatórios periódicos dos grupos." auth="JWT" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. MÓDULOS */}
          <AccordionItem value="modules" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Cpu} label="5. Módulos do Sistema" />
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="multiple" className="space-y-2">

                {/* Agentes IA */}
                <AccordionItem value="mod-agents" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Bot} label="Agentes IA (OpenAI Assistants)" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Como funciona:</strong> Cada agente é um Assistant da OpenAI (GPT-4o por padrão). O usuário cria o agente pelo painel, definindo nome, instrução e modelo. O sistema salva na tabela <code>assistants</code> e cria o assistant na OpenAI via edge function <code>openai-assistants</code>.</p>
                      <p><strong>Knowledge Base:</strong> O usuário faz upload de arquivos (PDF, TXT, DOCX) que são enviados para a OpenAI como file_search. Tabela <code>assistant_knowledge_files</code>.</p>
                      <p><strong>Ferramentas:</strong> Code Interpreter e File Search habilitáveis por agente.</p>
                      <p><strong>Templates:</strong> O componente <code>AssistantTemplates</code> oferece templates pré-configurados por nicho (vendas, suporte, etc.).</p>
                      <p><strong>Fluxo de conversa:</strong> Cada conversa cria uma Thread OpenAI. Mensagens são adicionadas à thread e o assistente responde via Run.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* WhatsApp */}
                <AccordionItem value="mod-whatsapp" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Smartphone} label="WhatsApp (Evolution API)" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Infraestrutura:</strong> Usa a <strong>Evolution API</strong> (self-hosted em <code>evolutionapi.clonefyia.com</code>) para conectar números WhatsApp.</p>
                      <p><strong>Fluxo de conexão:</strong></p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Usuário clica "Nova Conexão" → edge function <code>whatsapp-evolution</code> action=create</li>
                        <li>Cria instância na Evolution API com webhook apontando para <code>whatsapp-webhook</code></li>
                        <li>Salva na tabela <code>n8n_fluxogpt</code> (emailuser, instanceName, apikey, assistantId)</li>
                        <li>Retorna QR Code → usuário escaneia com WhatsApp</li>
                        <li>Conexão estabelecida → status muda para "open"</li>
                      </ol>
                      <p><strong>Recebimento de mensagens:</strong></p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Mensagem chega → Evolution API envia webhook para <code>whatsapp-webhook</code></li>
                        <li>Webhook identifica a instância → busca assistantId na <code>n8n_fluxogpt</code></li>
                        <li>Cria/reutiliza thread OpenAI para o contato</li>
                        <li>Envia mensagem para o assistente → recebe resposta</li>
                        <li>Envia resposta de volta via Evolution API</li>
                        <li>Salva lead no CRM (<code>crm_leads</code>) com análise de sentimento</li>
                      </ol>
                      <p><strong>Follow-up automático:</strong> Quando <code>followup_enabled=true</code> na conexão, após X minutos de inatividade, o sistema envia mensagem de follow-up usando a sequência configurada.</p>
                      <p><strong>Áudio (ElevenLabs):</strong> Se configurado, respostas de texto são convertidas em áudio via ElevenLabs API e enviadas como mensagem de voz.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Telegram */}
                <AccordionItem value="mod-telegram" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Send} label="Telegram" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Como funciona:</strong> O usuário cria um bot no BotFather, cola o token no painel. O sistema registra o webhook via <code>telegram-setup</code>.</p>
                      <p><strong>Fluxo:</strong> Mensagem recebida → <code>telegram-webhook</code> → processa com OpenAI → responde via Telegram Bot API.</p>
                      <p><strong>Tabela:</strong> Usa <code>n8n_fluxogpt</code> com campo <code>telegram_bot_token</code>.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Widget */}
                <AccordionItem value="mod-widget" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={MessageSquare} label="Chat Flutuante (Widget Embed)" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Como funciona:</strong> Script JS (<code>embed-widget-v2.js</code>) é inserido no site do cliente. Carrega config via <code>widget-config</code> e renderiza chat flutuante.</p>
                      <p><strong>Personalização:</strong> Página <code>/widget-customization</code> permite alterar cores, textos, posição, avatar, mensagem de boas-vindas. Salva em <code>widget_customizations</code>.</p>
                      <p><strong>Analytics:</strong> Cada interação (abertura, mensagem, lead capturado) é registrada via <code>widget-analytics</code>. Dashboard em <code>/widget-analytics</code>.</p>
                      <p><strong>Embed code:</strong></p>
                      <CodeBlock>{`<script src="https://clonefy.app/embed-widget-v2.js" 
  data-agent-id="UUID_DO_AGENTE">
</script>`}</CodeBlock>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* CRM */}
                <AccordionItem value="mod-crm" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Users} label="CRM Leads" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Captura automática:</strong> Quando uma mensagem chega pelo WhatsApp, o webhook automaticamente cria/atualiza o lead na <code>crm_leads</code> com análise de IA (sentimento, tópicos, score).</p>
                      <p><strong>Pipeline Kanban:</strong> Visualização kanban com estágios customizáveis (<code>crm_pipeline_stages</code>). Drag & drop para mover leads entre estágios.</p>
                      <p><strong>Filtros:</strong> Por status, sentimento, urgência, tags, período e busca textual.</p>
                      <p><strong>Detalhes do lead:</strong> Drawer lateral com notas, anexos (vindos do WhatsApp), histórico de interações e campos customizados.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Follow-up */}
                <AccordionItem value="mod-followup" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Megaphone} label="Follow-up Automático" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Conceito:</strong> Sistema de campanhas de mensagens sequenciais automatizadas via WhatsApp.</p>
                      <p><strong>Fluxo:</strong></p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Admin cria campanha com sequência de mensagens (suporta variáveis como {"{{nome}}"}, {"{{empresa}}"})</li>
                        <li>Importa leads (CSV ou manual) → tabela <code>followup_leads</code></li>
                        <li>Conecta instância WhatsApp à campanha</li>
                        <li>Scheduler (<code>followup-scheduler</code>) roda periodicamente verificando leads pendentes</li>
                        <li>Dispatcher (<code>followup-dispatcher</code>) envia mensagens respeitando horários, dias úteis e delays aleatórios</li>
                        <li>Respostas dos leads são processadas e status atualizado</li>
                      </ol>
                      <p><strong>Configurações:</strong> Max follow-ups, intervalo mínimo, horário de trabalho (start/end hour), dias da semana, delay aleatório (anti-spam).</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Commerce */}
                <AccordionItem value="mod-commerce" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Store} label="Loja WhatsApp (Commerce)" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Conceito:</strong> Loja virtual operada 100% pelo WhatsApp. O cliente conversa com a IA que mostra produtos, monta carrinho e processa pagamento.</p>
                      <p><strong>Módulos:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Catálogo:</strong> Produtos com variantes, imagens, categorias, SKU e controle de estoque</li>
                        <li><strong>Pedidos:</strong> Pipeline completo: pending → confirmed → shipped → delivered</li>
                        <li><strong>Pagamentos:</strong> PIX nativo + gateways de pagamento configuráveis</li>
                        <li><strong>IA de vendas:</strong> Edge function <code>commerce-ai</code> processa conversas e sugere produtos</li>
                        <li><strong>Analytics:</strong> Eventos de visualização, carrinho e conversão</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Financeiro */}
                <AccordionItem value="mod-financial" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Wallet} label="Financeiro IA" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Conceito:</strong> Controle financeiro pessoal/empresarial pelo WhatsApp. Usuário envia "gastei R$50 almoço" e a IA categoriza e registra.</p>
                      <p><strong>Fluxo:</strong> Mensagem WhatsApp → <code>financial-webhook</code> → <code>financial-ai</code> (categoriza com OpenAI) → salva em <code>financial_transactions</code>.</p>
                      <p><strong>Dashboard:</strong> Gráficos de receitas vs despesas, categorias, orçamentos mensais.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Live Chat */}
                <AccordionItem value="mod-livechat" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Radio} label="Chat ao Vivo" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Conceito:</strong> Painel para monitorar e intervir em conversas WhatsApp em tempo real.</p>
                      <p><strong>Funcionalidades:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Lista de sessões ativas com último status</li>
                        <li>Visualização do histórico de mensagens</li>
                        <li>Envio de mensagens manuais (takeover humano) via <code>live-chat-send</code></li>
                        <li>Realtime via Supabase Realtime subscriptions</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Calendar */}
                <AccordionItem value="mod-calendar" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm">
                    <SectionIcon icon={Calendar} label="Agendamento" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Conceito:</strong> Sistema de agendamentos integrado com agentes IA e Google Calendar.</p>
                      <p><strong>Fluxo:</strong> Cliente pede agendamento via WhatsApp → IA verifica horários disponíveis → cria na <code>appointments</code> → sincroniza com Google Calendar.</p>
                      <p><strong>Configuração:</strong> Horário de trabalho, duração dos slots, buffer entre consultas, dias da semana. Tudo em <code>calendar_settings</code>.</p>
                      <p><strong>Google Calendar:</strong> OAuth2 via <code>google-calendar-auth</code>. Tokens em <code>calendar_integrations</code>. Sync bidirecional com logs em <code>calendar_sync_logs</code>.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* 6. INTEGRAÇÕES */}
          <AccordionItem value="integrations" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Zap} label="6. Integrações Externas" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Evolution API</CardTitle>
                    <CardDescription>WhatsApp Business não-oficial</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>URL: <code>https://evolutionapi.clonefyia.com</code></p>
                    <p>API Key armazenada como constante na edge function. Cada instância gera sua própria apikey.</p>
                    <p>Webhooks configurados automaticamente ao criar instância.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">OpenAI API</CardTitle>
                    <CardDescription>Assistants API, GPT-4o, file_search, code_interpreter</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>API Key via env var <code>OPENAI_API_KEY</code> nas edge functions.</p>
                    <p>Modelos: gpt-4o (padrão), gpt-4o-mini, gpt-3.5-turbo.</p>
                    <p>Uso: Assistants API para agentes, Chat Completions para análise de leads e categorização financeira.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">ElevenLabs</CardTitle>
                    <CardDescription>Text-to-Speech para respostas por áudio</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>API Key configurável por conexão WhatsApp (campo <code>elevenLabsApiKey</code>).</p>
                    <p>Voice ID selecionável. Áudio gerado é enviado como mensagem de voz no WhatsApp.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Kiwify</CardTitle>
                    <CardDescription>Plataforma de vendas digitais</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Webhooks <code>purchase-webhook</code> e <code>kiwify-webhook</code> recebem notificações de compra.</p>
                    <p>Ao confirmar pagamento, libera acesso adicionando email à <code>authorized_emails</code>.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Google Calendar</CardTitle>
                    <CardDescription>Sincronização de agendamentos</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>OAuth2 flow via <code>google-calendar-auth</code>.</p>
                    <p>Tokens armazenados em <code>calendar_integrations</code> com refresh automático.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Agendify</CardTitle>
                    <CardDescription>Sistema externo de agendamentos</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Proxy via <code>agendify-proxy</code>. Config em <code>agendify_configs</code> (tenant_id, api_base_url).</p>
                    <p>Permite que agentes IA agendem diretamente no sistema Agendify do cliente.</p>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. FRONTEND */}
          <AccordionItem value="frontend" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Globe} label="7. Frontend" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Roteamento</h4>
                  <p className="text-sm text-muted-foreground">
                    React Router v6 com layout aninhado. <code>AppLayout</code> renderiza sidebar + Outlet para rotas protegidas. 
                    Rotas públicas (landing, auth, embed) ficam fora do layout.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lazy loading via <code>React.lazy()</code> + <code>Suspense</code> em todas as páginas internas para otimizar bundle size.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Internacionalização (i18n)</h4>
                  <p className="text-sm text-muted-foreground">
                    4 idiomas: Português, English, Español, Deutsch. Arquivos em <code>src/translations/</code>. 
                    Context <code>LanguageContext</code> com hook <code>useLanguage()</code>. Seletor no sidebar footer.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Temas</h4>
                  <p className="text-sm text-muted-foreground">
                    Dark/Light mode via <code>ThemeProvider</code> (next-themes). Toggle no sidebar footer. 
                    Tokens CSS em <code>index.css</code> com variáveis HSL.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Branding Customizável</h4>
                  <p className="text-sm text-muted-foreground">
                    <code>BrandingContext</code> carrega logos e nome da empresa. Página <code>/configuracoes/branding</code> permite upload de logos (claro, escuro, ícone) e alterar nome. 
                    Logos armazenados no Supabase Storage.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">State Management</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>TanStack Query</strong> para server state (cache de 10min, gc de 30min). 
                    <strong>React Context</strong> para auth, language, branding, theme. 
                    <strong>Local state</strong> (useState) para UI ephemeral. 
                    <strong>Performance cache</strong> (<code>utils/performance.ts</code>) para cache manual de dados frequentes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Componentes UI</h4>
                  <p className="text-sm text-muted-foreground">
                    Base: <strong>shadcn/ui</strong> (Radix primitives + Tailwind). Customizados: Cards, Badges, Accordions, Dialogs, Sheets, Tabs, Tooltips, etc. 
                    Charts: <strong>Recharts</strong>. Notificações: <strong>Sonner</strong> toasts.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 8. SEGURANÇA */}
          <AccordionItem value="security" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Shield} label="8. Segurança" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Row Level Security (RLS)</h4>
                  <p className="text-sm text-muted-foreground">
                    Todas as tabelas têm RLS habilitado. Padrão: <code>auth.uid() = user_id</code> para CRUD. 
                    Tabelas commerce usam join com <code>commerce_stores.user_id</code>. 
                    Admin tables usam <code>has_role()</code> function. 
                    <code>authorized_emails</code> tem SELECT público e ALL restrito ao admin UUID.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Edge Functions Auth</h4>
                  <p className="text-sm text-muted-foreground">
                    Functions que recebem webhooks externos (WhatsApp, Telegram, Kiwify, pagamentos) têm <code>verify_jwt = false</code> no <code>config.toml</code>. 
                    Demais functions requerem JWT válido no header Authorization.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Admin Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Verificação por email hardcoded (<code>personaldann@gmail.com</code>) no frontend. 
                    <code>RestrictedRoute</code> redireciona não-admins. 
                    Sidebar filtra itens <code>adminOnly</code>. 
                    Tabela <code>authorized_emails</code> tem policy vinculada ao UUID do admin.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Quotas & Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">
                    <code>user_quotas</code> limita recursos por usuário. Verificado no frontend via <code>useUserLimits</code> e no backend via <code>check-user-limits</code>. 
                    Prevents abuse de criação de assistentes/conexões.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Secrets</h4>
                  <p className="text-sm text-muted-foreground">
                    API keys sensíveis (OpenAI, Evolution global key) armazenadas como Supabase Secrets (env vars das edge functions). 
                    ElevenLabs API key armazenada por conexão na <code>n8n_fluxogpt</code>. 
                    Supabase anon key é pública (publishable) — segurança garantida por RLS.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 9. ENV VARS */}
          <AccordionItem value="envvars" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionIcon icon={Key} label="9. Variáveis de Ambiente" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Variáveis necessárias para o sistema funcionar:</p>
                
                <h4 className="font-semibold">Frontend (.env)</h4>
                <CodeBlock>{`VITE_SUPABASE_URL=https://ekfkrwueqwpqakpsrsjt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_publica>`}</CodeBlock>

                <h4 className="font-semibold">Edge Functions (Supabase Secrets)</h4>
                <CodeBlock>{`OPENAI_API_KEY=sk-...          # API key da OpenAI
SUPABASE_URL=https://...       # Auto-configurado pelo Supabase
SUPABASE_ANON_KEY=...          # Auto-configurado
SUPABASE_SERVICE_ROLE_KEY=...  # Auto-configurado
EVOLUTION_API_KEY=...          # Key global da Evolution API (hardcoded na function)
GOOGLE_CLIENT_ID=...           # Para OAuth Google Calendar
GOOGLE_CLIENT_SECRET=...       # Para OAuth Google Calendar`}</CodeBlock>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        <div className="mt-8 p-4 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            📄 Documentação gerada automaticamente — Última atualização: Março 2026
          </p>
        </div>
      </div>
    </main>
  );
};

export default TechnicalDocs;
