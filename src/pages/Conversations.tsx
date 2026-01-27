import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User as UserIcon, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptimizedConversations } from "@/hooks/useOptimizedConversations";
import { performanceCache } from "@/utils/performance";
import TypingMessage from "@/components/TypingMessage";
import TypingIndicator from "@/components/TypingIndicator";

interface Assistant {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  assistant_id: string;
  assistants: { name: string };
  messages: Message[];
  updated_at: string;
}

// Componente de mensagem memoizado para performance
const MessageItem = memo<{ message: Message }>(({ message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
      <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
        {message.role === 'user' ? (
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <UserIcon className="h-4 w-4" />
          </div>
        ) : (
          <div className="bg-secondary text-secondary-foreground rounded-full p-2">
            <Bot className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className={`rounded-lg p-3 max-w-full ${
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground'
      }`}>
        {message.role === 'user' ? (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </>
        ) : (
          <TypingMessage 
            content={message.content}
            speed={25}
            className="text-sm"
          >
            <p className="text-xs opacity-70 mb-2">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </TypingMessage>
        )}
      </div>
    </div>
  </div>
));

MessageItem.displayName = 'MessageItem';

const Conversations = memo(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Hook otimizado para conversas
  const {
    conversations,
    loadConversations,
    loadMessages: loadOptimizedMessages,
    sendMessage: sendOptimizedMessage,
    createThread,
    deleteConversation: deleteOptimizedConversation,
  } = useOptimizedConversations(session);

  // Scroll automático otimizado
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (!session?.user) {
              navigate('/auth');
              return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await loadAssistants();
              setLoading(false);
            }
          }
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
          return;
        }
        
        await loadAssistants();
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Carregamento otimizado de assistentes
  const loadAssistants = useCallback(async () => {
    if (!session) return;

    const cacheKey = `assistants_${session.user.id}`;
    const cached = performanceCache.get(cacheKey);
    
    if (cached) {
      setAssistants(cached);
      return;
    }

    try {
      const response = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.error && response.data?.assistants) {
        const assistantsList = response.data.assistants;
        setAssistants(assistantsList);
        performanceCache.set(cacheKey, assistantsList, 10);
      }
    } catch (error: any) {
      console.error('Error loading assistants:', error);
    }
  }, [session]);

  // Carregar assistentes e conversas quando a sessão estiver disponível
  useEffect(() => {
    if (session) {
      loadAssistants();
      loadConversations();
    }
  }, [session, loadAssistants, loadConversations]);

  // Carregamento otimizado de mensagens
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const messagesData = await loadOptimizedMessages(conversationId);
      setMessages(messagesData);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar mensagens",
      });
    }
  }, [loadOptimizedMessages, toast]);

  // Envio otimizado de mensagem
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    const messageText = newMessage;
    setNewMessage("");

    // Adicionar mensagem do usuário imediatamente
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Mostrar indicador de digitação
      setIsTyping(true);
      
      await sendOptimizedMessage(selectedConversation, messageText);
      
      // Aguardar um pouco e recarregar mensagens para pegar a resposta da IA
      setTimeout(async () => {
        await loadMessages(selectedConversation);
        setIsTyping(false);
      }, 1000); // 1 segundo de delay para simular digitação
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao enviar mensagem",
      });
      setNewMessage(messageText); // Restaurar mensagem em caso de erro
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, sendOptimizedMessage, loadMessages, toast]);

  // Criação otimizada de conversa
  const createNewConversation = useCallback(async () => {
    if (!selectedAssistant || creatingThread) {
      if (!selectedAssistant) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Selecione um assistente primeiro",
        });
      }
      return;
    }

    setCreatingThread(true);
    try {
      const threadData = await createThread(selectedAssistant);
      
      if (threadData?.conversation?.id) {
        setSelectedConversation(threadData.conversation.id);
        setMessages([]);
        await loadConversations(); // Recarregar lista de conversas
        
        // Remover toast desnecessário - ação já é visível
      }
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao criar conversa",
      });
    } finally {
      setCreatingThread(false);
    }
  }, [selectedAssistant, creatingThread, createThread, loadConversations, toast]);

  // Seleção otimizada de conversa
  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    setMessages([]);
    loadMessages(conversationId);
  }, [loadMessages]);

  // Exclusão otimizada de conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteOptimizedConversation(conversationId);
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      await loadConversations();
      
      // Remover toast desnecessário - ação já é visível
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao excluir conversa",
      });
    }
  }, [deleteOptimizedConversation, selectedConversation, loadConversations, toast]);

  // Apagar todas as conversas
  const deleteAllConversations = useCallback(async () => {
    if (conversations.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há conversas para apagar",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja apagar TODAS as ${conversations.length} conversas? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Apagar todas as conversas uma por uma
      for (const conversation of conversations) {
        await deleteOptimizedConversation(conversation.id);
      }
      
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
      
      toast({
        title: "Sucesso",
        description: "Todas as conversas foram apagadas",
      });
    } catch (error: any) {
      console.error('Error deleting all conversations:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao apagar conversas",
      });
    }
  }, [conversations, deleteOptimizedConversation, loadConversations, toast]);

  // Componentes memoizados
  const ConversationsList = useMemo(() => (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card 
          key={conversation.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedConversation === conversation.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => selectConversation(conversation.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium truncate">
                {conversation.title || 'Nova Conversa'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conversation.id);
                }}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {conversation.assistants?.name}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  ), [conversations, selectedConversation, selectConversation, deleteConversation]);

  const MessagesList = useMemo(() => (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  ), [messages, isTyping]);

  if (loading) {
    return (
      <main className="flex-1 p-4">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando conversas...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="border-b p-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Conversas
          </h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Conversas */}
        <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b space-y-4">
                <Select
                  value={selectedAssistant}
                  onValueChange={setSelectedAssistant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map(assistant => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={createNewConversation}
                  className="w-full"
                  disabled={!selectedAssistant || creatingThread}
                >
                  {creatingThread ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conversa
                    </>
                  )}
                </Button>

                {conversations.length > 0 && (
                  <Button 
                    onClick={deleteAllConversations}
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Apagar Todas ({conversations.length})
                  </Button>
                )}
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {ConversationsList}
              </ScrollArea>
            </div>

            {/* Área de Chat */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {MessagesList}
                  
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={sendingMessage}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma conversa ou crie uma nova</p>
                  </div>
                </div>
              )}
        </div>
      </div>
    </main>
  );
});

Conversations.displayName = 'Conversations';

export default Conversations;