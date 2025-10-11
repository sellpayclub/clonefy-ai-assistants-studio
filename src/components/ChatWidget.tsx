import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Pré-carrega o iframe para abertura instantânea
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000); // Carrega após 1 segundo para não impactar o carregamento inicial
    
    return () => clearTimeout(timer);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Suporte a teclado para fechar chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`
          fixed bottom-6 right-6 z-[9999] 
          w-16 h-16 rounded-full 
          bg-gradient-to-r from-primary to-primary/80
          hover:from-primary/90 hover:to-primary/70
          text-white shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        title="Chat com Clonefy IA - Tire suas dúvidas"
        aria-label="Abrir chat de suporte"
      >
        {isOpen ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <MessageCircle size={24} aria-hidden="true" />
        )}
      </button>

      {/* Chat Iframe - Pré-carregado para abertura instantânea */}
      <div
        className={`
          fixed z-[9998] overflow-hidden
          transition-all duration-200 ease-out
          ${isOpen
            ? isMobile 
              ? 'top-0 left-0 right-0 bottom-0 w-screen h-screen opacity-100 scale-100' 
              : 'bottom-24 right-6 w-[400px] h-[500px] opacity-100 scale-100'
            : isMobile
              ? 'top-0 left-0 right-0 bottom-0 w-screen h-screen opacity-0 scale-95 pointer-events-none'
              : 'bottom-24 right-6 w-[400px] h-[500px] opacity-0 scale-95 pointer-events-none'
          }
          ${isMobile ? '' : 'rounded-xl shadow-2xl'}
          bg-white border border-gray-200
        `}
      >
        {isLoaded && (
          <iframe
            ref={iframeRef}
            src="https://clonefy.app/embed/chat/7a218984-6ada-4581-b1b6-2119b4771260"
            className={`w-full h-full border-none ${isMobile ? '' : 'rounded-xl'}`}
            title="Clonefy Chat Support"
            aria-label="Widget de chat Clonefy - Suporte ao cliente"
            allow="microphone; camera"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none'
            }}
          />
        )}
      </div>
    </>
  );
};

export default ChatWidget;