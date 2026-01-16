import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Megaphone,
    Users,
    MessageSquare,
    TrendingUp,
    Plus,
    Play,
    Pause,
    BarChart3,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    Upload,
    Zap
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    total_leads: number;
    total_messages_sent: number;
    total_responses: number;
    total_conversions: number;
    created_at: string;
}

interface DashboardStats {
    totalCampaigns: number;
    activeCampaigns: number;
    totalLeads: number;
    totalMessagesSent: number;
    totalResponses: number;
    totalConversions: number;
    responseRate: number;
    conversionRate: number;
}

const FollowupDashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalLeads: 0,
        totalMessagesSent: 0,
        totalResponses: 0,
        totalConversions: 0,
        responseRate: 0,
        conversionRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchData(session.user.id);
            }
        };
        getSession();
    }, []);

    const fetchData = async (userId: string) => {
        try {
            setLoading(true);

            // Fetch campaigns
            const { data: campaignsData, error: campaignsError } = await (supabase as any)
                .from('followup_campaigns')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (campaignsError) throw campaignsError;

            setCampaigns(campaignsData || []);

            // Calculate stats
            const campaigns = campaignsData || [];
            const totalLeads = campaigns.reduce((sum: number, c: Campaign) => sum + (c.total_leads || 0), 0);
            const totalMessages = campaigns.reduce((sum: number, c: Campaign) => sum + (c.total_messages_sent || 0), 0);
            const totalResponses = campaigns.reduce((sum: number, c: Campaign) => sum + (c.total_responses || 0), 0);
            const totalConversions = campaigns.reduce((sum: number, c: Campaign) => sum + (c.total_conversions || 0), 0);

            setStats({
                totalCampaigns: campaigns.length,
                activeCampaigns: campaigns.filter((c: Campaign) => c.status === 'active').length,
                totalLeads,
                totalMessagesSent: totalMessages,
                totalResponses,
                totalConversions,
                responseRate: totalMessages > 0 ? Math.round((totalResponses / totalMessages) * 100) : 0,
                conversionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0,
            });

        } catch (error: any) {
            console.error('Erro ao buscar dados:', error);
            // Se tabela não existe ainda, mostrar estado vazio
            if (error.code === '42P01') {
                setCampaigns([]);
            } else {
                toast({
                    title: "Erro ao carregar dados",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">🟢 Ativa</Badge>;
            case 'paused':
                return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">⏸️ Pausada</Badge>;
            case 'completed':
                return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">✅ Concluída</Badge>;
            default:
                return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">📝 Rascunho</Badge>;
        }
    };

    if (!user && !loading) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {/* Header */}
                    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Megaphone className="h-6 w-6 text-primary" />
                                    Follow-up Automático
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Campanhas de follow-up inteligente com IA
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/followup/campaigns/new')}
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Campanha
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.activeCampaigns}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Play className="h-5 w-5 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total de Leads</p>
                                        <p className="text-2xl font-bold text-purple-600">{stats.totalLeads}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-purple-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.responseRate}%</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5 text-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Conversões</p>
                                        <p className="text-2xl font-bold text-orange-600">{stats.totalConversions}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-orange-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Campaigns List or Empty State */}
                    {loading ? (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground text-sm">Carregando campanhas...</p>
                            </CardContent>
                        </Card>
                    ) : campaigns.length === 0 ? (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
                                    <Megaphone className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Nenhuma campanha ainda</h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                                    Crie sua primeira campanha de follow-up e deixe a IA fazer os disparos automáticos para seus leads.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button
                                        onClick={() => navigate('/followup/campaigns/new')}
                                        className="bg-gradient-to-r from-primary to-primary/80"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar Campanha
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/followup/import')}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Importar Leads
                                    </Button>
                                </div>

                                {/* Features Preview */}
                                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                                            <Upload className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <h4 className="font-medium text-sm mb-1">Import de Leads</h4>
                                        <p className="text-xs text-muted-foreground">Upload CSV ou cadastro manual de contatos</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                                            <Zap className="h-4 w-4 text-green-500" />
                                        </div>
                                        <h4 className="font-medium text-sm mb-1">IA Especializada</h4>
                                        <p className="text-xs text-muted-foreground">Criada automaticamente para seu negócio</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                                            <Clock className="h-4 w-4 text-purple-500" />
                                        </div>
                                        <h4 className="font-medium text-sm mb-1">Disparos Agendados</h4>
                                        <p className="text-xs text-muted-foreground">Controle de horários e anti-spam</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Suas Campanhas
                                    </CardTitle>
                                    <Badge variant="secondary">{campaigns.length} campanhas</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/40">
                                    {campaigns.map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/followup/campaigns/${campaign.id}`)}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                {/* Campaign Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold">{campaign.name}</h4>
                                                        {getStatusBadge(campaign.status)}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-center">
                                                        <p className="font-semibold">{campaign.total_leads || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Leads</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-semibold">{campaign.total_messages_sent || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Enviadas</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-semibold text-green-600">{campaign.total_responses || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Respostas</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-semibold text-orange-600">{campaign.total_conversions || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Conversões</p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </main>

            </div>
        </SidebarProvider>
    );
};

export default FollowupDashboard;
