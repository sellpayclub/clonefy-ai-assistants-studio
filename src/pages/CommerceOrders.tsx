import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/AppSidebar';
import { ArrowLeft, ShoppingCart, Search, Eye, Package, DollarSign, Clock, CheckCircle, XCircle, Truck, RefreshCw } from 'lucide-react';

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    customer: { name: string; whatsapp_number: string };
    items_count?: number;
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
    awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-orange-500', icon: DollarSign },
    paid: { label: 'Pago', color: 'bg-green-500', icon: CheckCircle },
    processing: { label: 'Processando', color: 'bg-blue-500', icon: RefreshCw },
    shipped: { label: 'Enviado', color: 'bg-purple-500', icon: Truck },
    delivered: { label: 'Entregue', color: 'bg-emerald-500', icon: Package },
    cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
};

export default function CommerceOrders() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/auth'); return; }

            const { data: store } = await supabase.from('commerce_stores').select('id').eq('user_id', user.id).single();
            if (!store) { navigate('/commerce'); return; }

            const { data: ordersData, error } = await supabase
                .from('commerce_orders')
                .select(`*, customer:commerce_customers(name, whatsapp_number)`)
                .eq('store_id', store.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(ordersData || []);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const loadOrderDetails = async (order: Order) => {
        setSelectedOrder(order);
        const { data } = await supabase.from('commerce_order_items').select('*').eq('order_id', order.id);
        setOrderItems(data || []);
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        const updateData: any = { status };
        if (status === 'paid') updateData.payment_status = 'paid';
        if (status === 'cancelled') updateData.payment_status = 'failed';

        const { error } = await supabase.from('commerce_orders').update(updateData).eq('id', orderId);
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Status atualizado!' });
        loadOrders();
        if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status, ...updateData });
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer?.whatsapp_number?.includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'awaiting_payment').length,
        paid: orders.filter(o => o.status === 'paid' || o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'delivered').length,
        revenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0),
    };

    if (loading) return <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></main></div>;

    return (
        <div className="flex h-screen bg-gray-900"><AppSidebar /><main className="flex-1 overflow-y-auto">
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-gray-700 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-gray-400"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
                    <div><h1 className="text-2xl font-bold text-white">Pedidos</h1><p className="text-gray-400">Gerencie seus pedidos</p></div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Total</p><p className="text-2xl font-bold text-white">{stats.total}</p></div><ShoppingCart className="w-8 h-8 text-blue-400" /></div></CardContent></Card>
                    <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Pendentes</p><p className="text-2xl font-bold text-yellow-400">{stats.pending}</p></div><Clock className="w-8 h-8 text-yellow-400" /></div></CardContent></Card>
                    <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Pagos</p><p className="text-2xl font-bold text-green-400">{stats.paid}</p></div><CheckCircle className="w-8 h-8 text-green-400" /></div></CardContent></Card>
                    <Card className="bg-gray-800/50 border-gray-700"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-gray-400 text-sm">Faturamento</p><p className="text-2xl font-bold text-emerald-400">R$ {stats.revenue.toFixed(2)}</p></div><DollarSign className="w-8 h-8 text-emerald-400" /></div></CardContent></Card>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar pedidos..." className="pl-10 bg-gray-800 border-gray-600 text-white" /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem><SelectItem value="paid">Pago</SelectItem><SelectItem value="processing">Processando</SelectItem><SelectItem value="shipped">Enviado</SelectItem><SelectItem value="delivered">Entregue</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select>
                    <Button onClick={loadOrders} variant="outline" className="border-gray-600"><RefreshCw className="w-4 h-4" /></Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-3">
                        {filteredOrders.length === 0 ? (
                            <Card className="bg-gray-800/50 border-gray-700"><CardContent className="py-16 text-center"><ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-xl text-white mb-2">Nenhum pedido</h3><p className="text-gray-400">Os pedidos aparecerão aqui</p></CardContent></Card>
                        ) : filteredOrders.map((order) => {
                            const status = statusLabels[order.status] || statusLabels.pending;
                            const StatusIcon = status.icon;
                            return (
                                <Card key={order.id} className={`bg-gray-800/50 border-gray-700 cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'ring-2 ring-green-500' : 'hover:bg-gray-800'}`} onClick={() => loadOrderDetails(order)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${status.color}/20 rounded-full flex items-center justify-center`}><StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} /></div>
                                                <div><p className="font-medium text-white">#{order.order_number}</p><p className="text-sm text-gray-400">{order.customer?.name || order.customer?.whatsapp_number}</p></div>
                                            </div>
                                            <div className="text-right"><p className="text-lg font-bold text-green-400">R$ {order.total.toFixed(2)}</p><Badge className={status.color}>{status.label}</Badge></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div>
                        {selectedOrder ? (
                            <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
                                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Eye className="w-5 h-5" />Pedido #{selectedOrder.order_number}</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div><p className="text-gray-400 text-sm">Cliente</p><p className="text-white font-medium">{selectedOrder.customer?.name || 'N/A'}</p><p className="text-gray-400 text-sm">{selectedOrder.customer?.whatsapp_number}</p></div>
                                    <div><p className="text-gray-400 text-sm">Status</p><Badge className={statusLabels[selectedOrder.status]?.color || 'bg-gray-500'}>{statusLabels[selectedOrder.status]?.label || selectedOrder.status}</Badge></div>
                                    <div><p className="text-gray-400 text-sm">Itens</p><div className="space-y-2 mt-2">{orderItems.map((item) => (<div key={item.id} className="flex justify-between text-sm"><span className="text-white">{item.quantity}x {item.product_name}</span><span className="text-gray-400">R$ {item.total_price.toFixed(2)}</span></div>))}</div></div>
                                    <div className="border-t border-gray-700 pt-4"><div className="flex justify-between text-lg"><span className="text-white font-bold">Total</span><span className="text-green-400 font-bold">R$ {selectedOrder.total.toFixed(2)}</span></div></div>
                                    <div className="space-y-2"><p className="text-gray-400 text-sm">Atualizar Status</p><div className="grid grid-cols-2 gap-2">
                                        <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'paid')} className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-4 h-4 mr-1" />Pago</Button>
                                        <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'processing')} className="bg-blue-500 hover:bg-blue-600"><RefreshCw className="w-4 h-4 mr-1" />Processar</Button>
                                        <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')} className="bg-purple-500 hover:bg-purple-600"><Truck className="w-4 h-4 mr-1" />Enviar</Button>
                                        <Button size="sm" onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="bg-emerald-500 hover:bg-emerald-600"><Package className="w-4 h-4 mr-1" />Entregue</Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="col-span-2"><XCircle className="w-4 h-4 mr-1" />Cancelar</Button>
                                    </div></div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-gray-800/50 border-gray-700"><CardContent className="py-16 text-center"><Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Selecione um pedido</p></CardContent></Card>
                        )}
                    </div>
                </div>
            </div>
        </main></div>
    );
}
