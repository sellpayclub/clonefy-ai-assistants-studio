import React, { useEffect } from 'react';

const SupportChatWidget = () => {
  useEffect(() => {
    const assistantId = '7a218984-6ada-4581-b1b6-2119b4771260';
    // Usar versão local em desenvolvimento, produção usa clonefy.app
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const scriptUrl = isDev 
      ? '/embed-widget-v2.js' 
      : 'https://clonefy.app/embed-widget-v2.js';

    // Verifica se o script já foi carregado para evitar duplicatas
    // Verifica tanto por URL quanto por data-assistant-id
    const existingScript = document.querySelector(`script[data-assistant-id="${assistantId}"]`) ||
      document.querySelector(`script[src="${scriptUrl}"]`);

    if (existingScript) {
      return;
    }

    // Cria e carrega o script do widget Clonefy
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.dataset.assistantId = assistantId;
    script.async = true;
    document.head.appendChild(script);

    // Cleanup: remove o script quando o componente for desmontado
    return () => {
      const scriptToRemove = document.querySelector(`script[data-assistant-id="${assistantId}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  // Este componente não renderiza nada, apenas carrega o script
  return null;
};

export default SupportChatWidget;