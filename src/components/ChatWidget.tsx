import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pré-carrega o iframe para abertura instantânea
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000); // Carrega após 1 segundo para não impactar o carregamento inicial
    
    return () => clearTimeout(timer);
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

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
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        title="Chat com clonefy ia tira duvidas"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
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