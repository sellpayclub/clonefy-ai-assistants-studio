import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, Trash2, Users, MessageSquare, Wifi, WifiOff, RefreshCw, QrCode, Settings, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
    id: string;
    name: string;
    description: string;
    status: string;
    business_name: string;
    whatsapp_instance: string;
    whatsapp_status: string;
    openai_assistant_id: string;
    max_followups: number;
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
            setCampaign(data);

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
            const response = await fetch(`https://api.cfroi.click/instance/connect/${campaign.whatsapp_instance}`, {
                headers: {
                    'apikey': '94805bfbb25f77f37a029f5a3dbfe62b'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.base64) {
                    setQrCode(data.base64);
                } else if (data.code) {
                    setQrCode(data.code);
                }
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
            const response = await fetch(`https://api.cfroi.click/instance/connectionState/${campaign.whatsapp_instance}`, {
                headers: {
                    'apikey': '94805bfbb25f77f37a029f5a3dbfe62b'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const isConnected = data.state === 'open' || data.instance?.state === 'open';

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-center text-muted-foreground">Campanha não encontrada</p>
            </div>
        );
    }

    const isConnected = campaign.whatsapp_status === 'connected';

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Users className="h-8 w-8 text-blue-500" />
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
                                    <MessageSquare className="h-8 w-8 text-green-500" />
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
                                    <BarChart3 className="h-8 w-8 text-purple-500" />
                                    <div>
                                        <p className="text-2xl font-bold">{stats.responses}</p>
                                        <p className="text-sm text-muted-foreground">Respostas</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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
                            <Button variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Configurações
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Campaign Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informações da Campanha</CardTitle>
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
                                    <p className="text-sm font-medium text-muted-foreground">Instância WhatsApp</p>
                                    <p className="font-mono text-sm">{campaign.whatsapp_instance}</p>
                                </div>
                            </div>
                            {campaign.openai_assistant_id && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Assistente IA</p>
                                    <p className="font-mono text-sm text-green-600">✅ Configurado</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* WhatsApp Connection Sidebar */}
                <div className="space-y-6">
                    <Card className={isConnected ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {isConnected ? (
                                    <>
                                        <Wifi className="h-5 w-5 text-green-600" />
                                        <span className="text-green-700">WhatsApp Conectado</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="h-5 w-5 text-orange-600" />
                                        <span className="text-orange-700">Conectar WhatsApp</span>
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
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wifi className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-green-700 font-medium">Conexão estabelecida!</p>
                                    <p className="text-sm text-green-600 mt-1">Pronto para enviar mensagens</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {qrCode ? (
                                        <div className="text-center">
                                            <div className="bg-white p-4 rounded-lg inline-block mb-4">
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
                                            <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                                <QrCode className="h-16 w-16 text-slate-400" />
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
    );
};

export default FollowupCampaignDetails;
