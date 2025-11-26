import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TypingMessage from "@/components/TypingMessage";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface WidgetCustomization {
  primary_color: string;
  secondary_color: string;
  text_color: string;
  welcome_message: string;
  widget_name: string;
  avatar_url?: string;
}

// Função removida - agora usando TypingMessage component

const EmbedChat = () => {
  const { agentId, assistantId } = useParams();
  const actualAgentId = agentId || assistantId;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [customization, setCustomization] = useState<WidgetCustomization | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    // Scroll imediato para melhor UX
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!actualAgentId) {
        setError('ID do agente não encontrado');
        return;
      }

      try {
        console.log('Loading agent:', actualAgentId);
        
        // Carregar agente e customização em paralelo
        const [agentResponse, customizationResponse] = await Promise.all([
          supabase.functions.invoke('widget-chat', {
            body: {
              action: 'get_agent',
              agentId: actualAgentId
            }
          }),
          supabase
            .from('widget_customizations')
            .select('*')
            .eq('assistant_id', actualAgentId)
            .eq('is_active', true)
            .single()
        ]);

        console.log('Agent data received:', agentResponse.data);
        console.log('Customization data received:', customizationResponse.data);

        if (agentResponse.error) {
          console.error('Supabase error:', agentResponse.error);
          throw agentResponse.error;
        }

        // Verificar se há erro na resposta
        if (agentResponse.data?.error) {
          console.error('API error:', agentResponse.data.error);
          setError(agentResponse.data.error === 'Agent not found' 
            ? 'Agente não encontrado' 
            : 'Erro ao carregar o agente');
          return;
        }

        if (agentResponse.data && agentResponse.data.agent) {
          setAgent(agentResponse.data.agent);
          
          // Carregar customização se existir (ignorar erro se não houver customização)
          if (customizationResponse.data && !customizationResponse.error) {
            setCustomization(customizationResponse.data);
          }
          
          // Add welcome message usando customização se disponível
          const welcomeText = customizationResponse.data?.welcome_message || 
                            `Olá! Eu sou ${agentResponse.data.agent.name}. ${agentResponse.data.agent.description || 'Como posso te ajudar hoje?'}`;
          
          const welcomeMessage = {
            id: '1',
            role: 'assistant' as const,
            content: welcomeText,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
          console.log('Agent loaded successfully');
        } else {
          console.error('No agent data in response');
          setError('Agente não encontrado');
        }
      } catch (err) {
        console.error('Error loading agent:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Erro ao carregar o agente. Verifique sua conexão e tente novamente.';
        setError(errorMessage);
      }
    };

    // Executa imediatamente sem timeout
    initializeChat();
  }, [actualAgentId]);

  // Escutar mensagens do widget pai
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, data } = event.data;
      
      switch (type) {
        case 'clonefy:config':
          // Configuração recebida do widget
          console.log('Configuração recebida:', data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !actualAgentId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Notificar widget pai sobre nova mensagem do usuário
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'clonefy:message_sent',
        data: { messageType: 'user' }
      }, '*');
    }

    try {
      const { data, error } = await supabase.functions.invoke('widget-chat', {
        body: {
          action: 'send_message',
          agentId: actualAgentId,
          message: input,
          conversationId: conversationId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Verificar se há erro na resposta
      if (data?.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }

      if (data && data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Notificar widget pai sobre nova mensagem do assistente
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'clonefy:message_sent',
            data: { messageType: 'assistant' }
          }, '*');
        }
        
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
          // Notificar widget pai sobre nova conversa
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'clonefy:conversation_started',
              data: { conversationId: data.conversationId }
            }, '*');
          }
        }
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err instanceof Error && err.message.includes('timeout')
          ? 'A resposta está demorando mais que o esperado. Por favor, tente novamente.'
          : err instanceof Error && err.message.includes('not found')
          ? 'Agente não encontrado. Verifique se o agente está ativo.'
          : 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Aplicar cores customizadas com fallbacks seguros
  const primaryColor = customization?.primary_color || '#0066cc';
  const secondaryColor = customization?.secondary_color || '#f0f0f0';
  const textColor = customization?.text_color || '#1a1a1a';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: '#f5f5f5' }}
    >
      <div 
        className="flex flex-col w-full h-screen sm:h-auto sm:min-h-[500px] sm:max-h-[90vh] sm:rounded-lg shadow-lg
                        sm:max-w-[450px] 
                        md:max-w-[500px] md:max-h-[700px]"
        style={{ 
          backgroundColor: '#ffffff',
          border: `1px solid ${primaryColor}30`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-3 sm:p-4 border-b rounded-t-lg flex-shrink-0"
          style={{ 
            backgroundColor: `${primaryColor}15`,
            borderBottom: `1px solid ${primaryColor}30`
          }}
        >
          {customization?.avatar_url ? (
            <img 
              src={customization.avatar_url} 
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Bot className="h-4 w-4" style={{ color: primaryColor }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: textColor }}>
              {customization?.widget_name || agent.name}
            </h3>
            <p className="text-xs" style={{ color: '#6b7280' }}>Online agora</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'clonefy:close_widget',
                  data: {}
                }, '*');
              } else {
                // Se não estiver em iframe, apenas recarrega a página
                window.location.href = '/';
              }
            }}
            className="h-8 w-8 p-0"
            style={{ 
              backgroundColor: 'transparent',
              color: '#6b7280'
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth min-h-0"
          style={{ 
            backgroundColor: '#ffffff',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                customization?.avatar_url ? (
                  <img 
                    src={customization.avatar_url} 
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Bot className="h-3 w-3" style={{ color: primaryColor }} />
                  </div>
                )
              )}
              <div
                className={`max-w-[80%] sm:max-w-[85%] p-2.5 sm:p-3 rounded-lg break-words`}
                style={message.role === 'user' 
                  ? { 
                      backgroundColor: primaryColor,
                      color: '#ffffff',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }
                  : { 
                      backgroundColor: secondaryColor,
                      color: textColor,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }
                }
              >
                <div className="space-y-2 sm:space-y-3">
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <TypingMessage 
                      content={message.content}
                      speed={30}
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: '#f0f0f0' }}
                >
                  <User className="h-3 w-3" style={{ color: '#6b7280' }} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              {customization?.avatar_url ? (
                <img 
                  src={customization.avatar_url} 
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover mt-1"
                />
              ) : (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center mt-1"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Bot className="h-3 w-3" style={{ color: primaryColor }} />
                </div>
              )}
              <div 
                className="p-2.5 sm:p-3 rounded-lg"
                style={{ backgroundColor: secondaryColor }}
              >
                <div className="flex space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce" 
                    style={{ backgroundColor: primaryColor, animationDelay: '0.1s' }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce" 
                    style={{ backgroundColor: primaryColor, animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input */}
        <div 
          className="p-3 sm:p-4 border-t flex-shrink-0"
          style={{ 
            backgroundColor: '#ffffff',
            borderTop: `1px solid ${primaryColor}20`
          }}
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 text-sm resize-none border-gray-300"
              style={{
                backgroundColor: '#ffffff',
                color: textColor
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="px-3 transition-all duration-200 hover:scale-105 flex-shrink-0"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff'
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedChat;