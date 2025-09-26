import React, { useState, memo, useMemo, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import TypingIndicator from '../TypingIndicator';

interface WidgetPreviewProps {
  customization: {
    widget_name: string;
    avatar_url: string;
    button_icon_url: string;
    welcome_message: string;
    primary_color: string;
    secondary_color: string;
    text_color: string;
    button_position: 'left' | 'right';
    is_active: boolean;
  };
}

const OptimizedWidgetPreview: React.FC<WidgetPreviewProps> = memo(({ customization }) => {
  const [isOpen, setIsOpen] = useState(true); // Deixar aberto por padrão
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', content: customization.welcome_message || 'Olá! Como posso ajudar você hoje?' },
    { role: 'user', content: 'Gostaria de saber mais sobre os serviços.' },
    { role: 'bot', content: 'Claro! Ficarei feliz em explicar nossos serviços. O que especificamente você gostaria de saber?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug - log customization data
  console.log('🎨 Widget Customization Data (COMPLETE):', {
    widget_name: customization.widget_name,
    avatar_url: customization.avatar_url,
    button_icon_url: customization.button_icon_url,
    welcome_message: customization.welcome_message,
    primary_color: customization.primary_color,
    secondary_color: customization.secondary_color,
    text_color: customization.text_color,
    button_position: customization.button_position,
    is_active: customization.is_active
  });
  
  console.log('🔍 Header Data Check:', {
    hasName: !!customization.widget_name,
    nameValue: customization.widget_name,
    hasAvatar: !!customization.avatar_url,
    avatarValue: customization.avatar_url
  });

  // Simular respostas automáticas - memoizada para performance
  const simulateResponse = useCallback((userMessage: string) => {
    const responses = [
      'Obrigado pela sua mensagem! Como posso ajudar você melhor?',
      'Entendo sua situação. Vamos encontrar a melhor solução para você.',
      'Interessante! Conte-me mais detalhes sobre isso.',
      'Perfeito! Vou verificar as opções disponíveis para você.',
      'Claro! Ficarei feliz em esclarecer suas dúvidas.',
      'Excelente pergunta! Deixe-me explicar isso para você.',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  // Função para enviar mensagem
  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setIsTyping(true);

    // Simular resposta do bot após delay
    timeoutRef.current = setTimeout(() => {
      const botResponse = simulateResponse(userMessage);
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      setIsTyping(false);
      timeoutRef.current = null;
    }, 1500 + Math.random() * 1000); // 1.5-2.5s delay
  }, [message, simulateResponse]);

  // Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Scroll automático para nova mensagem
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Efeito para scroll automático quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Atualizar APENAS a primeira mensagem (welcome) quando customization mudar
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      
      // Só atualizar a primeira mensagem se ela ainda for a mensagem de boas-vindas padrão
      const firstMsg = prev[0];
      if (firstMsg.role === 'bot' && (
        firstMsg.content === 'Olá! Como posso ajudar você hoje?' ||
        firstMsg.content.includes('Gostaria de saber mais sobre os serviços')
      )) {
        // Reset completo apenas se ainda estiver com mensagens iniciais
        return [
          { role: 'bot', content: customization.welcome_message || 'Olá! Como posso ajudar você hoje?' },
          { role: 'user', content: 'Gostaria de saber mais sobre os serviços.' },
          { role: 'bot', content: 'Claro! Ficarei feliz em explicar nossos serviços. O que especificamente você gostaria de saber?' }
        ];
      }
      
      // Se já houver interação do usuário, manter mensagens
      return prev;
    });
  }, [customization.welcome_message]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoize styles para evitar recalculos
  const styles = useMemo(() => ({
    button: {
      backgroundColor: customization.primary_color,
      color: customization.secondary_color,
      [customization.button_position]: '24px'
    },
    chat: {
      backgroundColor: customization.secondary_color,
      color: customization.text_color,
      [customization.button_position]: '24px'
    },
    header: {
      backgroundColor: customization.primary_color,
      color: customization.secondary_color
    },
    botMessage: {
      backgroundColor: `${customization.primary_color}20`,
      color: customization.text_color
    },
    userMessage: {
      backgroundColor: customization.primary_color,
      color: customization.secondary_color
    }
  }), [customization]);

  if (!customization.is_active) {
    return (
      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Widget Inativo</div>
          <div className="text-gray-500 text-sm">
            O widget não será exibido quando estiver inativo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] overflow-visible">
      {/* Simulação de uma página web */}
      <div className="bg-white dark:bg-gray-900 rounded-md p-4 h-96 shadow-sm relative overflow-visible">
        <div className="space-y-3 mb-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
        </div>
        
        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="text-xs text-gray-400 text-center">Preview do Widget</div>
        </div>

        {/* Dica visual quando chat está fechado */}
        {!isOpen && (
          <div className={`absolute ${customization.button_position === 'left' ? 'left-20' : 'right-20'} bottom-8 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs shadow-lg animate-pulse z-10`}>
            👆 Clique para testar o chat
            <div className={`absolute top-1/2 -translate-y-1/2 ${customization.button_position === 'left' ? '-left-1' : '-right-1'} w-2 h-2 bg-primary rotate-45`}></div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute ${customization.button_position === 'left' ? 'left-4' : 'right-4'} bottom-4 w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-10`}
          style={styles.button}
          aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
        >
          {isOpen ? (
            <X size={18} />
          ) : customization.button_icon_url ? (
            <img 
              src={customization.button_icon_url} 
              alt="Chat" 
              className="w-5 h-5 object-cover rounded"
              loading="lazy"
            />
          ) : (
            <MessageCircle size={18} />
          )}
        </button>
      </div>

      {/* Chat Window - FORA DO CONTAINER DA PÁGINA SIMULADA */}
      {isOpen && (
        <div
          className={`absolute ${customization.button_position === 'left' ? 'left-8' : 'right-8'} top-8 w-72 h-80 rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 z-20`}
          style={styles.chat}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3"
            style={styles.header}
          >
            {customization.avatar_url ? (
              <img 
                src={customization.avatar_url} 
                alt={customization.widget_name || 'Avatar'}
                className="w-8 h-8 rounded-full object-cover"
                loading="lazy"
                onError={(e) => {
                  console.log('❌ Erro ao carregar avatar:', customization.avatar_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1">
              <div 
                className="font-medium text-sm" 
                style={{ 
                  color: customization.secondary_color,
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}
              >
                {customization.widget_name || 'Assistente Virtual'}
              </div>
              <div 
                className="text-xs opacity-80" 
                style={{ 
                  color: customization.secondary_color,
                  fontSize: '11px'
                }}
              >
                Online agora
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4" style={{ height: '240px', overflowY: 'auto' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {msg.role === 'bot' && (
                  <div className="flex-shrink-0">
                    {customization.avatar_url ? (
                      <img 
                        src={customization.avatar_url} 
                        alt={customization.widget_name || 'Avatar'}
                        className="w-6 h-6 rounded-full object-cover mt-1"
                        loading="lazy"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar avatar na mensagem:', customization.avatar_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mt-1">
                        <MessageCircle className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                )}
                <div 
                  className="max-w-xs px-3 py-2 rounded-lg text-sm"
                  style={msg.role === 'user' ? styles.userMessage : styles.botMessage}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                {customization.avatar_url ? (
                  <img 
                    src={customization.avatar_url} 
                    alt={customization.widget_name || 'Avatar'}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mt-1">
                    <MessageCircle className="h-3 w-3" />
                  </div>
                )}
                <div className="flex space-x-1 items-center px-3 py-2 rounded-lg" style={styles.botMessage}>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {/* Elemento para scroll automático */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-center text-muted-foreground mb-2" id="chat-input-help">
                  💬 Preview Interativo - Digite para testar
                </div>
            <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem de teste..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{
                      borderColor: `${customization.primary_color}40`
                    }}
                    disabled={isTyping}
                    aria-label="Campo de mensagem para testar o chat"
                    aria-describedby="chat-input-help"
                  />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={styles.userMessage}
                aria-label="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </div>
           </div>
        </div>
      )}
    </div>
  );
});

OptimizedWidgetPreview.displayName = 'OptimizedWidgetPreview';

export default OptimizedWidgetPreview;