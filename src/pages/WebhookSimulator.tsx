import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    MessageSquare,
    Send,
    Bot,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Play,
    Square,
    RefreshCw,
    Smartphone,
    Zap
} from "lucide-react";

interface Connection {
    id: number;
    nomeinstancia: string;
    idassistentgpt: string;
    emailuser: string;
    threadid: string | null;
    whatsappuser: string | null;
    timeout: string | null;
    message: string | null;
}

interface LogEntry {
    timestamp: string;
    type: 'info' | 'success' | 'error' | 'warning';
    message: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const WebhookSimulator: React.FC = () => {
    const { toast } = useToast();

    // Estados
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [contactNumber, setContactNumber] = useState('5511999999999');
    const [contactName, setContactName] = useState('Cliente Teste');
    const [messageInput, setMessageInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [bufferTime, setBufferTime] = useState(10);
    const [bufferRemaining, setBufferRemaining] = useState(0);
    const [currentBuffer, setCurrentBuffer] = useState<string[]>([]);

    // Carregar conexões do usuário
    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('n8n_fluxogpt')
                .select('*')
                .eq('emailuser', user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setConnections(data || []);

            if (data && data.length > 0) {
                setSelectedConnection(data[0]);
            }

            addLog('info', `${data?.length || 0} conexões WhatsApp encontradas`);
        } catch (error) {
            addLog('error', `Erro ao carregar conexões: ${error}`);
        }
    };

    const addLog = (type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            type,
            message
        }]);
    };

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date()
        }]);
    };

    // Simular envio de mensagem
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConnection) {
            toast({
                title: "Erro",
                description: "Selecione uma conexão e digite uma mensagem",
                variant: "destructive"
            });
            return;
        }

        const messageContent = messageInput.trim();
        setMessageInput('');

        // Adicionar ao buffer
        setCurrentBuffer(prev => [...prev, messageContent]);
        addMessage('user', messageContent);
        addLog('info', `📱 Mensagem recebida: "${messageContent}"`);

        // Se já está processando buffer, apenas adiciona
        if (bufferRemaining > 0) {
            addLog('warning', `⏳ Acumulando mensagem no buffer (${bufferRemaining}s restantes)`);
            return;
        }

        // Iniciar countdown do buffer
        setBufferRemaining(bufferTime);
        addLog('info', `⏰ Iniciando buffer de ${bufferTime} segundos...`);

        // Countdown
        const countdownInterval = setInterval(() => {
            setBufferRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Aguardar buffer
        await new Promise(resolve => setTimeout(resolve, bufferTime * 1000));

        // Processar todas as mensagens acumuladas
        await processBufferedMessages();
    };

    const processBufferedMessages = async () => {
        if (!selectedConnection || currentBuffer.length === 0) return;

        setIsProcessing(true);
        const allMessages = [...currentBuffer];
        setCurrentBuffer([]);

        try {
            const combinedMessage = allMessages.join('\n');
            addLog('success', `📝 Mensagem combinada: "${combinedMessage}"`);
            addLog('info', '🤖 Enviando para OpenAI Assistant...');

            // Simular webhook payload
            const webhookPayload = {
                event: 'messages.upsert',
                instance: selectedConnection.nomeinstancia,
                data: {
                    key: {
                        remoteJid: `${contactNumber}@s.whatsapp.net`,
                        fromMe: false,
                        id: Date.now().toString()
                    },
                    message: {
                        conversation: combinedMessage
                    },
                    pushName: contactName,
                    messageTimestamp: Math.floor(Date.now() / 1000)
                }
            };

            addLog('info', '📤 Chamando Edge Function whatsapp-webhook...');

            // Chamar a Edge Function
            const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
                body: webhookPayload
            });

            if (error) {
                throw error;
            }

            addLog('success', `✅ Resposta recebida: ${JSON.stringify(data)}`);

            // Buscar resposta do OpenAI (simulado - em produção viria do webhook)
            if (data?.status === 'success') {
                addLog('success', '🎉 Mensagem processada com sucesso!');

                // Buscar última mensagem do thread
                await fetchLastAssistantMessage();
            } else if (data?.status === 'buffered') {
                addLog('warning', '⏳ Mensagem em buffer, aguardando mais mensagens...');
            } else {
                addLog('error', `❌ Erro: ${data?.error || 'Desconhecido'}`);
            }

        } catch (error: any) {
            addLog('error', `❌ Erro ao processar: ${error.message}`);
            console.error('Erro:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchLastAssistantMessage = async () => {
        if (!selectedConnection) return;

        try {
            // Atualizar dados da conexão para pegar a resposta
            const { data, error } = await supabase
                .from('n8n_fluxogpt')
                .select('*')
                .eq('id', selectedConnection.id)
                .single();

            if (data) {
                setSelectedConnection(data);
                addLog('info', `📊 Thread ID: ${data.threadid || 'Não criado ainda'}`);
            }

            // Simular resposta do assistente (em produção viria do webhook real)
            // Por enquanto, mostramos que foi enviado com sucesso
            addMessage('assistant', '✅ Resposta enviada pelo WhatsApp (verifique o dispositivo conectado)');

        } catch (error) {
            console.error('Erro ao buscar resposta:', error);
        }
    };

    const clearLogs = () => {
        setLogs([]);
        setMessages([]);
        setCurrentBuffer([]);
        addLog('info', 'Logs limpos');
    };

    const refreshConnection = async () => {
        if (!selectedConnection) return;

        const { data, error } = await supabase
            .from('n8n_fluxogpt')
            .select('*')
            .eq('id', selectedConnection.id)
            .single();

        if (data) {
            setSelectedConnection(data);
            addLog('info', 'Dados da conexão atualizados');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    Simulador de Webhook WhatsApp
                </h1>
                <p className="text-muted-foreground mt-2">
                    Teste a integração WhatsApp → OpenAI → WhatsApp sem usar o n8n
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Configuração */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Configuração
                        </CardTitle>
                        <CardDescription>Configure a simulação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Seletor de Conexão */}
                        <div className="space-y-2">
                            <Label>Conexão WhatsApp</Label>
                            <Select
                                value={selectedConnection?.id?.toString() || ''}
                                onValueChange={(value) => {
                                    const conn = connections.find(c => c.id.toString() === value);
                                    setSelectedConnection(conn || null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma conexão" />
                                </SelectTrigger>
                                <SelectContent>
                                    {connections.map(conn => (
                                        <SelectItem key={conn.id} value={conn.id.toString()}>
                                            {conn.nomeinstancia}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dados da Conexão */}
                        {selectedConnection && (
                            <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Instância:</span>
                                    <span className="font-mono">{selectedConnection.nomeinstancia}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Assistant:</span>
                                    <span className="font-mono text-xs truncate max-w-[150px]">
                                        {selectedConnection.idassistentgpt?.substring(0, 20)}...
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Thread ID:</span>
                                    <span className="font-mono text-xs">
                                        {selectedConnection.threadid || 'Não criado'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Último Contato:</span>
                                    <span className="font-mono text-xs">
                                        {selectedConnection.whatsappuser || 'Nenhum'}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={refreshConnection}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Atualizar Dados
                                </Button>
                            </div>
                        )}

                        <Separator />

                        {/* Dados do Contato Simulado */}
                        <div className="space-y-2">
                            <Label>Número do Contato (simulado)</Label>
                            <Input
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                placeholder="5511999999999"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Nome do Contato</Label>
                            <Input
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="Nome do cliente"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tempo de Buffer (segundos)</Label>
                            <Input
                                type="number"
                                value={bufferTime}
                                onChange={(e) => setBufferTime(parseInt(e.target.value) || 10)}
                                min={1}
                                max={30}
                            />
                            <p className="text-xs text-muted-foreground">
                                Tempo para acumular mensagens antes de enviar ao GPT
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Painel de Chat */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Simulador de Chat
                            {bufferRemaining > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Buffer: {bufferRemaining}s
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>Simule mensagens do WhatsApp</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-[500px]">
                        {/* Área de Mensagens */}
                        <ScrollArea className="flex-1 pr-4 mb-4">
                            <div className="space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Envie uma mensagem para começar</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className="text-xs opacity-70 mt-1">
                                                {msg.timestamp.toLocaleTimeString('pt-BR')}
                                            </p>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Buffer de mensagens pendentes */}
                                {currentBuffer.length > 0 && (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <p className="text-xs text-yellow-600 font-medium mb-2">
                                            📝 Mensagens no buffer ({currentBuffer.length}):
                                        </p>
                                        {currentBuffer.map((msg, i) => (
                                            <p key={i} className="text-sm text-yellow-700">• {msg}</p>
                                        ))}
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Processando com OpenAI...</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input de Mensagem */}
                        <div className="flex gap-2">
                            <Textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Digite uma mensagem..."
                                className="resize-none"
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim() || !selectedConnection || isProcessing}
                                className="px-6"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Painel de Logs */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Play className="h-5 w-5" />
                                Logs do Sistema
                            </span>
                            <Button variant="outline" size="sm" onClick={clearLogs}>
                                <Square className="h-4 w-4 mr-2" />
                                Limpar
                            </Button>
                        </CardTitle>
                        <CardDescription>Acompanhe o processamento em tempo real</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-2">
                                {logs.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">
                                        Nenhum log ainda
                                    </p>
                                )}
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 rounded text-sm flex items-start gap-2 ${log.type === 'error' ? 'bg-red-500/10 text-red-600' :
                                                log.type === 'success' ? 'bg-green-500/10 text-green-600' :
                                                    log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {log.type === 'error' && <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                        {log.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                        {log.type === 'warning' && <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                        {log.type === 'info' && <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                                        <div>
                                            <span className="font-mono text-xs opacity-70">[{log.timestamp}]</span>
                                            <p className="break-all">{log.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Instruções */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>📋 Como usar este simulador</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2">1️⃣ Selecione a Conexão</h4>
                            <p className="text-muted-foreground">
                                Escolha uma conexão WhatsApp que você já criou. O sistema usará o Assistant GPT configurado nela.
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2">2️⃣ Envie Mensagens</h4>
                            <p className="text-muted-foreground">
                                Digite mensagens simulando um cliente. Envie várias em sequência para testar o buffer de 10 segundos.
                            </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-2">3️⃣ Veja os Logs</h4>
                            <p className="text-muted-foreground">
                                Acompanhe todo o fluxo: recebimento, buffer, OpenAI, e envio da resposta pelo WhatsApp real.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WebhookSimulator;
