import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Bug, Wrench, Star } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  badge: "novo" | "melhoria" | "correção" | "destaque";
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "v2.8",
    date: "26 de março de 2025",
    badge: "novo",
    items: [
      "🤖 IA nos Grupos de WhatsApp — ative o webhook e sua IA responde automaticamente nos grupos",
      "⚡ Botão toggle Ativar/Desativar Webhook de Grupos com explicação contextual",
      "📝 Notas do CRM agora podem ser editadas e excluídas diretamente no drawer do lead",
      "🔒 Financeiro IA e Gestão de Grupos agora são exclusivos para administradores",
      "💬 Seção 'Conversas' renomeada para 'Testar Agente' — mais claro para o uso atual",
      "⏱️ Follow-up Automático — ative por conexão e defina o tempo de inatividade para disparo automático de 1 mensagem de reengajamento",
    ],
  },
  {
    version: "v2.7",
    date: "20 de março de 2025",
    badge: "destaque",
    items: [
      "📺 Chat ao Vivo lançado — monitore e intervenha em conversas em tempo real",
      "🗂️ CRM com edição inline dos dados do lead diretamente no drawer, sem abrir formulário separado",
      "🏷️ Pipeline Kanban do CRM com drag & drop entre estágios",
      "📎 Anexos de lead no CRM com preview de imagens e documentos",
    ],
  },
  {
    version: "v2.6",
    date: "10 de março de 2025",
    badge: "melhoria",
    items: [
      "⚡ Performance global melhorada — carregamento de páginas até 40% mais rápido",
      "🔔 Sistema de notificações toast redesenhado",
      "🌐 Suporte completo a Espanhol, Inglês, Português e Alemão",
      "📊 Analytics do Chat Flutuante com gráficos de engajamento por período",
    ],
  },
  {
    version: "v2.5",
    date: "28 de fevereiro de 2025",
    badge: "novo",
    items: [
      "🤖 Follow-up IA — campanhas automatizadas com sequência de mensagens inteligente",
      "📥 Importação de leads em massa via CSV para campanhas de follow-up",
      "🎯 Lead scoring automático via IA nas conversas do WhatsApp",
      "🗓️ Integração com Google Calendar para agendamentos automáticos",
    ],
  },
  {
    version: "v2.4",
    date: "15 de fevereiro de 2025",
    badge: "melhoria",
    items: [
      "🛍️ Loja WhatsApp — venda produtos via WhatsApp com IA de vendas integrada",
      "💳 Suporte a pagamento via PIX e cartão na Loja WhatsApp",
      "📦 Gestão de pedidos e estoque em tempo real",
      "🎨 Chat Flutuante totalmente personalizável com preview ao vivo",
    ],
  },
  {
    version: "v2.3",
    date: "1 de fevereiro de 2025",
    badge: "correção",
    items: [
      "🔧 Corrigido problema de QR Code do WhatsApp que expirava sem aviso",
      "🔧 Resolvido bug de mensagens duplicadas no webhook do WhatsApp",
      "🔧 CRM: Correção na extração de nome do contato via IA",
      "🔧 Widget: Corrigido estilo do chat em modo dark em navegadores Safari",
    ],
  },
  {
    version: "v2.2",
    date: "20 de janeiro de 2025",
    badge: "novo",
    items: [
      "🤖 Múltiplos Agentes de IA com instruções e personalidades independentes",
      "📁 Upload de arquivos de conhecimento (PDF, DOCX) para cada agente",
      "🖼️ Upload de imagens e mídia para os agentes enviarem nas conversas",
      "📱 Integração com Telegram — conecte bots ao seu agente de IA",
    ],
  },
  {
    version: "v2.1",
    date: "10 de janeiro de 2025",
    badge: "destaque",
    items: [
      "🚀 Plataforma lançada com conexão WhatsApp via Evolution API",
      "🤖 Primeiro Agente de IA conectado ao WhatsApp",
      "📊 Dashboard com estatísticas de conversas e mensagens",
      "🔐 Autenticação segura com Supabase",
    ],
  },
];

const badgeConfig = {
  novo: { label: "Novo", className: "bg-primary text-primary-foreground", icon: Sparkles },
  melhoria: { label: "Melhoria", className: "bg-blue-500/20 text-blue-600 border-blue-500/30", icon: Zap },
  correção: { label: "Correção", className: "bg-orange-500/20 text-orange-600 border-orange-500/30", icon: Wrench },
  destaque: { label: "Destaque", className: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", icon: Star },
};

const Changelog = () => {
  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Novidades & Atualizações
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe todas as melhorias e novidades da plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-10">
              {changelog.map((entry, idx) => {
                const config = badgeConfig[entry.badge];
                const Icon = config.icon;
                return (
                  <div key={entry.version} className="relative pl-8">
                    {/* Dot */}
                    <div
                      className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background ${idx === 0 ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-primary-foreground" : "bg-muted-foreground"}`} />
                    </div>

                    {/* Card */}
                    <div className={`rounded-xl border p-5 space-y-3 ${idx === 0 ? "border-primary/30 bg-primary/5 shadow-sm" : "bg-card"}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{entry.version}</span>
                          <Badge className={`text-xs ${config.className}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {idx === 0 && (
                            <Badge className="text-xs bg-primary/20 text-primary border-primary/30 animate-pulse">
                              Mais recente
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{entry.date}</span>
                      </div>

                      {/* Items */}
                      <ul className="space-y-2">
                        {entry.items.map((item, i) => (
                          <li key={i} className="text-sm text-foreground/90 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-muted-foreground">
            Plataforma em constante evolução. Novas atualizações toda semana! 🚀
          </div>
        </div>
      </div>
    </main>
  );
};

export default Changelog;
