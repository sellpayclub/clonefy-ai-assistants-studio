import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
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

    useEffect(() => { checkConnection(); }, []);

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
                // Verifica status da conexão
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

            // Cria instância na Evolution API com webhook apontando para commerce-webhook
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

            // @ts-ignore - commerce_stores table
            await (supabase as any).from('commerce_stores').update({ whatsapp_instance_id: newInstanceId }).eq('id', storeId);
            setInstanceId(newInstanceId);

            // Busca QR Code
            await getQRCode(newInstanceId);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setConnecting(false); }
    };

    const getQRCode = async (instId?: string) => {
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
                // Inicia polling para verificar conexão
                startPolling(id);
            }
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setConnecting(false); }
    };

    const startPolling = (instId: string) => {
        const interval = setInterval(async () => {
            try {
                const { data } = await supabase.functions.invoke('whatsapp-evolution', {
                    body: { action: 'getStatus', instanceId: instId },
                });
                if (data?.connected) {
                    setConnected(true);
                    setQrCode(null);
                    clearInterval(interval);
                    toast({ title: 'Conectado!', description: 'WhatsApp conectado com sucesso.' });
                }
            } catch (e) {
                console.error(e);
            }
        }, 3000);

        // Para após 2 minutos
        setTimeout(() => clearInterval(interval), 120000);
    };

    if (loading) return (<SidebarProvider><div className="min-h-screen flex w-full bg-gray-900"><AppSidebar /><main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></main></div></SidebarProvider>);

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gray-900"><AppSidebar /><main className="flex-1 overflow-y-auto">
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-gray-700 p-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-gray-400"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"><Smartphone className="w-6 h-6 text-white" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Conectar WhatsApp</h1><p className="text-gray-400">Conecte sua loja ao WhatsApp</p></div>
                    </div>
                </div>

                <div className="p-6 max-w-xl mx-auto">
                    {connected ? (
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardContent className="py-12 text-center">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">WhatsApp Conectado!</h2>
                                <p className="text-gray-400 mb-6">Sua loja está pronta para receber vendas via WhatsApp.</p>
                                <Button onClick={() => navigate('/commerce')} className="bg-green-500 hover:bg-green-600">
                                    Voltar para a Loja
                                </Button>
                            </CardContent>
                        </Card>
                    ) : qrCode ? (
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="text-center">
                                <CardTitle className="text-white">Escaneie o QR Code</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl mb-6">
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                </div>
                                <Button onClick={() => getQRCode()} variant="outline" className="border-gray-600 text-gray-300">
                                    <RefreshCw className="w-4 h-4 mr-2" />Atualizar QR Code
                                </Button>
                                <p className="text-xs text-gray-500 mt-4">O QR Code expira em 60 segundos</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="text-center">
                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <QrCode className="w-10 h-10 text-gray-500" />
                                </div>
                                <CardTitle className="text-white">Conectar WhatsApp</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Conecte sua loja ao WhatsApp para começar a vender automaticamente com IA
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-left p-3 bg-gray-700/50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                                        <p className="text-gray-300">Clique em "Gerar QR Code"</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-gray-700/50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
                                        <p className="text-gray-300">Abra o WhatsApp no seu celular</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-gray-700/50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">3</div>
                                        <p className="text-gray-300">Vá em Configurações → Dispositivos Conectados</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 bg-gray-700/50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">4</div>
                                        <p className="text-gray-300">Escaneie o QR Code</p>
                                    </div>
                                </div>
                                <Button onClick={instanceId ? () => getQRCode() : createInstance} disabled={connecting} className="w-full bg-green-500 hover:bg-green-600">
                                    {connecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><QrCode className="w-4 h-4 mr-2" />Gerar QR Code</>}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main></div>
        </SidebarProvider>
    );
}
