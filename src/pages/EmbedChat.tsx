import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
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

// Função removida - agora usando TypingMessage component

const EmbedChat = () => {
  const { agentId, assistantId } = useParams();
  const actualAgentId = agentId || assistantId;
  const [agent, setAgent] = useState<Agent | null>(null);
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
      if (!actualAgentId) return;

      try {
        // Carregamento rápido sem delays desnecessários
        const { data, error } = await supabase.functions.invoke('widget-chat', {
          body: {
            action: 'get_agent',
            agentId: actualAgentId
          }
        });

        if (error) throw error;

        if (data.agent) {
          setAgent(data.agent);
          // Add welcome message instantaneamente
          const welcomeMessage = {
            id: '1',
            role: 'assistant' as const,
            content: `Olá! Eu sou ${data.agent.name}. ${data.agent.description || 'Como posso te ajudar hoje?'}`,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } else {
          setError('Agente não encontrado');
        }
      } catch (err) {
        console.error('Error loading agent:', err);
        setError('Erro ao carregar o agente');
      }
    };

    // Executa imediatamente sem timeout
    initializeChat();
  }, [actualAgentId]);

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

    try {
      const { data, error } = await supabase.functions.invoke('widget-chat', {
        body: {
          action: 'send_message',
          agentId: actualAgentId,
          message: input,
          conversationId: conversationId
        }
      });

      if (error) throw error;

      if (data.response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-2 sm:p-4">
      <div className="flex flex-col h-full min-h-[500px] w-full bg-background border border-border rounded-lg shadow-lg
                      max-w-[95vw] max-h-[95vh] 
                      sm:max-w-[450px] sm:max-h-[650px] 
                      md:max-w-[500px] md:max-h-[700px]
                      mx-auto my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-primary/5 rounded-t-lg flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">Online agora</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[82%] sm:max-w-[85%] p-2.5 sm:p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted text-foreground'
                }`}
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
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted p-2.5 sm:p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t bg-background/50 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 text-sm resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="px-3 transition-all duration-200 hover:scale-105 flex-shrink-0"
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