import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';

// Hook para calcular altura dinâmica da viewport
const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return viewportHeight;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportHeight = useViewportHeight();

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

  // Fechar quando o iframe interno (botão X do cabeçalho) solicitar
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (type === 'clonefy:close_widget') {
        setIsOpen(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  return (
    <>
      {/* Chat Button */}
      <button
        onClick={toggleChat}
        className={`
          fixed z-[9999] 
          rounded-full 
          bg-gradient-to-r from-primary to-primary/80
          hover:from-primary/90 hover:to-primary/70
          text-white shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        style={{
          // Responsive sizing and positioning
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          transform: 'translate3d(0,0,0)', // GPU acceleration
        }}
        title="Chat com Clonefy IA - Tire suas dúvidas"
        aria-label="Abrir chat de suporte"
      >
        {isOpen ? (
          <X size={isMobile ? 20 : 24} aria-hidden="true" />
        ) : (
          <MessageCircle size={isMobile ? 20 : 24} aria-hidden="true" />
        )}
      </button>

      {/* Chat Iframe - Pré-carregado para abertura instantânea */}
      <div
        className={`
          fixed z-[9998] overflow-hidden
          ${isMobile ? '' : 'rounded-xl shadow-2xl'}
          bg-white border border-gray-200
        `}
        style={{
          // Mobile: tela cheia com viewport dinâmico
          // Desktop: posição fixa
          ...(isMobile ? {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`,
            transform: isOpen 
              ? 'translateY(0) translate3d(0,0,0)' 
              : 'translateY(100%) translate3d(0,0,0)',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
            willChange: 'transform, opacity',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            // Safe areas para iPhone
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          } : {
            bottom: '6rem',
            right: '1.5rem',
            width: '400px',
            height: '500px',
            transform: isOpen 
              ? 'scale(1) translate3d(0,0,0)' 
              : 'scale(0.95) translate3d(0,0,0)',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          }),
        }}
      >
        {isLoaded && (
          <iframe
            ref={iframeRef}
            src={`https://clonefy-ai-assistants-studio.lovable.app/embed/chat/7a218984-6ada-4581-b1b6-2119b4771260`}
            className={`border-none ${isMobile ? '' : 'rounded-xl'}`}
            title="Clonefy Chat Support"
            aria-label="Widget de chat Clonefy - Suporte ao cliente"
            allow="microphone; camera"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              transform: 'translate3d(0,0,0)', // GPU acceleration
            }}
          />
        )}
      </div>
    </>
  );
};

export default ChatWidget;