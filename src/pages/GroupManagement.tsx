import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Users,
    MessageSquare,
    Bell,
    FileText,
    Plus,
    Search,
    Settings,
    Clock,
    TrendingUp,
    AlertTriangle,
    RefreshCw,
    Loader2,
    QrCode,
    Wifi,
    WifiOff,
    Zap
} from "lucide-react";

interface WhatsAppGroup {
    id: string;
    group_name: string;
    group_jid: string;
    instance_name: string;
    is_active: boolean;
    keywords: string[];
    report_time: string;
    report_enabled: boolean;
    alerts_enabled: boolean;
    total_messages: number;
    last_message_at: string | null;
    last_report_at: string | null;
}

interface GroupReport {
    id: string;
    report_date: string;
    content: string;
    topics: string[];
    active_participants: string[];
    message_count: number;
    was_sent: boolean;
}

interface GroupAlert {
    id: string;
    keyword: string;
    message_content: string;
    sender_name: string;
    triggered_at: string;
    was_sent: boolean;
}

const GroupManagement = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null);
    const [reports, setReports] = useState<GroupReport[]>([]);
    const [alerts, setAlerts] = useState<GroupAlert[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [newKeywords, setNewKeywords] = useState("");
    const [newReportTime, setNewReportTime] = useState("18:00");

    // WhatsApp Connection State (isolated)
    const [userId, setUserId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingConnection, setLoadingConnection] = useState(false);
    const [configuringWebhook, setConfiguringWebhook] = useState(false);
    const [webhookActive, setWebhookActive] = useState(false);

    // Verificar autenticação
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }
            setUserId(user.id);
            loadGroups();
            checkConnectionStatus(user.id);
        };
        checkAuth();
    }, [navigate]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('whatsapp_groups')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGroups((data || []) as WhatsAppGroup[]);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os grupos.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Verificar status de conexão
    const checkConnectionStatus = async (uid?: string) => {
        const currentUserId = uid || userId;
        if (!currentUserId) return;

        try {
            const { data } = await supabase.functions.invoke('group-connection', {
                body: { action: 'check_status', user_id: currentUserId }
            });

            if (data?.connected) {
                setConnectionStatus('connected');
                setQrCode(null);
            } else {
                setConnectionStatus('disconnected');
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    };

    // Conectar WhatsApp (gerar QR)
    const connectWhatsApp = async () => {
        if (!userId) return;

        setLoadingConnection(true);
        setConnectionStatus('connecting');

        try {
            const { data, error } = await supabase.functions.invoke('group-connection', {
                body: { action: 'get_qr', user_id: userId }
            });

            if (error) throw error;

            if (data?.qr_code) {
                setQrCode(data.qr_code);
                // Iniciar polling para verificar conexão
                const pollInterval = setInterval(async () => {
                    const { data: statusData } = await supabase.functions.invoke('group-connection', {
                        body: { action: 'check_status', user_id: userId }
                    });

                    if (statusData?.connected) {
                        clearInterval(pollInterval);
                        setConnectionStatus('connected');
                        setQrCode(null);
                        toast({ title: "WhatsApp conectado! ✅" });
                        loadAvailableGroups();
                    }
                }, 3000);

                // Limpar polling após 2 minutos
                setTimeout(() => clearInterval(pollInterval), 120000);
            }
        } catch (error) {
            console.error('Erro ao conectar:', error);
            toast({
                title: "Erro ao conectar",
                description: "Tente novamente.",
                variant: "destructive"
            });
            setConnectionStatus('disconnected');
        } finally {
            setLoadingConnection(false);
        }
    };

    const configureWebhook = async () => {
        if (!userId) return;
        setConfiguringWebhook(true);
        try {
            const { data, error } = await supabase.functions.invoke('group-connection', {
                body: { action: 'configure_webhook', user_id: userId }
            });
            if (error) throw error;
            toast({
                title: "Webhook configurado! ✅",
                description: "Grupos e mensagens serão monitorados automaticamente."
            });
        } catch (error) {
            console.error('Erro ao configurar webhook:', error);
            toast({
                title: "Erro ao configurar webhook",
                description: "Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setConfiguringWebhook(false);
        }
    };

    const loadGroupDetails = async (group: WhatsAppGroup) => {
        setSelectedGroup(group);

        // Carregar relatórios
        const { data: reportsData } = await (supabase as any)
            .from('group_reports')
            .select('*')
            .eq('group_id', group.id)
            .order('report_date', { ascending: false })
            .limit(10);

        setReports((reportsData || []) as GroupReport[]);

        // Carregar alertas
        const { data: alertsData } = await (supabase as any)
            .from('group_alerts')
            .select('*')
            .eq('group_id', group.id)
            .order('triggered_at', { ascending: false })
            .limit(20);

        setAlerts((alertsData || []) as GroupAlert[]);
    };

    const loadAvailableGroups = async () => {
        setLoadingAvailable(true);
        try {
            // Buscar instâncias do usuário
            const { data: { user } } = await supabase.auth.getUser();
            const { data: instances } = await (supabase as any)
                .from('n8n_fluxogpt')
                .select('nomeinstancia')
                .eq('userId', user?.id);

            if (!instances?.length) {
                toast({
                    title: "Nenhuma instância",
                    description: "Conecte primeiro uma instância de WhatsApp.",
                    variant: "destructive"
                });
                return;
            }

            // Para cada instância, buscar grupos disponíveis
            const allGroups: any[] = [];
            for (const instance of instances) {
                const { data } = await supabase.functions.invoke('group-manager', {
                    body: {
                        action: 'list_available_groups',
                        instance_name: instance.nomeinstancia
                    }
                });

                if (data?.groups) {
                    allGroups.push(...data.groups.map((g: any) => ({
                        ...g,
                        instance_name: instance.nomeinstancia
                    })));
                }
            }

            setAvailableGroups(allGroups);
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            toast({
                title: "Erro",
                description: "Não foi possível buscar grupos disponíveis.",
                variant: "destructive"
            });
        } finally {
            setLoadingAvailable(false);
        }
    };

    const addGroup = async (group: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.functions.invoke('group-manager', {
                body: {
                    action: 'add_group',
                    user_id: user?.id,
                    instance_name: group.instance_name,
                    group_jid: group.id,
                    group_name: group.subject || group.name,
                    keywords: newKeywords.split(',').map(k => k.trim()).filter(k => k),
                    report_time: newReportTime
                }
            });

            if (error) throw error;

            toast({
                title: "Grupo adicionado!",
                description: `${group.subject || group.name} está sendo monitorado.`
            });

            setShowAddDialog(false);
            loadGroups();
        } catch (error) {
            console.error('Erro ao adicionar grupo:', error);
            toast({
                title: "Erro",
                description: "Não foi possível adicionar o grupo.",
                variant: "destructive"
            });
        }
    };

    const toggleGroupSetting = async (groupId: string, field: string, value: boolean) => {
        try {
            await (supabase as any)
                .from('whatsapp_groups')
                .update({ [field]: value })
                .eq('id', groupId);

            setGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, [field]: value } : g
            ));

            if (selectedGroup?.id === groupId) {
                setSelectedGroup(prev => prev ? { ...prev, [field]: value } : null);
            }
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data } = await supabase.functions.invoke('group-manager', {
                body: {
                    action: 'search',
                    user_id: user?.id,
                    query: searchQuery,
                    group_id: selectedGroup?.id
                }
            });

            setSearchResults(data);
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            toast({
                title: "Erro",
                description: "Não foi possível realizar a pesquisa.",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Users className="h-6 w-6 text-primary" />
                                    Gerenciamento de Grupos
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Monitore grupos, receba alertas e relatórios diários automáticos
                                </p>
                            </div>
                            <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 animate-pulse">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                BETA - EM FASE DE TESTES
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadGroups}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Atualizar
                            </Button>
                                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                        <DialogTrigger asChild>
                                            <Button onClick={loadAvailableGroups}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Grupo
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Adicionar Grupo para Monitoramento</DialogTitle>
                                                <DialogDescription>
                                                    Selecione um grupo do WhatsApp para monitorar
                                                </DialogDescription>
                                            </DialogHeader>

                                            {loadingAvailable ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid gap-2">
                                                        <Label>Palavras-chave para alertas (separadas por vírgula)</Label>
                                                        <Input
                                                            placeholder="urgente, problema, reclamação"
                                                            value={newKeywords}
                                                            onChange={(e) => setNewKeywords(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label>Horário do relatório diário</Label>
                                                        <Input
                                                            type="time"
                                                            value={newReportTime}
                                                            onChange={(e) => setNewReportTime(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid gap-2 mt-4">
                                                        <Label>Grupos disponíveis</Label>
                                                        {availableGroups.length === 0 ? (
                                                            <p className="text-muted-foreground text-sm">
                                                                Nenhum grupo encontrado. Verifique suas instâncias.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {availableGroups.map((group) => (
                                                                    <Card
                                                                        key={group.id}
                                                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                                        onClick={() => addGroup(group)}
                                                                    >
                                                                        <CardContent className="p-3 flex items-center justify-between">
                                                                            <div>
                                                                                <p className="font-medium">{group.subject || group.name}</p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {group.instance_name} • {group.size || 0} participantes
                                                                                </p>
                                                                            </div>
                                                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    <div className="container mx-auto px-4 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* WhatsApp Connection + Lista de Grupos */}
                            <div className="lg:col-span-1 space-y-4">
                                {/* Card de Conexão WhatsApp */}
                                <Card className={connectionStatus === 'connected' ? 'border-primary/50 bg-primary/5' : ''}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {connectionStatus === 'connected' ? (
                                                <Wifi className="h-5 w-5 text-primary" />
                                            ) : (
                                                <WifiOff className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            Conexão WhatsApp
                                        </CardTitle>
                                        <CardDescription>
                                            Conexão exclusiva para monitoramento de grupos
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {connectionStatus === 'connected' ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-primary">Conectado</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        Pronto para monitorar grupos
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={configureWebhook}
                                                    disabled={configuringWebhook}
                                                >
                                                    {configuringWebhook ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Zap className="h-4 w-4 mr-2" />
                                                    )}
                                                    Ativar Webhook do Grupo
                                                </Button>
                                            </div>
                                        ) : qrCode ? (
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Escaneie o QR Code com seu WhatsApp
                                                </p>
                                                <div className="bg-white p-4 rounded-lg inline-block">
                                                    <img
                                                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                        alt="QR Code WhatsApp"
                                                        className="w-48 h-48 mx-auto"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-3">
                                                    Aguardando conexão...
                                                </p>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={connectWhatsApp}
                                                disabled={loadingConnection}
                                                className="w-full"
                                            >
                                                {loadingConnection ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <QrCode className="h-4 w-4 mr-2" />
                                                )}
                                                Conectar WhatsApp
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Lista de Grupos */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Grupos Monitorados</CardTitle>
                                        <CardDescription>
                                            {groups.length} grupo(s) ativo(s)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {loading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : groups.length === 0 ? (
                                            <p className="text-muted-foreground text-center py-8">
                                                Nenhum grupo monitorado ainda
                                            </p>
                                        ) : (
                                            groups.map((group) => (
                                                <Card
                                                    key={group.id}
                                                    className={`cursor-pointer transition-colors ${selectedGroup?.id === group.id
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'hover:bg-muted/50'
                                                        }`}
                                                    onClick={() => loadGroupDetails(group)}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{group.group_name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        <MessageSquare className="h-3 w-3 mr-1" />
                                                                        {group.total_messages || 0}
                                                                    </Badge>
                                                                    {group.alerts_enabled && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            <Bell className="h-3 w-3 mr-1" />
                                                                            Alertas
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {group.is_active ? (
                                                                <Badge className="bg-primary/20 text-primary text-xs">Ativo</Badge>
                                                            ) : (
                                                                <Badge variant="destructive" className="text-xs">Pausado</Badge>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detalhes do Grupo */}
                            <div className="lg:col-span-2">
                                {selectedGroup ? (
                                    <Tabs defaultValue="overview" className="space-y-4">
                                        <TabsList className="grid grid-cols-4 w-full">
                                            <TabsTrigger value="overview">
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                Visão Geral
                                            </TabsTrigger>
                                            <TabsTrigger value="reports">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Relatórios
                                            </TabsTrigger>
                                            <TabsTrigger value="alerts">
                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                Alertas
                                            </TabsTrigger>
                                            <TabsTrigger value="settings">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Configurações
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Visão Geral */}
                                        <TabsContent value="overview">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>{selectedGroup.group_name}</CardTitle>
                                                    <CardDescription>
                                                        Instância: {selectedGroup.instance_name}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                                                            <p className="text-2xl font-bold">{selectedGroup.total_messages || 0}</p>
                                                            <p className="text-xs text-muted-foreground">Mensagens</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                            <Bell className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                                                            <p className="text-2xl font-bold">{alerts.length}</p>
                                                            <p className="text-xs text-muted-foreground">Alertas</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                            <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                                                            <p className="text-2xl font-bold">{reports.length}</p>
                                                            <p className="text-xs text-muted-foreground">Relatórios</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                            <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                                                            <p className="text-2xl font-bold">{selectedGroup.report_time}</p>
                                                            <p className="text-xs text-muted-foreground">Horário</p>
                                                        </div>
                                                    </div>

                                                    {/* Pesquisa */}
                                                    <div className="space-y-4">
                                                        <Label>Pesquisar neste grupo</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="O que falaram sobre..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                            />
                                                            <Button onClick={handleSearch} disabled={isSearching}>
                                                                {isSearching ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Search className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>

                                                        {searchResults && (
                                                            <Card className="bg-muted/30">
                                                                <CardContent className="p-4">
                                                                    {searchResults.ai_summary && (
                                                                        <div className="mb-4">
                                                                            <Label className="text-sm font-medium">Resposta da IA:</Label>
                                                                            <p className="text-sm mt-1">{searchResults.ai_summary}</p>
                                                                        </div>
                                                                    )}
                                                                    {searchResults.messages?.length > 0 && (
                                                                        <div>
                                                                            <Label className="text-sm font-medium">
                                                                                {searchResults.messages.length} mensagens encontradas
                                                                            </Label>
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* Relatórios */}
                                        <TabsContent value="reports">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Relatórios Diários</CardTitle>
                                                    <CardDescription>Resumos gerados automaticamente pela IA</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {reports.length === 0 ? (
                                                        <p className="text-muted-foreground text-center py-8">
                                                            Nenhum relatório gerado ainda
                                                        </p>
                                                    ) : (
                                                        reports.map((report) => (
                                                            <Card key={report.id} className="bg-muted/30">
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <Badge variant="outline">
                                                                            {new Date(report.report_date).toLocaleDateString('pt-BR')}
                                                                        </Badge>
                                                                        <Badge variant="secondary">
                                                                            {report.message_count} mensagens
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm whitespace-pre-wrap">{report.content}</p>
                                                                    {report.topics?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-3">
                                                                            {report.topics.map((topic, i) => (
                                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                                    {topic}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </CardContent>
                                                            </Card>
                                                        ))
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* Alertas */}
                                        <TabsContent value="alerts">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Alertas Disparados</CardTitle>
                                                    <CardDescription>
                                                        Palavras-chave: {selectedGroup.keywords?.join(', ') || 'Nenhuma'}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {alerts.length === 0 ? (
                                                        <p className="text-muted-foreground text-center py-8">
                                                            Nenhum alerta disparado ainda
                                                        </p>
                                                    ) : (
                                                        alerts.map((alert) => (
                                                            <Card key={alert.id} className="border-orange-500/50 bg-orange-500/5">
                                                                <CardContent className="p-3">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Badge className="bg-orange-500">
                                                                                    {alert.keyword}
                                                                                </Badge>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {new Date(alert.triggered_at).toLocaleString('pt-BR')}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm font-medium">{alert.sender_name}</p>
                                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                                "{alert.message_content}"
                                                                            </p>
                                                                        </div>
                                                        {alert.was_sent && (
                                                            <Badge variant="outline" className="text-primary">
                                                                Enviado
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* Configurações */}
                                        <TabsContent value="settings">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Configurações do Grupo</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label>Monitoramento Ativo</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Capturar e armazenar mensagens
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={selectedGroup.is_active}
                                                            onCheckedChange={(v) => toggleGroupSetting(selectedGroup.id, 'is_active', v)}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label>Alertas por Palavra-chave</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Receber alertas no WhatsApp
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={selectedGroup.alerts_enabled}
                                                            onCheckedChange={(v) => toggleGroupSetting(selectedGroup.id, 'alerts_enabled', v)}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label>Relatório Diário</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Enviar resumo às {selectedGroup.report_time}
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={selectedGroup.report_enabled}
                                                            onCheckedChange={(v) => toggleGroupSetting(selectedGroup.id, 'report_enabled', v)}
                                                        />
                                                    </div>

                                                    <div className="pt-4 border-t">
                                                        <Label>Palavras-chave para alertas</Label>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {selectedGroup.keywords?.map((kw, i) => (
                                                                <Badge key={i} variant="secondary">{kw}</Badge>
                                                            )) || (
                                                                    <span className="text-muted-foreground text-sm">Nenhuma configurada</span>
                                                                )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                ) : (
                                    <Card className="h-full flex items-center justify-center">
                                        <CardContent className="text-center py-12">
                                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-medium">Selecione um grupo</h3>
                                            <p className="text-muted-foreground mt-1">
                                                Escolha um grupo na lista para ver detalhes
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
        </main>
    );
};

export default GroupManagement;
