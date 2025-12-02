import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Send, Search } from 'lucide-react';
import TypingIndicator from '../TypingIndicator';
import { WidgetTemplate, ActionButton } from '@/hooks/useOptimizedWidgetCustomization';

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
    // New template fields
    widget_template: WidgetTemplate;
    bubble_message: string;
    quick_questions: string[];
    action_buttons: ActionButton[];
    show_status_indicator: boolean;
    status_text: string;
  };
}

const OptimizedWidgetPreview: React.FC<WidgetPreviewProps> = ({ customization }) => {
  const [isOpen, setIsOpen] = useState(true); // Deixar aberto por padrão
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', content: customization.welcome_message || 'Olá! Como posso ajudar você hoje?' },
    { role: 'user', content: 'Gostaria de saber mais sobre os serviços.' },
    { role: 'bot', content: 'Claro! Ficarei feliz em explicar nossos serviços. O que especificamente você gostaria de saber?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [headerKey, setHeaderKey] = useState(0);
  const [forceRender, setForceRender] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Forçar re-render quando customization mudar
  useEffect(() => {
    setHeaderKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
  }, [customization.widget_name, customization.avatar_url, customization.primary_color, customization.secondary_color, customization.widget_template, customization.bubble_message, customization.quick_questions, customization.action_buttons]);

  // Forçar re-render do chat quando customization mudar (mesmo com chat aberto)
  useEffect(() => {
    if (isOpen) {
      // Forçar re-render do chat window quando customization mudar
      setForceRender(prev => prev + 1);
    }
  }, [customization.widget_name, customization.avatar_url, isOpen]);

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
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Atualizar mensagens quando customization mudar (incluindo welcome message)
  useEffect(() => {
    setMessages(prev => {
      // Se não há mensagens ou se ainda está com as mensagens padrão, resetar
      if (prev.length === 0 ||
        (prev.length === 3 &&
          prev[0].content === 'Olá! Como posso ajudar você hoje?' &&
          prev[1].content === 'Gostaria de saber mais sobre os serviços.')) {

        return [
          { role: 'bot', content: customization.welcome_message || 'Olá! Como posso ajudar você hoje?' },
          { role: 'user', content: 'Gostaria de saber mais sobre os serviços.' },
          { role: 'bot', content: 'Claro! Ficarei feliz em explicar nossos serviços. O que especificamente você gostaria de saber?' }
        ];
      }

      // Se já houver interação do usuário, apenas atualizar a primeira mensagem se necessário
      if (prev.length > 0 && prev[0].role === 'bot') {
        const newWelcomeMessage = customization.welcome_message || 'Olá! Como posso ajudar você hoje?';
        if (prev[0].content !== newWelcomeMessage) {
          return [
            { role: 'bot', content: newWelcomeMessage },
            ...prev.slice(1)
          ];
        }
      }

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
          <div className="text-gray-400 text-lg mb-2">Chat Inativo</div>
          <div className="text-gray-500 text-sm">
            O chat não será exibido quando estiver inativo
          </div>
        </div>
      </div>
    );
  }

  // Render the template-specific preview elements (before the chat opens)
  const renderTemplatePreview = () => {
    const template = customization.widget_template || 'agent_card';
    const position = customization.button_position;
    const positionClass = position === 'left' ? 'left-4' : 'right-4';

    switch (template) {
      case 'bubble':
        return (
          <>
            {/* Bubble Message */}
            {!isOpen && (
              <div
                className={`absolute ${position === 'left' ? 'left-4' : 'right-4'} bottom-20 max-w-[200px] z-10`}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-lg border relative"
                  style={{ borderColor: `${customization.primary_color}30` }}
                >
                  <p className="text-sm" style={{ color: customization.text_color }}>
                    {customization.bubble_message || 'Oi! Como posso te ajudar?'}
                  </p>
                  {/* Close button */}
                  <button className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs">
                    <X size={10} />
                  </button>
                  {/* Arrow pointing to button */}
                  <div
                    className={`absolute -bottom-2 ${position === 'left' ? 'left-4' : 'right-4'} w-4 h-4 bg-white dark:bg-gray-800 rotate-45 border-r border-b`}
                    style={{ borderColor: `${customization.primary_color}30` }}
                  />
                </div>
              </div>
            )}
            {/* Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`absolute ${positionClass} bottom-4 w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-10`}
              style={styles.button}
              aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
            >
              {isOpen ? (
                <X size={18} />
              ) : customization.button_icon_url ? (
                <img src={customization.button_icon_url} alt="Chat" className="w-5 h-5 object-cover rounded" loading="lazy" />
              ) : (
                <MessageCircle size={18} />
              )}
            </button>
          </>
        );

      case 'agent_card':
        return (
          <>
            {/* Agent Card */}
            {!isOpen && (
              <div
                className={`absolute ${position === 'left' ? 'left-4' : 'right-4'} bottom-20 w-64 z-10`}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border overflow-hidden"
                  style={{ borderColor: `${customization.primary_color}30` }}
                >
                  {/* Header with avatar */}
                  <div
                    className="p-4 flex items-center gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${customization.primary_color}, ${customization.primary_color}dd)`
                    }}
                  >
                    {customization.avatar_url ? (
                      <img
                        src={customization.avatar_url}
                        alt={customization.widget_name}
                        className="w-12 h-12 rounded-full object-cover border-2"
                        style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <MessageCircle size={24} style={{ color: customization.secondary_color }} />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: customization.secondary_color }}>
                        {customization.widget_name || 'Assistente Virtual'}
                      </p>
                      {customization.show_status_indicator && (
                        <p className="text-xs flex items-center gap-1" style={{ color: customization.secondary_color, opacity: 0.9 }}>
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {customization.status_text || 'Online agora'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-sm" style={{ color: customization.text_color }}>
                      {customization.welcome_message || 'Como posso ajudar você hoje?'}
                    </p>

                    {/* Search input (decorative) */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer hover:border-gray-400 transition-colors"
                      style={{ borderColor: `${customization.primary_color}40` }}
                      onClick={() => setIsOpen(true)}
                    >
                      <Search size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Pergunte algo...</span>
                    </div>

                    {/* Action buttons */}
                    {customization.action_buttons && customization.action_buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customization.action_buttons.slice(0, 3).map((btn, index) => (
                          <button
                            key={index}
                            onClick={() => setIsOpen(true)}
                            className="px-3 py-1.5 text-xs rounded-full transition-colors"
                            style={{
                              backgroundColor: customization.primary_color,
                              color: customization.secondary_color
                            }}
                          >
                            {btn.label || `Botão ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`absolute ${positionClass} bottom-4 w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-10`}
              style={styles.button}
              aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
            >
              {isOpen ? (
                <X size={18} />
              ) : customization.button_icon_url ? (
                <img src={customization.button_icon_url} alt="Chat" className="w-5 h-5 object-cover rounded" loading="lazy" />
              ) : (
                <MessageCircle size={18} />
              )}
            </button>
          </>
        );

      case 'quick_questions':
        return (
          <>
            {/* Quick Questions */}
            {!isOpen && customization.quick_questions && customization.quick_questions.length > 0 && (
              <div
                className={`absolute ${position === 'left' ? 'left-4' : 'right-4'} bottom-20 max-w-[220px] z-10 space-y-2`}
              >
                {customization.quick_questions.slice(0, 4).map((question, index) => (
                  question && (
                    <button
                      key={index}
                      onClick={() => setIsOpen(true)}
                      className="block w-full text-left bg-white dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-lg border text-sm hover:shadow-xl transition-all hover:scale-[1.02]"
                      style={{
                        borderColor: `${customization.primary_color}30`,
                        color: customization.text_color
                      }}
                    >
                      {question}
                    </button>
                  )
                ))}
              </div>
            )}
            {/* Button with notification badge */}
            <div className={`absolute ${positionClass} bottom-4 z-10`}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative"
                style={styles.button}
                aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
              >
                {isOpen ? (
                  <X size={18} />
                ) : customization.button_icon_url ? (
                  <img src={customization.button_icon_url} alt="Chat" className="w-5 h-5 object-cover rounded" loading="lazy" />
                ) : (
                  <MessageCircle size={18} />
                )}
              </button>
              {/* Notification badge */}
              {!isOpen && customization.quick_questions && customization.quick_questions.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  {customization.quick_questions.filter(q => q).length}
                </span>
              )}
            </div>
          </>
        );

      case 'classic':
      default:
        return (
          <>
            {/* Dica visual quando chat está fechado */}
            {!isOpen && (
              <div className={`absolute ${position === 'left' ? 'left-20' : 'right-20'} bottom-8 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs shadow-lg animate-pulse z-10`}>
                👆 Clique para testar o chat
                <div className={`absolute top-1/2 -translate-y-1/2 ${position === 'left' ? '-left-1' : '-right-1'} w-2 h-2 bg-primary rotate-45`}></div>
              </div>
            )}
            {/* Chat Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`absolute ${positionClass} bottom-4 w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-10`}
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
          </>
        );
    }
  };

  return (
    <div key={`widget-${forceRender}`} className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] overflow-visible">
      {/* Simulação de uma página web */}
      <div className="bg-white dark:bg-gray-900 rounded-md p-4 h-96 shadow-sm relative overflow-visible">
        <div className="space-y-3 mb-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
        </div>

        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="text-xs text-gray-400 text-center">Preview do Chat - Template: {customization.widget_template || 'agent_card'}</div>
        </div>

        {/* Render template-specific preview */}
        {renderTemplatePreview()}
      </div>

      {/* Chat Window - FORA DO CONTAINER DA PÁGINA SIMULADA */}
      {isOpen && (
        <div
          key={`chat-${forceRender}`}
          className={`absolute ${customization.button_position === 'left' ? 'left-8' : 'right-8'} top-8 w-72 h-80 rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 z-20`}
          style={styles.chat}
        >
          {/* Header */}
          <div
            key={`header-${headerKey}`}
            className="p-4 flex items-center gap-3 relative"
            style={{
              backgroundColor: customization.primary_color,
              background: `linear-gradient(135deg, ${customization.primary_color}, ${customization.primary_color}dd)`,
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={customization.avatar_url || ''}
                alt={customization.widget_name || 'Avatar'}
                className="w-10 h-10 rounded-full object-cover border-2 shadow-sm"
                style={{
                  borderColor: customization.secondary_color + '60',
                  display: customization.avatar_url && customization.avatar_url.trim() !== '' ? 'block' : 'none'
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />

              {/* Fallback avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm"
                style={{
                  backgroundColor: customization.secondary_color + '20',
                  borderColor: customization.secondary_color + '60',
                  display: !customization.avatar_url || customization.avatar_url.trim() === '' ? 'flex' : 'none'
                }}
              >
                <MessageCircle className="h-5 w-5" style={{ color: customization.secondary_color }} />
              </div>
            </div>

            {/* Nome e Status */}
            <div className="flex-1 min-w-0 space-y-1">
              <div
                className="font-bold text-base truncate leading-tight"
                style={{
                  color: customization.secondary_color,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))'
                }}
              >
                {customization.widget_name || 'Assistente Virtual'}
              </div>
              {customization.show_status_indicator && (
                <div
                  className="text-xs flex items-center gap-1"
                  style={{
                    color: customization.secondary_color,
                    opacity: 0.9
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {customization.status_text || 'Online agora'}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4" style={{ height: '240px', overflowY: 'auto' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {msg.role === 'bot' && (
                  <div className="flex-shrink-0">
                    {customization.avatar_url && customization.avatar_url.trim() !== '' ? (
                      <img
                        src={customization.avatar_url}
                        alt={customization.widget_name || 'Avatar'}
                        className="w-6 h-6 rounded-full object-cover mt-1"
                        loading="lazy"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar avatar na mensagem:', customization.avatar_url);
                          e.currentTarget.style.display = 'none';
                          // Mostrar fallback quando avatar falha
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback avatar para mensagens */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${customization.avatar_url && customization.avatar_url.trim() !== '' ? 'hidden' : 'flex'}`}
                      style={{ backgroundColor: `${customization.primary_color}20` }}
                    >
                      <MessageCircle className="h-3 w-3" style={{ color: customization.primary_color }} />
                    </div>
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
                {customization.avatar_url && customization.avatar_url.trim() !== '' ? (
                  <img
                    src={customization.avatar_url}
                    alt={customization.widget_name || 'Avatar'}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}

                {/* Fallback avatar para typing indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${customization.avatar_url && customization.avatar_url.trim() !== '' ? 'hidden' : 'flex'}`}
                  style={{ backgroundColor: `${customization.primary_color}20` }}
                >
                  <MessageCircle className="h-3 w-3" style={{ color: customization.primary_color }} />
                </div>

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
};

export default OptimizedWidgetPreview;