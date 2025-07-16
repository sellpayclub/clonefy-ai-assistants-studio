import React, { useState, useEffect } from 'react';
import { HeadphonesIcon, X } from 'lucide-react';

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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

      {/* Support Chat Iframe */}
      {isOpen && (
        <div
          className={`
            fixed z-[9998] overflow-hidden
            transition-all duration-300 ease-in-out
            ${isMobile 
              ? 'inset-0 w-screen h-screen bg-black' 
              : 'bottom-24 right-6 w-[450px] h-[600px] rounded-xl bg-black shadow-2xl'
            }
          `}
        >
          <iframe
            src="https://clonefy.app/embed/chat/d9b3b811-73ea-40c0-bc55-9f0ef87a6091?hideHeader=true&fullscreen=true"
            className={`w-full h-full border-none ${isMobile ? '' : 'rounded-xl'}`}
            title="Clonefy Support Chat"
            loading="lazy"
            allow="microphone; camera"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
            style={{ 
              colorScheme: 'normal',
              backgroundColor: 'transparent',
              minHeight: '100%',
              minWidth: '100%'
            }}
          />
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;