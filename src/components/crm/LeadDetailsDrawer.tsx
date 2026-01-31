import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Globe,
  Smartphone,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Target,
  Lightbulb,
  Clock,
  Tag,
  User,
  FileText,
  ArrowRight,
  Flame,
  Thermometer,
  Snowflake,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  Paperclip
} from "lucide-react";
import { LeadAttachmentsTab } from "./LeadAttachmentsTab";

interface Lead {
  id: string;
  name: string;
  whatsapp_number: string;
  email: string | null;
  lead_score: number;
  status: string;
  intent_summary: string | null;
  source: 'whatsapp' | 'widget' | null;
  last_interaction: string;
  created_at: string;
  // Novos campos
  conversation_analysis?: string | null;
  key_topics?: string[] | null;
  customer_questions?: string[] | null;
  objections?: string[] | null;
  products_mentioned?: string[] | null;
  urgency_level?: string | null;
  next_action?: string | null;
  sentiment?: string | null;
}

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDrawer({ lead, open, onOpenChange }: LeadDetailsDrawerProps) {
  if (!lead) return null;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return (
      <Badge className="bg-red-500 hover:bg-red-600 gap-1">
        <Flame className="h-3 w-3" /> Quente ({score})
      </Badge>
    );
    if (score >= 40) return (
      <Badge className="bg-orange-400 hover:bg-orange-500 gap-1">
        <Thermometer className="h-3 w-3" /> Morno ({score})
      </Badge>
    );
    return (
      <Badge className="bg-blue-400 hover:bg-blue-500 gap-1">
        <Snowflake className="h-3 w-3" /> Frio ({score})
      </Badge>
    );
  };

  const getSourceBadge = (source: string | null) => {
    if (source === 'widget') {
      return (
        <Badge variant="outline" className="gap-1 border-purple-500/50 text-purple-600">
          <Globe className="h-3 w-3" /> Site
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 border-green-500/50 text-green-600">
        <Smartphone className="h-3 w-3" /> WhatsApp
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string | null) => {
    const config: Record<string, { color: string; label: string }> = {
      'imediata': { color: 'bg-red-500', label: '🚨 Imediata' },
      'alta': { color: 'bg-orange-500', label: '⚡ Alta' },
      'média': { color: 'bg-yellow-500', label: '⏳ Média' },
      'baixa': { color: 'bg-blue-400', label: '📅 Baixa' }
    };
    const { color, label } = config[urgency || 'baixa'] || config['baixa'];
    return <Badge className={`${color} hover:${color}`}>{label}</Badge>;
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positivo':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negativo':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case 'misto':
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentLabel = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positivo': return 'Positivo';
      case 'negativo': return 'Negativo';
      case 'misto': return 'Misto';
      default: return 'Neutro';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
              <span className="text-primary font-bold text-xl">
                {lead.name ? lead.name[0].toUpperCase() : '#'}
              </span>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl mb-2">{lead.name || 'Lead Desconhecido'}</SheetTitle>
              <div className="flex flex-wrap gap-2">
                {getScoreBadge(lead.lead_score)}
                {getSourceBadge(lead.source)}
                {getUrgencyBadge(lead.urgency_level)}
                <Badge variant="outline" className="uppercase text-[10px] font-bold">
                  {lead.status}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col h-[calc(100vh-140px)]">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
            <TabsTrigger value="overview" className="gap-2">
              <User className="h-4 w-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <FileText className="h-4 w-4" /> Análise IA
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="h-4 w-4" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Target className="h-4 w-4" /> Detalhes
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Aba Visão Geral */}
            <TabsContent value="overview" className="p-6 m-0 space-y-6">
              {/* Resumo de Intenção */}
              {lead.intent_summary && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary">
                      <Lightbulb className="h-4 w-4" /> Resumo da Intenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{lead.intent_summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Contato */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Informações de Contato
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">WhatsApp / ID</p>
                      <p className="font-medium">{lead.whatsapp_number}</p>
                    </div>
                    <a
                      href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '').replace('widget_', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Abrir
                      </Button>
                    </a>
                  </div>

                  {lead.email && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{lead.email}</p>
                      </div>
                      <a href={`mailto:${lead.email}`}>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          Enviar
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Próxima Ação */}
              {lead.next_action && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                      <ArrowRight className="h-4 w-4" /> Próxima Ação Recomendada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{lead.next_action}</p>
                  </CardContent>
                </Card>
              )}

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{lead.lead_score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </Card>

                <Card className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getSentimentIcon(lead.sentiment)}
                    <span className="text-sm font-medium">{getSentimentLabel(lead.sentiment)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sentimento</p>
                </Card>

                <Card className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{lead.urgency_level || 'baixa'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Urgência</p>
                </Card>
              </div>

              {/* Datas */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Criado: {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Última interação: {new Date(lead.last_interaction).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Aba Análise IA */}
            <TabsContent value="analysis" className="p-6 m-0 space-y-6">
              {/* Análise Completa */}
              {lead.conversation_analysis ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Análise Completa da Conversa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {lead.conversation_analysis}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      A análise detalhada será gerada automaticamente após mais interações com o lead.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tópicos Discutidos */}
              {lead.key_topics && lead.key_topics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Tópicos Discutidos
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.key_topics.map((topic, i) => (
                      <Badge key={i} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Perguntas do Cliente */}
              {lead.customer_questions && lead.customer_questions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-500" /> Perguntas do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lead.customer_questions.map((question, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{question}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Objeções */}
              {lead.objections && lead.objections.length > 0 && (
                <Card className="border-orange-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" /> Objeções Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lead.objections.map((objection, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 font-bold">!</span>
                        <span>{objection}</span>
                      </div>
                    ))}
                  </CardContent>
              </Card>
            )}
            </TabsContent>

            {/* Aba Documentos */}
            <TabsContent value="attachments" className="m-0">
              <LeadAttachmentsTab leadId={lead.id} />
            </TabsContent>

            {/* Aba Detalhes */}
            <TabsContent value="details" className="p-6 m-0 space-y-6">
              {/* Produtos Mencionados */}
              {lead.products_mentioned && lead.products_mentioned.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" /> Produtos/Serviços de Interesse
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.products_mentioned.map((product, i) => (
                      <Badge key={i} variant="outline" className="border-primary/50">{product}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Informações do Lead */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" /> Informações Completas
                </h4>

                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">ID do Lead</span>
                    <span className="text-sm font-mono">{lead.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Fonte</span>
                    <span className="text-sm capitalize">{lead.source || 'whatsapp'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline">{lead.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Lead Score</span>
                    <span className="text-sm font-bold">{lead.lead_score}/100</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Urgência</span>
                    <span className="text-sm capitalize">{lead.urgency_level || 'baixa'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Sentimento</span>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(lead.sentiment)}
                      <span className="text-sm">{getSentimentLabel(lead.sentiment)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Primeira Interação</span>
                    <span className="text-sm">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
