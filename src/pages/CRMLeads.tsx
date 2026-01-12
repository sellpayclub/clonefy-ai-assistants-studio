import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter, MessageSquare, Phone, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SupportChatWidget from "@/components/SupportChatWidget";
import { useToast } from "@/hooks/use-toast";

interface Lead {
    id: string;
    name: string;
    whatsapp_number: string;
    email: string | null;
    lead_score: number;
    status: string;
    intent_summary: string | null;
    last_interaction: string;
    created_at: string;
}

const CRMLeads = () => {
    const [user, setUser] = useState<User | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { t } = useLanguage();
    const { toast } = useToast();

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
        lead.intent_summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getScoreBadge = (score: number) => {
        if (score >= 80) return <Badge className="bg-red-500 hover:bg-red-600">🔥 Quente ({score})</Badge>;
        if (score >= 40) return <Badge className="bg-orange-400 hover:bg-orange-500">⛅ Morno ({score})</Badge>;
        return <Badge className="bg-blue-400 hover:bg-blue-500">❄️ Frio ({score})</Badge>;
    };

    if (!user && !loading) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />

                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
                    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold">CRM Leads</h1>
                                <p className="text-muted-foreground text-sm">
                                    Gestão inteligente de contatos extraídos via IA
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Seus Leads
                                    </CardTitle>
                                    <div className="flex flex-1 max-w-md items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nome, número ou interesse..."
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
                                            Os leads aparecerão aqui automaticamente conforme seus agentes conversarem com os clientes no WhatsApp.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {filteredLeads.map((lead) => (
                                            <div key={lead.id} className="p-4 hover:bg-muted/30 transition-colors group relative overflow-hidden">
                                                <div className="flex flex-col md:flex-row md:items-center gap-4 relative z-10">
                                                    {/* Avatar/Initials */}
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                        <span className="text-primary font-bold text-lg">
                                                            {lead.name ? lead.name[0].toUpperCase() : '#'}
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-foreground">{lead.name || 'Desconhecido'}</h4>
                                                            {getScoreBadge(lead.lead_score)}
                                                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight px-1.5 py-0">
                                                                {lead.status}
                                                            </Badge>
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

                                                        {lead.intent_summary && (
                                                            <p className="text-xs text-muted-foreground/80 line-clamp-1 italic mt-1 max-w-2xl">
                                                                "{lead.intent_summary}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50">
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                            Conversa
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

                <SupportChatWidget />
            </div>
        </SidebarProvider>
    );
};

export default CRMLeads;
