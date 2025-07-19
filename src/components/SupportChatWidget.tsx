import React, { useState, useEffect, useRef } from 'react';
import { HeadphonesIcon, X } from 'lucide-react';

const SupportChatWidget = () => {
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
      {/* Support Chat Button */}
      <button
        onClick={toggleChat}
        className={`
          fixed bottom-24 right-20 z-[9999] 
          w-14 h-14 rounded-full 
          bg-gradient-to-r from-blue-600 to-blue-500
          hover:from-blue-700 hover:to-blue-600
          text-white shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-180' : 'rotate-0'}
        `}
        title="Suporte Técnico - Clonefy"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <HeadphonesIcon size={24} />
        )}
      </button>

      {/* Support Chat Iframe - Pré-carregado para abertura instantânea */}
      <div
        className={`
          fixed z-[9998] overflow-hidden
          transition-all duration-200 ease-out
          ${isOpen
            ? isMobile 
              ? 'inset-0 w-screen h-screen bg-black opacity-100 scale-100' 
              : 'bottom-24 right-6 w-[450px] h-[600px] rounded-xl bg-black shadow-2xl opacity-100 scale-100'
            : isMobile
              ? 'inset-0 w-screen h-screen bg-black opacity-0 scale-95 pointer-events-none'
              : 'bottom-24 right-6 w-[450px] h-[600px] rounded-xl bg-black shadow-2xl opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
        {isLoaded && (
          <iframe
            ref={iframeRef}
            src="https://clonefy.app/embed/chat/d9b3b811-73ea-40c0-bc55-9f0ef87a6091?hideHeader=true&fullscreen=true"
            className={`w-full h-full border-none ${isMobile ? '' : 'rounded-xl'}`}
            title="Clonefy Support Chat"
            allow="microphone; camera"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
            style={{ 
              colorScheme: 'normal',
              backgroundColor: 'transparent',
              minHeight: '100%',
              minWidth: '100%'
            }}
          />
        )}
      </div>
    </>
  );
};

export default SupportChatWidget;