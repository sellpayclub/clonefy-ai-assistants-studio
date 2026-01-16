import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Search,
    Filter,
    MessageSquare,
    Phone,
    Mail,
    Clock,
    ArrowLeft,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Pause,
    Play,
    Trash2,
    ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AppSidebar from "@/components/AppSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";

interface Lead {
    id: string;
    name: string;
    whatsapp_number: string;
    email: string | null;
    status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost' | 'paused';
    current_step: number;
    lead_score: number;
    total_messages_sent: number;
    total_responses: number;
    last_message_at: string | null;
    last_response_at: string | null;
    created_at: string;
    campaign_id: string;
}

interface Campaign {
    id: string;
    name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    new: { label: 'Novo', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: <Clock className="h-3 w-3" /> },
    contacted: { label: 'Contatado', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', icon: <MessageSquare className="h-3 w-3" /> },
    interested: { label: 'Interessado', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', icon: <CheckCircle2 className="h-3 w-3" /> },
    converted: { label: 'Convertido', color: 'bg-green-500/20 text-green-600 border-green-500/30', icon: <CheckCircle2 className="h-3 w-3" /> },
    lost: { label: 'Perdido', color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: <XCircle className="h-3 w-3" /> },
    paused: { label: 'Pausado', color: 'bg-gray-500/20 text-gray-600 border-gray-500/30', icon: <Pause className="h-3 w-3" /> },
};

const FollowupLeadsList = () => {
    const [user, setUser] = useState<User | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCampaigns(session.user.id);
                fetchLeads(session.user.id);
            }
        };
        getSession();
    }, []);

    // Se tem campaign_id nos params, filtrar por ela
    useEffect(() => {
        if (params.id) {
            setSelectedCampaign(params.id);
        }
    }, [params.id]);

    const fetchCampaigns = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('followup_campaigns')
                .select('id, name')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar campanhas:', error);
        }
    };

    const fetchLeads = async (userId: string) => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('followup_leads')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar leads:', error);
            if (error.code !== '42P01') {
                toast({
                    title: "Erro ao carregar leads",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const updateLeadStatus = async (leadId: string, newStatus: string) => {
        try {
            const { error } = await (supabase as any)
                .from('followup_leads')
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;

            setLeads(prev => prev.map(lead =>
                lead.id === leadId ? { ...lead, status: newStatus as Lead['status'] } : lead
            ));

            toast({
                title: "Status atualizado",
                description: `Lead marcado como ${statusConfig[newStatus]?.label || newStatus}`,
            });
        } catch (error: any) {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const deleteLead = async (leadId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('followup_leads')
                .delete()
                .eq('id', leadId);

            if (error) throw error;

            setLeads(prev => prev.filter(lead => lead.id !== leadId));

            toast({
                title: "Lead removido",
                description: "O lead foi removido da campanha",
            });
        } catch (error: any) {
            toast({
                title: "Erro ao remover",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Filtrar leads
    const filteredLeads = leads.filter(lead => {
        const matchesCampaign = selectedCampaign === 'all' || lead.campaign_id === selectedCampaign;
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        const matchesSearch = !searchTerm ||
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.whatsapp_number.includes(searchTerm) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesCampaign && matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        total: filteredLeads.length,
        new: filteredLeads.filter(l => l.status === 'new').length,
        contacted: filteredLeads.filter(l => l.status === 'contacted').length,
        interested: filteredLeads.filter(l => l.status === 'interested').length,
        converted: filteredLeads.filter(l => l.status === 'converted').length,
    };

    if (!user) return null;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full">
                <AppSidebar />

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <SidebarTrigger />
                        <Button variant="ghost" size="icon" onClick={() => navigate('/followup')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Leads de Follow-up
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Gerencie todos os leads das suas campanhas
                            </p>
                        </div>
                        <Button onClick={() => navigate('/followup/import')}>
                            Importar Leads
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <Card className="bg-muted/30">
                            <CardContent className="p-3">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/10 border-blue-500/20">
                            <CardContent className="p-3">
                                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                                <p className="text-xs text-muted-foreground">Novos</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-500/10 border-yellow-500/20">
                            <CardContent className="p-3">
                                <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
                                <p className="text-xs text-muted-foreground">Contatados</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-500/10 border-purple-500/20">
                            <CardContent className="p-3">
                                <p className="text-2xl font-bold text-purple-600">{stats.interested}</p>
                                <p className="text-xs text-muted-foreground">Interessados</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-500/10 border-green-500/20">
                            <CardContent className="p-3">
                                <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                                <p className="text-xs text-muted-foreground">Convertidos</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome, WhatsApp ou email..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue placeholder="Campanha" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as campanhas</SelectItem>
                                        {campaigns.map((campaign) => (
                                            <SelectItem key={campaign.id} value={campaign.id}>
                                                {campaign.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os status</SelectItem>
                                        {Object.entries(statusConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leads List */}
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base">
                                {filteredLeads.length} leads encontrados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-sm text-muted-foreground">Carregando leads...</p>
                                </div>
                            ) : filteredLeads.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Nenhum lead encontrado</p>
                                    <p className="text-xs mt-1">Importe leads para começar</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredLeads.map((lead) => {
                                        const status = statusConfig[lead.status] || statusConfig.new;
                                        const campaignName = campaigns.find(c => c.id === lead.campaign_id)?.name || 'Campanha';

                                        return (
                                            <div
                                                key={lead.id}
                                                className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4"
                                            >
                                                {/* Avatar/Initial */}
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-semibold text-primary">
                                                        {lead.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium truncate">{lead.name}</p>
                                                        <Badge className={status.color} variant="outline">
                                                            {status.icon}
                                                            <span className="ml-1">{status.label}</span>
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {lead.whatsapp_number}
                                                        </span>
                                                        {lead.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {lead.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{campaignName}</p>
                                                </div>

                                                {/* Stats */}
                                                <div className="hidden md:flex items-center gap-6 text-sm text-center">
                                                    <div>
                                                        <p className="font-semibold">{lead.total_messages_sent || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Enviadas</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-green-600">{lead.total_responses || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Respostas</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{lead.current_step || 0}</p>
                                                        <p className="text-xs text-muted-foreground">Step</p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'interested')}>
                                                            <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500" />
                                                            Marcar como Interessado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'converted')}>
                                                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                                            Marcar como Convertido
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, 'lost')}>
                                                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                                            Marcar como Perdido
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, lead.status === 'paused' ? 'new' : 'paused')}>
                                                            {lead.status === 'paused' ? (
                                                                <>
                                                                    <Play className="h-4 w-4 mr-2 text-blue-500" />
                                                                    Retomar Follow-up
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Pause className="h-4 w-4 mr-2 text-yellow-500" />
                                                                    Pausar Follow-up
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => deleteLead(lead.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remover Lead
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>

            </div>
        </SidebarProvider>
    );
};

export default FollowupLeadsList;
