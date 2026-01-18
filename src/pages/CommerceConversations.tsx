import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft, MessageSquare, Search, Send, User, Bot, UserCheck, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface Conversation {
    id: string;
    status: string;
    last_message_at: string;
    customer: { id: string; name: string; whatsapp_number: string };
    current_cart: { items: any[] };
}

interface Message {
    id: string;
    sender_type: string;
    content: string;
    message_type: string;
    media_url: string;
    created_at: string;
}

export default function CommerceConversations() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [storeId, setStoreId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { loadConversations(); }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/auth'); return; }

            // @ts-ignore
            const { data: store } = await (supabase as any).from('commerce_stores').select('id').eq('user_id', user.id).single();
            if (!store) { navigate('/commerce'); return; }
            setStoreId(store.id);

            // @ts-ignore
            const { data, error } = await (supabase as any)
                .from('commerce_conversations')
                .select(`*, customer:commerce_customers(id, name, whatsapp_number)`)
                .eq('store_id', store.id)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally { setLoading(false); }
    };

    const loadMessages = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        // @ts-ignore
        const { data } = await (supabase as any)
            .from('commerce_messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !storeId) return;

        try {
            // Salva mensagem como "human"
            // @ts-ignore
            await (supabase as any).from('commerce_messages').insert({
                conversation_id: selectedConversation.id,
                sender_type: 'human',
                content: newMessage,
                message_type: 'text',
            });

            // Atualiza conversa
            // @ts-ignore
            await (supabase as any).from('commerce_conversations')
                .update({ last_message_at: new Date().toISOString(), status: 'human_takeover' })
                .eq('id', selectedConversation.id);

            // Envia via WhatsApp (Evolution API)
            // @ts-ignore
            const { data: store } = await (supabase as any).from('commerce_stores').select('whatsapp_instance_id').eq('id', storeId).single();
            if (store?.whatsapp_instance_id) {
                await supabase.functions.invoke('whatsapp-evolution', {
                    body: {
                        action: 'sendMessage',
                        instanceId: store.whatsapp_instance_id,
                        number: selectedConversation.customer.whatsapp_number,
                        message: newMessage,
                    },
                });
            }

            setNewMessage('');
            loadMessages(selectedConversation);
            toast({ title: 'Mensagem enviada!' });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const toggleHumanTakeover = async (conversationId: string, enable: boolean) => {
        // @ts-ignore
        await (supabase as any).from('commerce_conversations')
            .update({ status: enable ? 'human_takeover' : 'active' })
            .eq('id', conversationId);
        toast({ title: enable ? 'Modo humano ativado' : 'IA reativada' });
        loadConversations();
        if (selectedConversation?.id === conversationId) {
            setSelectedConversation({ ...selectedConversation, status: enable ? 'human_takeover' : 'active' });
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer?.whatsapp_number?.includes(searchQuery)
    );

    if (loading) return (<SidebarProvider><div className="min-h-screen flex w-full bg-gray-900"><AppSidebar /><main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></main></div></SidebarProvider>);

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gray-900"><AppSidebar /><main className="flex-1 flex flex-col">
                <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b border-gray-700 p-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/commerce')} className="text-gray-400"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
                        <MessageSquare className="w-6 h-6 text-green-400" />
                        <h1 className="text-xl font-bold text-white">Conversas</h1>
                        <Button onClick={loadConversations} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Lista de conversas */}
                    <div className="w-80 border-r border-gray-700 flex flex-col">
                        <div className="p-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className="pl-10 bg-gray-800 border-gray-600 text-white" /></div></div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Nenhuma conversa</div>
                            ) : filteredConversations.map((conv) => (
                                <div key={conv.id} onClick={() => loadMessages(conv)} className={`p-4 border-b border-gray-700 cursor-pointer transition-all ${selectedConversation?.id === conv.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{conv.customer?.name || conv.customer?.whatsapp_number}</p>
                                            <p className="text-xs text-gray-400">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleString('pt-BR') : ''}</p>
                                        </div>
                                        <Badge className={conv.status === 'human_takeover' ? 'bg-orange-500' : conv.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                            {conv.status === 'human_takeover' ? 'Humano' : conv.status === 'active' ? 'IA' : 'Fechada'}
                                        </Badge>
                                    </div>
                                    {conv.current_cart?.items?.length > 0 && (
                                        <p className="text-xs text-green-400 mt-1">🛒 {conv.current_cart.items.length} itens no carrinho</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                                        <div><p className="font-medium text-white">{selectedConversation.customer?.name || 'Cliente'}</p><p className="text-sm text-gray-400">{selectedConversation.customer?.whatsapp_number}</p></div>
                                    </div>
                                    <Button onClick={() => toggleHumanTakeover(selectedConversation.id, selectedConversation.status !== 'human_takeover')} variant="outline" className={`border-gray-600 ${selectedConversation.status === 'human_takeover' ? 'text-orange-400' : 'text-gray-300'}`}>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        {selectedConversation.status === 'human_takeover' ? 'Reativar IA' : 'Assumir Conversa'}
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[70%] rounded-2xl p-3 ${msg.sender_type === 'customer' ? 'bg-gray-700' : msg.sender_type === 'ai' ? 'bg-green-600' : 'bg-blue-600'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {msg.sender_type === 'customer' ? <User className="w-3 h-3" /> : msg.sender_type === 'ai' ? <Bot className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                                    <span className="text-xs text-white/70">{msg.sender_type === 'customer' ? 'Cliente' : msg.sender_type === 'ai' ? 'IA' : 'Você'}</span>
                                                </div>
                                                {msg.message_type === 'image' && msg.media_url && (
                                                    <img src={msg.media_url} alt="" className="rounded-lg max-w-full mb-2" />
                                                )}
                                                <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                                                <p className="text-xs text-white/50 mt-1">{new Date(msg.created_at).toLocaleTimeString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 border-t border-gray-700">
                                    <div className="flex gap-2">
                                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Digite sua mensagem..." className="bg-gray-800 border-gray-600 text-white" />
                                        <Button onClick={sendMessage} className="bg-green-500 hover:bg-green-600"><Send className="w-4 h-4" /></Button>
                                    </div>
                                    {selectedConversation.status !== 'human_takeover' && (
                                        <p className="text-xs text-yellow-400 mt-2">⚠️ A IA está respondendo. Clique em "Assumir Conversa" para responder manualmente.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Selecione uma conversa</p></div></div>
                        )}
                    </div>
                </div>
            </main></div>
        </SidebarProvider>
    );
}
