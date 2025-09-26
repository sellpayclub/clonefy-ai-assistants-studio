import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

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

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ customization }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Forçar re-render quando customization mudar
  useEffect(() => {
    // Este efeito garante que o preview seja atualizado em tempo real
  }, [customization]);

  const buttonStyle = {
    backgroundColor: customization.primary_color,
    color: customization.secondary_color,
    [customization.button_position]: '24px'
  };

  const chatStyle = {
    backgroundColor: customization.secondary_color,
    color: customization.text_color,
    [customization.button_position]: '24px'
  };

  const headerStyle = {
    backgroundColor: customization.primary_color,
    color: customization.secondary_color
  };

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
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-8 min-h-[400px] overflow-hidden">
      {/* Simulação de uma página web */}
      <div className="bg-white dark:bg-gray-900 rounded-md p-6 h-full shadow-sm">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        
        <div className="absolute top-4 left-4 right-4 bottom-4 pointer-events-none">
          <div className="text-xs text-gray-400 mb-2 text-center">Preview do Widget</div>
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={buttonStyle}
      >
        {isOpen ? (
          <X size={20} />
        ) : customization.button_icon_url ? (
          <img 
            src={customization.button_icon_url} 
            alt="Chat" 
            className="w-6 h-6 object-cover rounded"
          />
        ) : (
          <MessageCircle size={20} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 z-40 w-80 h-96 rounded-xl shadow-2xl border overflow-hidden transition-all duration-300"
          style={chatStyle}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center gap-3"
            style={headerStyle}
          >
            {customization.avatar_url && (
              <img 
                src={customization.avatar_url} 
                alt={customization.widget_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-medium text-sm">{customization.widget_name}</div>
              <div className="text-xs opacity-80">Online agora</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4" style={{ height: '240px', overflowY: 'auto' }}>
            {/* Welcome message */}
            <div className="flex items-start gap-2">
              {customization.avatar_url && (
                <img 
                  src={customization.avatar_url} 
                  alt={customization.widget_name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1"
                />
              )}
              <div 
                className="max-w-xs px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: `${customization.primary_color}20`,
                  color: customization.text_color
                }}
              >
                {customization.welcome_message}
              </div>
            </div>

            {/* Sample user message */}
            <div className="flex justify-end">
              <div 
                className="max-w-xs px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: customization.primary_color,
                  color: customization.secondary_color
                }}
              >
                Olá! Gostaria de saber mais sobre os serviços.
              </div>
            </div>

            {/* Sample bot response */}
            <div className="flex items-start gap-2">
              {customization.avatar_url && (
                <img 
                  src={customization.avatar_url} 
                  alt={customization.widget_name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1"
                />
              )}
              <div 
                className="max-w-xs px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: `${customization.primary_color}20`,
                  color: customization.text_color
                }}
              >
                Claro! Ficarei feliz em ajudar você com informações sobre nossos serviços. O que você gostaria de saber especificamente?
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{
                  borderColor: `${customization.primary_color}40`
                }}
              />
              <button
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: customization.primary_color,
                  color: customization.secondary_color
                }}
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

export default WidgetPreview;