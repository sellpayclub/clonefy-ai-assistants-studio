import { useState, useEffect, useRef, memo } from "react";
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
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import SupportChatWidget from "@/components/SupportChatWidget";

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

const Conversations = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (!session?.user) {
              navigate('/auth');
              return;
            }

            // Carregar dados sempre que a sessão mudar
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setTimeout(async () => {
                if (isMounted) {
                  await loadData();
                  setLoading(false);
                }
              }, 100);
            }
          }
        );

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
          return;
        }
        
        // Carregar dados iniciais
        await loadData();
        setLoading(false);
        
        // Verificar agente pré-selecionado
        const savedAssistantId = localStorage.getItem('selectedAssistantId');
        const autoStart = localStorage.getItem('autoStartConversation');
        if (savedAssistantId && isMounted) {
          setSelectedAssistant(savedAssistantId);
          localStorage.removeItem('selectedAssistantId');
          localStorage.removeItem('selectedAssistantName');
          
          if (autoStart === 'true') {
            localStorage.removeItem('autoStartConversation');
            setTimeout(() => {
              if (isMounted) {
                startNewConversationAuto(savedAssistantId);
              }
            }, 1000);
          }
        }

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
  }, []); // Array vazio - só executa uma vez

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    // Aguarda a sessão estar disponível
    let currentSession = session;
    if (!currentSession) {
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;
    }

    if (!currentSession) {
      return;
    }

    try {
      // Load assistants
      const assistantsResponse = await supabase.functions.invoke('openai-assistants', {
        body: { action: 'list' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (!assistantsResponse.error && assistantsResponse.data?.assistants) {
        setAssistants(assistantsResponse.data.assistants);
      } else {
        setAssistants([]);
      }

      // Load conversations
      const conversationsResponse = await supabase.functions.invoke('chat-api', {
        body: { action: 'get_conversations' },
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (!conversationsResponse.error && conversationsResponse.data?.conversations) {
        setConversations(conversationsResponse.data.conversations);
      } else {
        setConversations([]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!session) return;

    try {
      const response = await supabase.functions.invoke('chat-api', {
        body: { action: 'get_messages', conversationId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw response.error;
      }

      setMessages(response.data.messages || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startNewConversationAuto = async (assistantId: string) => {
    if (!session) return;

    try {
      const assistant = assistants.find(a => a.id === assistantId);
      if (!assistant) return;
      
      const response = await supabase.functions.invoke('chat-api', {
        body: { 
          action: 'create_thread', 
          assistantId: assistantId,
          title: `Conversa com ${assistant.name}`
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Nova conversa criada!",
        description: `Conversa iniciada com ${assistant.name}`,
      });

      await loadData();
      setSelectedConversation(response.data.conversation.id);
      setMessages([]);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startNewConversation = async () => {
    if (!session || !selectedAssistant) return;

    try {
      const assistant = assistants.find(a => a.id === selectedAssistant);
      
      const response = await supabase.functions.invoke('chat-api', {
        body: { 
          action: 'create_thread', 
          assistantId: selectedAssistant,
          title: `Conversa com ${assistant?.name}`
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Nova conversa criada!",
        description: `Conversa iniciada com ${assistant?.name}`,
      });

      await loadData();
      setSelectedConversation(response.data.conversation.id);
      setMessages([]);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedConversation || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await supabase.functions.invoke('chat-api', {
        body: { 
          action: 'send_message', 
          conversationId: selectedConversation,
          content: messageContent
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw response.error;
      }

      // Remove temp message and add real messages
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      await loadMessages(selectedConversation);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!session) return;
    
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('chat-api', {
        body: { action: 'delete_conversation', conversationId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Conversa excluída!",
        description: "A conversa foi removida com sucesso.",
      });

      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      await loadData();
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erro ao excluir conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* Conversations Sidebar */}
          <div className="w-full lg:w-80 border-r border-b lg:border-b-0 bg-muted/20 flex flex-col min-h-[300px] lg:min-h-full max-h-[50vh] lg:max-h-none">
            <div className="p-3 md:p-4 border-b">
              <div className="flex items-center gap-2 mb-4">
                <div className="lg:hidden">
                  <SidebarTrigger />
                </div>
                <h2 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                  Conversas
                </h2>
              </div>
              
              {/* New Conversation */}
              <div className="space-y-2">
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Escolha um agente" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border border-border shadow-lg">
                    {assistants.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">
                        <p className="text-sm">
                          {loading ? t('conversations.loadingAgents') : t('conversations.noAgents')}
                        </p>
                        {!loading && (
                          <Button 
                            size="sm" 
                            variant="link" 
                            onClick={() => navigate('/assistants')}
                            className="text-xs mt-1"
                          >
                            Criar primeiro agente
                          </Button>
                        )}
                      </div>
                    ) : (
                      assistants.map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          <div className="flex items-center gap-2">
                            <Bot className="h-3 w-3" />
                            <span className="truncate">{assistant.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={startNewConversation} 
                  disabled={!selectedAssistant}
                  className="w-full text-sm"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova Conversa
                </Button>
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className={`cursor-pointer hover:bg-accent transition-colors ${selectedConversation === conversation.id ? 'bg-accent' : ''}`}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      loadMessages(conversation.id);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {conversation.assistants.name}
                          </Badge>
                          {conversation.messages.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {conversation.messages[conversation.messages.length - 1]?.content}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-full">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="lg:hidden">
                      <SidebarTrigger />
                    </div>
                    <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <h3 className="font-semibold text-sm md:text-base truncate">
                      {conversations.find(c => c.id === selectedConversation)?.assistants.name}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3 md:p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] md:max-w-[70%] p-2 md:p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-2 md:gap-3 justify-start">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        </div>
                        <div className="bg-muted p-2 md:p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 md:p-4 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      disabled={sending}
                      className="flex-1 text-sm"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} size="sm" className="px-3">
                      <Send className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Selecione uma conversa</h3>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {t('conversations.selectConversation')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        
        {/* Support Chat Widget for internal system */}
        <SupportChatWidget />
      </div>
    </SidebarProvider>
  );
};

export default memo(Conversations);