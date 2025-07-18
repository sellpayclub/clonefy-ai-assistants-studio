import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

// Função para formatar o texto das mensagens
const formatMessageContent = (content: string) => {
  // Quebra o texto em parágrafos e formata
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => {
    const trimmedParagraph = paragraph.trim();
    
    // Detecta listas numeradas
    if (/^\d+\./.test(trimmedParagraph)) {
      const items = trimmedParagraph.split(/(?=\d+\.)/g).filter(item => item.trim());
      return (
        <ol key={index} className="list-decimal list-inside space-y-1 ml-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="text-sm leading-relaxed">
              {item.replace(/^\d+\.\s*/, '')}
            </li>
          ))}
        </ol>
      );
    }
    
    // Detecta listas com bullets
    if (/^[-•*]/.test(trimmedParagraph)) {
      const items = trimmedParagraph.split(/(?=[-•*])/g).filter(item => item.trim());
      return (
        <ul key={index} className="list-disc list-inside space-y-1 ml-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="text-sm leading-relaxed">
              {item.replace(/^[-•*]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    
    // Detecta títulos/cabeçalhos (linhas que terminam com :)
    if (trimmedParagraph.endsWith(':') && trimmedParagraph.length < 100) {
      return (
        <h4 key={index} className="font-semibold text-sm mb-1 text-foreground">
          {trimmedParagraph}
        </h4>
      );
    }
    
    // Quebra linhas simples dentro do parágrafo
    const lines = trimmedParagraph.split('\n').filter(line => line.trim());
    return (
      <div key={index} className="space-y-1">
        {lines.map((line, lineIndex) => (
          <p key={lineIndex} className="text-sm leading-relaxed break-words">
            {line.trim()}
          </p>
        ))}
      </div>
    );
  });
};

const EmbedChat = () => {
  const { agentId } = useParams();
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
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!agentId) return;

      try {
        const { data, error } = await supabase.functions.invoke('widget-chat', {
          body: {
            action: 'get_agent',
            agentId: agentId
          }
        });

        if (error) throw error;

        if (data.agent) {
          setAgent(data.agent);
          // Add welcome message
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Olá! Eu sou ${data.agent.name}. ${data.agent.description || 'Como posso te ajudar hoje?'}`,
            timestamp: new Date()
          }]);
        } else {
          setError('Agente não encontrado');
        }
      } catch (err) {
        console.error('Error loading agent:', err);
        setError('Erro ao carregar o agente');
      }
    };

    initializeChat();
  }, [agentId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !agentId) return;

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
          agentId: agentId,
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
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full max-w-[400px] bg-background border border-border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-primary/5 rounded-t-lg">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{agent.name}</h3>
          <p className="text-xs text-muted-foreground">Online agora</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth">
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
              className={`max-w-[85%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted text-foreground'
              }`}
            >
              <div className="space-y-3">
                {message.role === 'user' ? (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                ) : (
                  formatMessageContent(message.content)
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
            <div className="bg-muted p-3 rounded-lg">
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
      <div className="p-4 border-t bg-background/50">
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
            className="px-3 transition-all duration-200 hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmbedChat;