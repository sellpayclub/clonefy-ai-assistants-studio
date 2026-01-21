import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter, MessageSquare, Phone, Mail, Calendar, Globe, Smartphone, Flame, Thermometer, Snowflake, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { LeadDetailsDrawer } from "@/components/crm/LeadDetailsDrawer";

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
    // Novos campos de análise
    conversation_analysis?: string | null;
    key_topics?: string[] | null;
    customer_questions?: string[] | null;
    objections?: string[] | null;
    products_mentioned?: string[] | null;
    urgency_level?: string | null;
    next_action?: string | null;
    sentiment?: string | null;
}

const CRMLeads = () => {
    const [user, setUser] = useState<User | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { t } = useLanguage();
    const { toast } = useToast();

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsDrawerOpen(true);
    };

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchLeads(session.user.id);
            }
        };
        getSession();
    }, []);

    const fetchLeads = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('crm_leads')
                .select('*')
                .eq('user_id', userId)
                .order('last_interaction', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar leads:', error);
            toast({
                title: "Erro ao buscar leads",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.whatsapp_number?.includes(searchTerm) ||
        lead.intent_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.key_topics?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getScoreBadge = (score: number) => {
        if (score >= 80) return (
            <Badge className="bg-red-500 hover:bg-red-600 gap-1 text-xs">
                <Flame className="h-3 w-3" /> Quente ({score})
            </Badge>
        );
        if (score >= 40) return (
            <Badge className="bg-orange-400 hover:bg-orange-500 gap-1 text-xs">
                <Thermometer className="h-3 w-3" /> Morno ({score})
            </Badge>
        );
        return (
            <Badge className="bg-blue-400 hover:bg-blue-500 gap-1 text-xs">
                <Snowflake className="h-3 w-3" /> Frio ({score})
            </Badge>
        );
    };

    const getSourceBadge = (source: string | null) => {
        if (source === 'widget') {
            return (
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-purple-500/50 text-purple-600">
                    <Globe className="h-2.5 w-2.5" />
                    Site
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0 gap-1 border-green-500/50 text-green-600">
                <Smartphone className="h-2.5 w-2.5" />
                WhatsApp
            </Badge>
        );
    };

    const getUrgencyIndicator = (urgency: string | null) => {
        const config: Record<string, string> = {
            'imediata': '🚨',
            'alta': '⚡',
            'média': '⏳',
            'baixa': ''
        };
        return config[urgency || 'baixa'] || '';
    };

    if (!user && !loading) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />

                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
                    {/* Header com imagem da empresa */}
                    <div className="mb-6">
                        <div className="relative w-full h-32 sm:h-40 md:h-48 rounded-xl overflow-hidden mb-4">
                            <img
                                src="/clonefy-office.jpg"
                                alt="Escritório Clonefy"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                                <div className="p-4 sm:p-6">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">CRM Leads</h1>
                                    <p className="text-white/80 text-sm sm:text-base">
                                        Gestão inteligente de contatos com análise detalhada via IA
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Seus Leads
                                        <Badge variant="secondary" className="ml-2">{leads.length}</Badge>
                                    </CardTitle>
                                    <div className="flex flex-1 max-w-md items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nome, número, interesse ou tópico..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 bg-background/50"
                                            />
                                        </div>
                                        <Button variant="outline" size="icon">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p className="text-muted-foreground text-sm font-medium animate-pulse">
                                            Processando inteligência de leads...
                                        </p>
                                    </div>
                                ) : filteredLeads.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">Nenhum lead encontrado</h3>
                                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                            Os leads aparecerão aqui automaticamente conforme seus agentes conversarem com os clientes no WhatsApp ou no Chat do Site.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {filteredLeads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="p-4 hover:bg-muted/30 transition-colors group relative overflow-hidden cursor-pointer"
                                                onClick={() => handleLeadClick(lead)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLeadClick(lead)}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                                                    {/* Avatar/Initials */}
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                        <span className="text-primary font-bold text-lg">
                                                            {lead.name ? lead.name[0].toUpperCase() : '#'}
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-foreground">
                                                                {getUrgencyIndicator(lead.urgency_level)} {lead.name || 'Desconhecido'}
                                                            </h4>
                                                            {getScoreBadge(lead.lead_score)}
                                                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0">
                                                                {lead.status}
                                                            </Badge>
                                                            {getSourceBadge(lead.source)}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="h-3 w-3" />
                                                                {lead.whatsapp_number}
                                                            </div>
                                                            {lead.email && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <Mail className="h-3 w-3" />
                                                                    {lead.email}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(lead.last_interaction).toLocaleDateString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Resumo e Próxima Ação */}
                                                        <div className="space-y-1">
                                                            {lead.intent_summary && (
                                                                <p className="text-xs text-muted-foreground/80 line-clamp-1 italic max-w-2xl">
                                                                    "{lead.intent_summary}"
                                                                </p>
                                                            )}
                                                            {lead.next_action && (
                                                                <p className="text-xs text-green-600 flex items-center gap-1">
                                                                    <ArrowRight className="h-3 w-3" />
                                                                    <span className="line-clamp-1">{lead.next_action}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Tópicos */}
                                                        {lead.key_topics && lead.key_topics.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {lead.key_topics.slice(0, 4).map((topic, i) => (
                                                                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                        {topic}
                                                                    </Badge>
                                                                ))}
                                                                {lead.key_topics.length > 4 && (
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                        +{lead.key_topics.length - 4}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50">
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                            Ver Detalhes
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Status Bar */}
                                                <div className="absolute left-0 bottom-0 top-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>

                {/* Drawer de Detalhes do Lead */}
                <LeadDetailsDrawer
                    lead={selectedLead}
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                />
            </div>
        </SidebarProvider>
    );
};

export default CRMLeads;
