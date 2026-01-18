import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/AppSidebar';
import { ArrowLeft, DollarSign, CreditCard, QrCode, CheckCircle } from 'lucide-react';

export default function CommercePaymentSettings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [pixSettings, setPixSettings] = useState({
        is_enabled: true,
        pix_key: '',
        pix_key_type: 'cpf',
        pix_holder_name: '',
    });

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/auth'); return; }

            // @ts-ignore - commerce_stores table will exist after migration
            const { data: store } = await (supabase as any).from('commerce_stores').select('id').eq('user_id', user.id).single();
            if (!store) { navigate('/commerce'); return; }
            setStoreId(store.id);

            // @ts-ignore - commerce_payment_settings table will exist after migration
            const { data: settings } = await (supabase as any)
                .from('commerce_payment_settings')
                .select('*')
                .eq('store_id', store.id)
                .eq('payment_method', 'pix')
                .single();

            if (settings) {
                setPixSettings({
                    is_enabled: settings.is_enabled,
                    pix_key: settings.pix_key || '',
                    pix_key_type: settings.pix_key_type || 'cpf',
                    pix_holder_name: settings.pix_holder_name || '',
                });
            }
        } catch (error: any) {
            console.error(error);
        } finally { setLoading(false); }
    };

    const savePixSettings = async () => {
        if (!storeId) return;
        try {
            // @ts-ignore - commerce_payment_settings table will exist after migration
            const { data: existing } = await (supabase as any)
                .from('commerce_payment_settings')
                .select('id')
                .eq('store_id', storeId)
                .eq('payment_method', 'pix')
                .single();

            if (existing) {
                // @ts-ignore
                await (supabase as any).from('commerce_payment_settings').update(pixSettings).eq('id', existing.id);
            } else {
                // @ts-ignore
                await (supabase as any).from('commerce_payment_settings').insert({ store_id: storeId, payment_method: 'pix', ...pixSettings });
            }

            toast({ title: 'Salvo!', description: 'Configurações de PIX atualizadas.' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    if (loading) return <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></main></div>;

    return (
        <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-gray-700 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-gray-400"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
                    <div><h1 className="text-2xl font-bold text-white">Configurações de Pagamento</h1><p className="text-gray-400">Configure suas formas de recebimento</p></div>
                </div>
            </div>

            <div className="p-6 max-w-2xl">
                <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><QrCode className="w-6 h-6 text-green-400" /></div>
                                <div><CardTitle className="text-white">PIX</CardTitle><CardDescription className="text-gray-400">Receba pagamentos instantâneos</CardDescription></div>
                            </div>
                            <Switch checked={pixSettings.is_enabled} onCheckedChange={(c) => setPixSettings({ ...pixSettings, is_enabled: c })} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Tipo de Chave PIX</Label>
                            <Select value={pixSettings.pix_key_type} onValueChange={(v) => setPixSettings({ ...pixSettings, pix_key_type: v })}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cpf">CPF</SelectItem>
                                    <SelectItem value="cnpj">CNPJ</SelectItem>
                                    <SelectItem value="email">E-mail</SelectItem>
                                    <SelectItem value="phone">Telefone</SelectItem>
                                    <SelectItem value="random">Chave Aleatória</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Chave PIX</Label>
                            <Input
                                value={pixSettings.pix_key}
                                onChange={(e) => setPixSettings({ ...pixSettings, pix_key: e.target.value })}
                                placeholder={pixSettings.pix_key_type === 'cpf' ? '000.000.000-00' : pixSettings.pix_key_type === 'email' ? 'seu@email.com' : 'Sua chave'}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Nome do Titular</Label>
                            <Input
                                value={pixSettings.pix_holder_name}
                                onChange={(e) => setPixSettings({ ...pixSettings, pix_holder_name: e.target.value })}
                                placeholder="Nome que aparecerá para o cliente"
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>

                        <Button onClick={savePixSettings} className="w-full bg-green-500 hover:bg-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />Salvar Configurações PIX
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700 mt-6 opacity-50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-blue-400" /></div>
                            <div><CardTitle className="text-white">Cartão de Crédito</CardTitle><CardDescription className="text-gray-400">Em breve - Integração com gateways de pagamento</CardDescription></div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </main></div>
    );
}
