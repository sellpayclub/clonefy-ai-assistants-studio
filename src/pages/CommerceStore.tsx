import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/AppSidebar';
import {
    Store, Package, ShoppingCart, Users, MessageSquare, Settings, Plus,
    DollarSign, BarChart3, QrCode, Smartphone, Trash2, Edit, Search, Image as ImageIcon, Tag, Layers,
} from 'lucide-react';

export default function CommerceStore() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0, pendingOrders: 0, activeConversations: 0 });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStoreSetup, setShowStoreSetup] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    const [storeForm, setStoreForm] = useState({
        name: '', description: '', whatsapp_number: '',
        welcome_message: 'Olá! 👋 Bem-vindo à nossa loja!',
        ai_personality: 'Você é um vendedor profissional e amigável.',
        ai_instructions: '',
    });

    const [productForm, setProductForm] = useState({
        name: '', description: '', short_description: '', price: '', compare_at_price: '',
        stock_quantity: '', category_id: '', is_active: true, is_featured: false, ai_selling_points: '',
    });

    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    useEffect(() => { loadStore(); }, []);

    const loadStore = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/auth'); return; }

            const { data: storeData, error } = await supabase.from('commerce_stores').select('*').eq('user_id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error;

            if (storeData) {
                setStore(storeData);
                setStoreForm({ name: storeData.name, description: storeData.description || '', whatsapp_number: storeData.whatsapp_number || '', welcome_message: storeData.welcome_message || '', ai_personality: storeData.ai_personality || '', ai_instructions: storeData.ai_instructions || '' });
                await loadStoreData(storeData.id);
            } else { setShowStoreSetup(true); }
        } catch (error: any) {
            toast({ title: 'Erro', description: 'Falha ao carregar dados', variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const loadStoreData = async (storeId: string) => {
        const { data: productsData } = await supabase.from('commerce_products').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
        setProducts(productsData || []);
        const { data: categoriesData } = await supabase.from('commerce_categories').select('*').eq('store_id', storeId);
        setCategories(categoriesData || []);
        const { data: ordersData } = await supabase.from('commerce_orders').select('id, total, status').eq('store_id', storeId);
        const { data: customersData } = await supabase.from('commerce_customers').select('id').eq('store_id', storeId);
        const { data: conversationsData } = await supabase.from('commerce_conversations').select('id').eq('store_id', storeId).eq('status', 'active');
        setStats({
            totalProducts: productsData?.length || 0, totalOrders: ordersData?.length || 0,
            totalRevenue: ordersData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
            totalCustomers: customersData?.length || 0,
            pendingOrders: ordersData?.filter(o => o.status === 'pending' || o.status === 'awaiting_payment').length || 0,
            activeConversations: conversationsData?.length || 0,
        });
    };

    const createStore = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('commerce_stores').insert({ user_id: user.id, ...storeForm }).select().single();
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        setStore(data); setShowStoreSetup(false);
        toast({ title: 'Loja criada!', description: 'Agora adicione seus produtos!' });
    };

    const updateStore = async () => {
        if (!store) return;
        const { error } = await supabase.from('commerce_stores').update(storeForm).eq('id', store.id);
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Salvo!' }); loadStore();
    };

    const createProduct = async () => {
        if (!store) return;
        const data = { store_id: store.id, name: productForm.name, description: productForm.description, short_description: productForm.short_description, price: parseFloat(productForm.price) || 0, compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null, stock_quantity: parseInt(productForm.stock_quantity) || 0, category_id: productForm.category_id || null, is_active: productForm.is_active, is_featured: productForm.is_featured, ai_selling_points: productForm.ai_selling_points };
        const { error } = editingProduct ? await supabase.from('commerce_products').update(data).eq('id', editingProduct.id) : await supabase.from('commerce_products').insert(data);
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: editingProduct ? 'Produto atualizado!' : 'Produto criado!' });
        setShowProductModal(false); setEditingProduct(null); setProductForm({ name: '', description: '', short_description: '', price: '', compare_at_price: '', stock_quantity: '', category_id: '', is_active: true, is_featured: false, ai_selling_points: '' });
        loadStoreData(store.id);
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Excluir este produto?')) return;
        await supabase.from('commerce_products').delete().eq('id', id);
        toast({ title: 'Produto excluído!' }); loadStoreData(store.id);
    };

    const createCategory = async () => {
        if (!store) return;
        const { error } = await supabase.from('commerce_categories').insert({ store_id: store.id, ...categoryForm });
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Categoria criada!' }); setShowCategoryModal(false); setCategoryForm({ name: '', description: '' }); loadStoreData(store.id);
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></main></div>;

    if (showStoreSetup || !store) return (
        <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 overflow-y-auto p-8"><div className="max-w-2xl mx-auto"><Card className="bg-gray-800/50 border-gray-700"><CardHeader className="text-center"><div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Store className="w-8 h-8 text-white" /></div><CardTitle className="text-2xl text-white">Criar sua Loja Virtual</CardTitle><CardDescription className="text-gray-400">Configure sua loja para vender via WhatsApp com IA</CardDescription></CardHeader><CardContent className="space-y-6">
            <div className="space-y-2"><Label className="text-gray-300">Nome da Loja *</Label><Input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} placeholder="Ex: Minha Loja Online" className="bg-gray-700 border-gray-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-gray-300">Descrição</Label><Textarea value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-gray-300">WhatsApp</Label><Input value={storeForm.whatsapp_number} onChange={(e) => setStoreForm({ ...storeForm, whatsapp_number: e.target.value })} placeholder="5511999999999" className="bg-gray-700 border-gray-600 text-white" /></div>
            <div className="space-y-2"><Label className="text-gray-300">Mensagem de Boas-Vindas</Label><Textarea value={storeForm.welcome_message} onChange={(e) => setStoreForm({ ...storeForm, welcome_message: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
            <Button onClick={createStore} disabled={!storeForm.name} className="w-full bg-gradient-to-r from-green-500 to-emerald-600"><Store className="w-4 h-4 mr-2" />Criar Minha Loja</Button>
        </CardContent></Card></div></main></div>
    );

    return (
        <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-gray-700 p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div><div><h1 className="text-2xl font-bold text-white">{store.name}</h1><p className="text-gray-400">Loja Virtual via WhatsApp</p></div></div><div className="flex items-center gap-3"><Badge className={store.is_active ? 'bg-green-500' : 'bg-gray-500'}>{store.is_active ? 'Ativa' : 'Inativa'}</Badge><Button variant="outline" onClick={() => navigate('/commerce/orders')} className="border-gray-600 text-gray-300"><ShoppingCart className="w-4 h-4 mr-2" />Pedidos</Button><Button variant="outline" onClick={() => navigate('/commerce/conversations')} className="border-gray-600 text-gray-300"><MessageSquare className="w-4 h-4 mr-2" />Conversas</Button></div></div></div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
                <TabsList className="bg-gray-800 border border-gray-700"><TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700"><BarChart3 className="w-4 h-4 mr-2" />Dashboard</TabsTrigger><TabsTrigger value="products" className="data-[state=active]:bg-gray-700"><Package className="w-4 h-4 mr-2" />Produtos</TabsTrigger><TabsTrigger value="categories" className="data-[state=active]:bg-gray-700"><Layers className="w-4 h-4 mr-2" />Categorias</TabsTrigger><TabsTrigger value="settings" className="data-[state=active]:bg-gray-700"><Settings className="w-4 h-4 mr-2" />Configurações</TabsTrigger></TabsList>

                <TabsContent value="dashboard" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Produtos</p><p className="text-3xl font-bold text-white">{stats.totalProducts}</p></div><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-blue-400" /></div></div></CardContent></Card>
                        <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Pedidos</p><p className="text-3xl font-bold text-white">{stats.totalOrders}</p>{stats.pendingOrders > 0 && <p className="text-yellow-400 text-xs">{stats.pendingOrders} pendentes</p>}</div><div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-green-400" /></div></div></CardContent></Card>
                        <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Faturamento</p><p className="text-3xl font-bold text-white">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div><div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-emerald-400" /></div></div></CardContent></Card>
                        <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Clientes</p><p className="text-3xl font-bold text-white">{stats.totalCustomers}</p></div><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-400" /></div></div></CardContent></Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-green-400" />Conversas Ativas</CardTitle></CardHeader><CardContent><div className="text-center py-8"><div className="text-4xl font-bold text-green-400">{stats.activeConversations}</div><p className="text-gray-400 mt-2">conversas em andamento</p><Button onClick={() => navigate('/commerce/conversations')} variant="outline" className="mt-4 border-gray-600">Ver Conversas</Button></div></CardContent></Card>
                        <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-400" />WhatsApp</CardTitle></CardHeader><CardContent><div className="text-center py-8">{store.whatsapp_instance_id ? <><div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Smartphone className="w-8 h-8 text-green-400" /></div><p className="text-green-400 font-medium">Conectado</p><p className="text-gray-400 text-sm mt-1">{store.whatsapp_number}</p></> : <><div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><QrCode className="w-8 h-8 text-gray-500" /></div><p className="text-gray-400">WhatsApp não conectado</p><Button onClick={() => navigate('/commerce/connect-whatsapp')} className="mt-4 bg-green-500 hover:bg-green-600"><QrCode className="w-4 h-4 mr-2" />Conectar WhatsApp</Button></>}</div></CardContent></Card>
                    </div>
                </TabsContent>

                <TabsContent value="products" className="mt-6">
                    <div className="flex items-center justify-between mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar produtos..." className="pl-10 bg-gray-800 border-gray-600 text-white w-80" /></div><Button onClick={() => { setProductForm({ name: '', description: '', short_description: '', price: '', compare_at_price: '', stock_quantity: '', category_id: '', is_active: true, is_featured: false, ai_selling_points: '' }); setEditingProduct(null); setShowProductModal(true); }} className="bg-green-500 hover:bg-green-600"><Plus className="w-4 h-4 mr-2" />Novo Produto</Button></div>
                    {filteredProducts.length === 0 ? <Card className="bg-gray-800/50 border-gray-700"><CardContent className="py-16 text-center"><Package className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-xl font-medium text-white mb-2">Nenhum produto</h3><p className="text-gray-400 mb-6">Adicione seu primeiro produto</p><Button onClick={() => setShowProductModal(true)} className="bg-green-500"><Plus className="w-4 h-4 mr-2" />Adicionar</Button></CardContent></Card> :
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filteredProducts.map((product) => (<Card key={product.id} className="bg-gray-800/50 border-gray-700 overflow-hidden group"><div className="aspect-square bg-gray-700 relative">{product.primary_image_url ? <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-600" /></div>}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><Button size="sm" variant="secondary" onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, description: product.description || '', short_description: product.short_description || '', price: product.price.toString(), compare_at_price: product.compare_at_price?.toString() || '', stock_quantity: product.stock_quantity.toString(), category_id: product.category_id || '', is_active: product.is_active, is_featured: product.is_featured, ai_selling_points: '' }); setShowProductModal(true); }}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="w-4 h-4" /></Button></div>{product.is_featured && <Badge className="absolute top-2 left-2 bg-yellow-500">Destaque</Badge>}</div><CardContent className="p-4"><h3 className="font-medium text-white truncate">{product.name}</h3><div className="flex items-center gap-2 mt-2"><span className="text-xl font-bold text-green-400">R$ {product.price.toFixed(2)}</span>{product.compare_at_price && <span className="text-sm text-gray-500 line-through">R$ {product.compare_at_price.toFixed(2)}</span>}</div><p className="text-sm text-gray-400 mt-1">Estoque: {product.stock_quantity}</p></CardContent></Card>))}</div>}
                </TabsContent>

                <TabsContent value="categories" className="mt-6">
                    <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-white">Categorias</h2><Button onClick={() => setShowCategoryModal(true)} className="bg-green-500"><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button></div>
                    {categories.length === 0 ? <Card className="bg-gray-800/50 border-gray-700"><CardContent className="py-16 text-center"><Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-xl text-white mb-2">Nenhuma categoria</h3><Button onClick={() => setShowCategoryModal(true)} className="bg-green-500 mt-4"><Plus className="w-4 h-4 mr-2" />Criar</Button></CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{categories.map((cat) => (<Card key={cat.id} className="bg-gray-800/50 border-gray-700"><CardContent className="p-6 flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Tag className="w-6 h-6 text-blue-400" /></div><div><h3 className="font-medium text-white">{cat.name}</h3>{cat.description && <p className="text-sm text-gray-400">{cat.description}</p>}</div></CardContent></Card>))}</div>}
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card className="bg-gray-800/50 border-gray-700"><CardHeader><CardTitle className="text-white">Configurações</CardTitle></CardHeader><CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-gray-300">Nome</Label><Input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div><div className="space-y-2"><Label className="text-gray-300">WhatsApp</Label><Input value={storeForm.whatsapp_number} onChange={(e) => setStoreForm({ ...storeForm, whatsapp_number: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div></div>
                        <div className="space-y-2"><Label className="text-gray-300">Descrição</Label><Textarea value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
                        <div className="space-y-2"><Label className="text-gray-300">Mensagem de Boas-Vindas</Label><Textarea value={storeForm.welcome_message} onChange={(e) => setStoreForm({ ...storeForm, welcome_message: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
                        <div className="space-y-2"><Label className="text-gray-300">Personalidade da IA</Label><Textarea value={storeForm.ai_personality} onChange={(e) => setStoreForm({ ...storeForm, ai_personality: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
                        <Button onClick={updateStore} className="bg-green-500 hover:bg-green-600">Salvar</Button>
                    </CardContent></Card>
                </TabsContent>
            </Tabs>

            {showProductModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"><CardHeader><CardTitle className="text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Nome *</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div><div className="space-y-2"><Label className="text-gray-300">Categoria</Label><select value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} className="w-full h-10 px-3 rounded-md bg-gray-700 border border-gray-600 text-white"><option value="">Sem categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
                <div className="space-y-2"><Label className="text-gray-300">Descrição Curta</Label><Input value={productForm.short_description} onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-gray-300">Descrição</Label><Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
                <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-gray-300">Preço *</Label><Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div><div className="space-y-2"><Label className="text-gray-300">Preço Anterior</Label><Input type="number" value={productForm.compare_at_price} onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div><div className="space-y-2"><Label className="text-gray-300">Estoque</Label><Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div></div>
                <div className="flex items-center gap-6"><div className="flex items-center gap-2"><Switch checked={productForm.is_active} onCheckedChange={(c) => setProductForm({ ...productForm, is_active: c })} /><Label className="text-gray-300">Ativo</Label></div><div className="flex items-center gap-2"><Switch checked={productForm.is_featured} onCheckedChange={(c) => setProductForm({ ...productForm, is_featured: c })} /><Label className="text-gray-300">Destaque</Label></div></div>
                <div className="flex justify-end gap-3 pt-4"><Button variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="border-gray-600 text-gray-300">Cancelar</Button><Button onClick={createProduct} disabled={!productForm.name || !productForm.price} className="bg-green-500">{editingProduct ? 'Salvar' : 'Criar'}</Button></div>
            </CardContent></Card></div>}

            {showCategoryModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="bg-gray-800 border-gray-700 w-full max-w-md"><CardHeader><CardTitle className="text-white">Nova Categoria</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="space-y-2"><Label className="text-gray-300">Nome *</Label><Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="bg-gray-700 border-gray-600 text-white" /></div>
                <div className="space-y-2"><Label className="text-gray-300">Descrição</Label><Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="bg-gray-700 border-gray-600 text-white" rows={3} /></div>
                <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => { setShowCategoryModal(false); setCategoryForm({ name: '', description: '' }); }} className="border-gray-600 text-gray-300">Cancelar</Button><Button onClick={createCategory} disabled={!categoryForm.name} className="bg-green-500">Criar</Button></div>
            </CardContent></Card></div>}
        </main></div>
    );
}
