import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ChatWidget = () => {
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

      {/* Chat Iframe */}
      {isOpen && (
        <div
          className={`
            fixed z-[9998] bg-white shadow-2xl
            transition-all duration-300 ease-in-out
            ${isMobile 
              ? 'inset-0 w-screen h-screen' 
              : 'bottom-24 right-6 w-[450px] h-[650px] rounded-lg'
            }
          `}
        >
          <iframe
            src="https://clonefy.app/embed/chat/7a218984-6ada-4581-b1b6-2119b4771260"
            className={`w-full h-full border-none ${isMobile ? '' : 'rounded-lg'}`}
            title="Clonefy Chat Support"
            loading="lazy"
          />
        </div>
      )}
    </>
  );
};

export default ChatWidget;