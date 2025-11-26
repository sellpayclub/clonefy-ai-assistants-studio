import React from 'react';
import { useLocation } from 'react-router-dom';
import SupportChatWidget from './SupportChatWidget';

const ConditionalSupportWidget = () => {
  const location = useLocation();
  
  // Não mostrar o widget de suporte nas rotas de embed, auth e customização
  const hiddenPaths = ['/widget-customization'];
  const hiddenPathPrefixes = ['/embed/', '/auth', '/embed-chat/'];
  
  const shouldShow = !hiddenPaths.includes(location.pathname) && 
                     !hiddenPathPrefixes.some(prefix => location.pathname.includes(prefix));
  
  if (!shouldShow) {
    return null;
  }
  
  return <SupportChatWidget />;
};

export default ConditionalSupportWidget;