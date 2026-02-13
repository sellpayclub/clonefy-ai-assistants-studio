import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, QrCode, Smartphone, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

export default function CommerceConnectWhatsApp() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        checkConnection();
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const checkConnection = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/auth'); return; }

            // @ts-ignore - commerce_stores table will exist after migration
            const { data: store } = await (supabase as any).from('commerce_stores').select('id, whatsapp_instance_id').eq('user_id', user.id).single();
            if (!store) { navigate('/commerce'); return; }

            setStoreId(store.id);
            if (store.whatsapp_instance_id) {
                setInstanceId(store.whatsapp_instance_id);
                const { data } = await supabase.functions.invoke('whatsapp-evolution', {
                    body: { action: 'getStatus', instanceId: store.whatsapp_instance_id },
                });
                setConnected(data?.connected || false);
            }
        } catch (error) {
            console.error(error);
        } finally { setLoading(false); }
    };

    const createInstance = async () => {
        if (!storeId) return;
        try {
            setConnecting(true);
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ekfkrwueqwpqakpsrsjt.supabase.co';
            const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
                body: {
                    action: 'createInstance',
                    instanceName: `commerce_${storeId.substring(0, 8)}`,
                    webhookUrl: `${supabaseUrl}/functions/v1/commerce-webhook`,
                },
            });

            if (error) throw error;
            const newInstanceId = data?.instanceId;
            if (!newInstanceId) throw new Error('Falha ao criar instância');

            // @ts-ignore
            await (supabase as any).from('commerce_stores').update({ whatsapp_instance_id: newInstanceId }).eq('id', storeId);
            setInstanceId(newInstanceId);
            await getQRCode(newInstanceId);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setConnecting(false); }
    };

    const getQRCode = useCallback(async (instId?: string) => {
        const id = instId || instanceId;
        if (!id) return;

        try {
            setConnecting(true);
            const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
                body: { action: 'getQRCode', instanceId: id },
            });

            if (error) throw error;
            if (data?.qrcode) {
                setQrCode(data.qrcode);
                startPolling(id);
            }
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setConnecting(false); }
    }, [instanceId]);

    const startPolling = (instId: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const { data } = await supabase.functions.invoke('whatsapp-evolution', {
                    body: { action: 'getStatus', instanceId: instId },
                });
                if (data?.connected) {
                    setConnected(true);
                    setQrCode(null);
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    pollingRef.current = null;
                    toast({ title: 'Conectado!', description: 'WhatsApp conectado com sucesso.' });
                }
            } catch (e) {
                console.error(e);
            }
        }, 3000);

        // Stop after 2 minutes
        setTimeout(() => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }, 120000);
    };

    if (loading) return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        </main>
    );

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center"><Smartphone className="w-6 h-6 text-primary-foreground" /></div>
                    <div><h1 className="text-2xl font-bold text-foreground">Conectar WhatsApp</h1><p className="text-muted-foreground">Conecte sua loja ao WhatsApp</p></div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-xl mx-auto">
                    {connected ? (
                        <Card className="bg-card border-border">
                            <CardContent className="py-12 text-center">
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Conectado!</h2>
                                <p className="text-muted-foreground mb-6">Sua loja está pronta para receber vendas via WhatsApp.</p>
                                <Button onClick={() => navigate('/commerce')} className="bg-primary hover:bg-primary/90">
                                    Voltar para a Loja
                                </Button>
                            </CardContent>
                        </Card>
                    ) : qrCode ? (
                        <Card className="bg-card border-border">
                            <CardHeader className="text-center">
                                <CardTitle className="text-foreground">Escaneie o QR Code</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl mb-6">
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                </div>
                                <Button onClick={() => getQRCode()} variant="outline" className="border-border text-foreground">
                                    <RefreshCw className="w-4 h-4 mr-2" />Atualizar QR Code
                                </Button>
                                <p className="text-xs text-muted-foreground mt-4">O QR Code expira em 60 segundos</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-card border-border">
                            <CardHeader className="text-center">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <QrCode className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-foreground">Conectar WhatsApp</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Conecte sua loja ao WhatsApp para começar a vender automaticamente com IA
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">1</div>
                                        <p className="text-foreground">Clique em "Gerar QR Code"</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">2</div>
                                        <p className="text-foreground">Abra o WhatsApp no seu celular</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">3</div>
                                        <p className="text-foreground">Vá em Configurações → Dispositivos Conectados</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-muted/50 rounded-lg">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">4</div>
                                        <p className="text-foreground">Escaneie o QR Code</p>
                                    </div>
                                </div>
                                <Button onClick={instanceId ? () => getQRCode() : createInstance} disabled={connecting} className="w-full bg-primary hover:bg-primary/90">
                                    {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><QrCode className="w-4 h-4 mr-2" />Gerar QR Code</>}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </main>
    );
}
