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
import { SidebarTrigger } from '@/components/ui/sidebar';
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

    if (loading) return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        </main>
    );

    return (
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-foreground" /></div>
                    <div><h1 className="text-2xl font-bold text-foreground">Configurações de Pagamento</h1><p className="text-muted-foreground">Configure suas formas de recebimento</p></div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><QrCode className="w-6 h-6 text-green-400" /></div>
                                    <div><CardTitle className="text-foreground">PIX</CardTitle><CardDescription className="text-muted-foreground">Receba pagamentos instantâneos</CardDescription></div>
                                </div>
                                <Switch checked={pixSettings.is_enabled} onCheckedChange={(c) => setPixSettings({ ...pixSettings, is_enabled: c })} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-foreground">Tipo de Chave PIX</Label>
                                <Select value={pixSettings.pix_key_type} onValueChange={(v) => setPixSettings({ ...pixSettings, pix_key_type: v })}>
                                    <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
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
                                <Label className="text-foreground">Chave PIX</Label>
                                <Input
                                    value={pixSettings.pix_key}
                                    onChange={(e) => setPixSettings({ ...pixSettings, pix_key: e.target.value })}
                                    placeholder={pixSettings.pix_key_type === 'cpf' ? '000.000.000-00' : pixSettings.pix_key_type === 'email' ? 'seu@email.com' : 'Sua chave'}
                                    className="bg-muted border-border text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-foreground">Nome do Titular</Label>
                                <Input
                                    value={pixSettings.pix_holder_name}
                                    onChange={(e) => setPixSettings({ ...pixSettings, pix_holder_name: e.target.value })}
                                    placeholder="Nome que aparecerá para o cliente"
                                    className="bg-muted border-border text-foreground"
                                />
                            </div>

                            <Button onClick={savePixSettings} className="w-full bg-green-500 hover:bg-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />Salvar Configurações PIX
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border mt-6 opacity-50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-blue-400" /></div>
                                <div><CardTitle className="text-foreground">Cartão de Crédito</CardTitle><CardDescription className="text-muted-foreground">Em breve - Integração com gateways de pagamento</CardDescription></div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </main>
    );
}