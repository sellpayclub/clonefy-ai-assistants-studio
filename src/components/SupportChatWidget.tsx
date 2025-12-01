import React, { useEffect } from 'react';

const SupportChatWidget = () => {
  useEffect(() => {
    // Verifica se o script já foi carregado para evitar duplicatas
    if (document.querySelector('script[src="https://clonefy.app/embed-widget-v2.js"]')) {
      return;
    }

    // Cria e carrega o script do widget Clonefy
    const script = document.createElement('script');
    script.src = 'https://clonefy.app/embed-widget-v2.js';
    script.dataset.assistantId = '7a218984-6ada-4581-b1b6-2119b4771260';
    script.async = true;
    document.head.appendChild(script);

    // Cleanup: remove o script quando o componente for desmontado
    return () => {
      const existingScript = document.querySelector('script[src="https://clonefy.app/embed-widget-v2.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Este componente não renderiza nada, apenas carrega o script
  return null;
};

export default SupportChatWidget;