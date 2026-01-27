import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, Trash2, Users, MessageSquare, Wifi, WifiOff, RefreshCw, QrCode, Settings, BarChart3, Edit, FileText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import MessageSequenceEditor from "@/components/followup/MessageSequenceEditor";
import CampaignSettingsModal from "@/components/followup/CampaignSettingsModal";
import CampaignEditModal from "@/components/followup/CampaignEditModal";
import DeleteCampaignDialog from "@/components/followup/DeleteCampaignDialog";

interface MessageStep {
  step: number;
  delay_hours: number;
  message_template: string;
}

interface Campaign {
    id: string;
    name: string;
    description: string;
    status: string;
    business_name: string;
    business_description: string;
    value_proposition: string;
    tone_of_voice: string;
    common_objections: any[];
    important_links: any[];
    whatsapp_instance: string;
    whatsapp_status: string;
    openai_assistant_id: string;
    max_followups: number;
    min_interval_minutes: number;
    max_daily_messages: number;
    start_hour: number;
    end_hour: number;
    working_days: number[];
    random_delay_seconds: number;
    message_sequence: MessageStep[];
    created_at: string;
}

const FollowupCampaignDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingQR, setLoadingQR] = useState(false);
    const [stats, setStats] = useState({ leads: 0, messages: 0, responses: 0 });
    
    // Modals state
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [savingSequence, setSavingSequence] = useState(false);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                fetchCampaign(session.user.id);
            }
        };
        getSession();
    }, [id]);

    const fetchCampaign = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('followup_campaigns')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            
            // Parse message_sequence if it's a string
            const campaignData = {
                ...data,
                message_sequence: data.message_sequence || [],
                common_objections: data.common_objections || [],
                important_links: data.important_links || [],
                working_days: data.working_days || [1, 2, 3, 4, 5],
                max_followups: data.max_followups || 3,
                min_interval_minutes: data.min_interval_minutes || 30,
                max_daily_messages: data.max_daily_messages || 100,
                start_hour: data.start_hour || 8,
                end_hour: data.end_hour || 20,
                random_delay_seconds: data.random_delay_seconds || 0,
            };
            
            setCampaign(campaignData);

            // Fetch stats
            const { count: leadsCount } = await (supabase as any)
                .from('followup_leads')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', id);

            const { count: messagesCount } = await (supabase as any)
                .from('followup_messages')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', id);

            setStats({
                leads: leadsCount || 0,
                messages: messagesCount || 0,
                responses: 0
            });
        } catch (error) {
            console.error('Erro ao buscar campanha:', error);
            toast({ title: "Erro ao carregar campanha", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchQRCode = async () => {
        if (!campaign?.whatsapp_instance) return;

        setLoadingQR(true);
        try {
            // Primeiro, verificar se a instância existe tentando buscar o status
            const { data: statusData, error: statusError } = await supabase.functions.invoke('whatsapp-evolution', {
                body: {
                    action: 'check_status',
                    instanceName: campaign.whatsapp_instance
                }
            });

            // Se a instância não existe (404), criar automaticamente
            if (statusError || (statusData && statusData.error && statusData.error.includes('does not exist'))) {
                console.log('Instância não existe, criando...');
                
                // Criar a instância
                const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp-evolution', {
                    body: {
                        action: 'create',
                        instanceName: campaign.whatsapp_instance,
                        assistantId: campaign.openai_assistant_id || '',
                        userEmail: (await supabase.auth.getUser()).data.user?.email || ''
                    }
                });

                if (createError) {
                    console.error('Erro ao criar instância:', createError);
                    toast({
                        title: "Erro ao criar instância WhatsApp",
                        description: "Tente novamente",
                        variant: "destructive"
                    });
                    setLoadingQR(false);
                    return;
                }

                // Se a criação retornou QR code, usar
                if (createData?.qrCode?.base64) {
                    setQrCode(createData.qrCode.base64);
                    setLoadingQR(false);
                    return;
                }
            }

            // Buscar QR Code
            const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
                body: {
                    action: 'get_qr',
                    instanceName: campaign.whatsapp_instance
                }
            });

            if (!error && data) {
                if (data.base64) {
                    setQrCode(data.base64);
                } else if (data.code) {
                    setQrCode(data.code);
                } else if (data.qr_code) {
                    setQrCode(data.qr_code);
                }
            } else if (error) {
                console.error('Erro na resposta:', error);
                toast({
                    title: "Erro ao gerar QR Code",
                    description: "A instância pode não existir. Tente novamente.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Erro ao buscar QR Code:', error);
            toast({
                title: "Erro ao gerar QR Code",
                description: "Tente novamente em alguns segundos",
                variant: "destructive"
            });
        } finally {
            setLoadingQR(false);
        }
    };

    const checkConnectionStatus = async () => {
        if (!campaign?.whatsapp_instance) return;

        try {
            // Usar edge function em vez de chamada direta (evita CORS)
            const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
                body: {
                    action: 'check_status',
                    instanceName: campaign.whatsapp_instance
                }
            });

            if (!error && data) {
                const isConnected = data.connected || data.state === 'open' || data.instance?.state === 'open';

                if (isConnected) {
                    // Update campaign status
                    await (supabase as any)
                        .from('followup_campaigns')
                        .update({ whatsapp_status: 'connected' })
                        .eq('id', id);

                    setCampaign(prev => prev ? { ...prev, whatsapp_status: 'connected' } : null);
                    setQrCode(null);
                    toast({ title: "WhatsApp conectado com sucesso! ✅" });
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    };

    const toggleCampaignStatus = async () => {
        if (!campaign) return;

        const newStatus = campaign.status === 'active' ? 'paused' : 'active';

        try {
            await (supabase as any)
                .from('followup_campaigns')
                .update({ status: newStatus })
                .eq('id', id);

            setCampaign(prev => prev ? { ...prev, status: newStatus } : null);
            toast({
                title: newStatus === 'active' ? "Campanha ativada! 🚀" : "Campanha pausada"
            });
        } catch (error) {
            toast({ title: "Erro ao atualizar status", variant: "destructive" });
        }
    };

    const handleSequenceChange = async (sequence: MessageStep[]) => {
        if (!campaign) return;
        
        setCampaign(prev => prev ? { ...prev, message_sequence: sequence } : null);
    };

    const saveSequence = async () => {
        if (!campaign) return;
        
        setSavingSequence(true);
        try {
            const { error } = await (supabase as any)
                .from('followup_campaigns')
                .update({ message_sequence: campaign.message_sequence })
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Sequência de mensagens salva! ✅" });
        } catch (error) {
            console.error('Erro ao salvar sequência:', error);
            toast({ title: "Erro ao salvar sequência", variant: "destructive" });
        } finally {
            setSavingSequence(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Campanha não encontrada</p>
            </main>
        );
    }

    const isConnected = campaign.whatsapp_status === 'connected';

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="border-b p-4 md:p-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <Button variant="ghost" size="icon" onClick={() => navigate('/followup')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{campaign.name}</h1>
                        <p className="text-muted-foreground">{campaign.business_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status === 'active' ? 'Ativa' : campaign.status === 'paused' ? 'Pausada' : 'Rascunho'}
                    </Badge>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={campaign.status === 'active' ? 'outline' : 'default'}
                        onClick={toggleCampaignStatus}
                        disabled={!isConnected}
                    >
                        {campaign.status === 'active' ? (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Ativar
                            </>
                        )}
                    </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Users className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.leads}</p>
                                        <p className="text-sm text-muted-foreground">Leads</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.messages}</p>
                                        <p className="text-sm text-muted-foreground">Mensagens</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.responses}</p>
                                        <p className="text-sm text-muted-foreground">Respostas</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="messages">Mensagens</TabsTrigger>
                            <TabsTrigger value="info">Dados do Negócio</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4 mt-4">
                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-3">
                                    <Button variant="outline" onClick={() => navigate(`/followup/import?campaign=${id}`)}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Importar Leads
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate(`/followup/leads?campaign=${id}`)}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Ver Leads
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Configurações
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowEditModal(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar Dados
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Campaign Info Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Resumo da Campanha</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                                        <p>{campaign.description || 'Sem descrição'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Máx. Follow-ups</p>
                                            <p>{campaign.max_followups}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Horário</p>
                                            <p>{campaign.start_hour}h - {campaign.end_hour}h</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Instância WhatsApp</p>
                                            <p className="font-mono text-sm">{campaign.whatsapp_instance}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Etapas Configuradas</p>
                                            <p>{campaign.message_sequence?.length || 0} mensagens</p>
                                        </div>
                                    </div>
                                    {campaign.openai_assistant_id && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
                                            <p className="font-mono text-sm text-primary">✅ Configurado</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="messages" className="space-y-4 mt-4">
                            <MessageSequenceEditor
                                sequence={campaign.message_sequence || []}
                                onChange={handleSequenceChange}
                            />
                            <div className="flex justify-end">
                                <Button onClick={saveSequence} disabled={savingSequence}>
                                    {savingSequence ? "Salvando..." : "Salvar Sequência"}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Dados do Negócio</CardTitle>
                                        <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                    </div>
                                    <CardDescription>
                                        Essas informações são usadas pela IA para gerar mensagens personalizadas.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Nome do Negócio</p>
                                        <p>{campaign.business_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Descrição do Negócio</p>
                                        <p>{campaign.business_description || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Proposta de Valor</p>
                                        <p>{campaign.value_proposition || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tom de Voz</p>
                                        <p>{campaign.tone_of_voice || '-'}</p>
                                    </div>
                                    {campaign.common_objections?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Objeções Comuns</p>
                                            <ul className="list-disc list-inside text-sm">
                                                {campaign.common_objections.map((obj, idx) => (
                                                    <li key={idx}>{obj}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {campaign.important_links?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Links Importantes</p>
                                            <ul className="list-disc list-inside text-sm">
                                                {campaign.important_links.map((link: any, idx) => (
                                                    <li key={idx}>
                                                        <strong>{link.title}:</strong>{" "}
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                                            {link.url}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* WhatsApp Connection Sidebar */}
                <div className="space-y-6">
                    <Card className={isConnected ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-5 w-5 text-primary" />
                                        <span className="text-primary">WhatsApp Conectado</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-5 w-5 text-destructive" />
                                        <span className="text-destructive">Conectar WhatsApp</span>
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {isConnected
                                    ? 'Sua conexão está ativa e funcionando'
                                    : 'Escaneie o QR Code para conectar'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isConnected ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wifi className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                    <p className="text-primary font-medium">Conexão estabelecida!</p>
                                    <p className="text-sm text-muted-foreground mt-1">Pronto para enviar mensagens</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {qrCode ? (
                                        <div className="text-center">
                                            <div className="bg-background p-4 rounded-lg inline-block mb-4">
                                                <img
                                                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                    alt="QR Code"
                                                    className="w-48 h-48 mx-auto"
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Abra o WhatsApp → Dispositivos Conectados → Escanear
                                            </p>
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="outline" size="sm" onClick={fetchQRCode}>
                                                    <RefreshCw className="h-4 w-4 mr-1" />
                                                    Novo QR
                                                </Button>
                                                <Button size="sm" onClick={checkConnectionStatus}>
                                                    Verificar Conexão
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                                                <QrCode className="h-16 w-16 text-muted-foreground" />
                                            </div>
                                            <Button onClick={fetchQRCode} disabled={loadingQR}>
                                                {loadingQR ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        Gerando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <QrCode className="h-4 w-4 mr-2" />
                                                        Gerar QR Code
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {!isConnected && (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">
                                    ⚠️ <strong>Atenção:</strong> Você precisa conectar o WhatsApp antes de ativar a campanha.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CampaignSettingsModal
                open={showSettingsModal}
                onOpenChange={setShowSettingsModal}
                campaignId={campaign.id}
                initialSettings={{
                    max_followups: campaign.max_followups,
                    min_interval_minutes: campaign.min_interval_minutes,
                    max_daily_messages: campaign.max_daily_messages,
                    start_hour: campaign.start_hour,
                    end_hour: campaign.end_hour,
                    working_days: campaign.working_days,
                    random_delay_seconds: campaign.random_delay_seconds,
                }}
                onSave={(settings) => {
                    setCampaign(prev => prev ? { ...prev, ...settings } : null);
                }}
            />

            <CampaignEditModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                campaignId={campaign.id}
                initialData={{
                    name: campaign.name,
                    description: campaign.description || '',
                    business_name: campaign.business_name || '',
                    business_description: campaign.business_description || '',
                    value_proposition: campaign.value_proposition || '',
                    tone_of_voice: campaign.tone_of_voice || '',
                    common_objections: campaign.common_objections || [],
                    important_links: campaign.important_links || [],
                }}
                onSave={(data) => {
                    setCampaign(prev => prev ? { ...prev, ...data } : null);
                }}
            />

            <DeleteCampaignDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                campaignId={campaign.id}
                campaignName={campaign.name}
            />
        </main>
    );
};

export default FollowupCampaignDetails;
