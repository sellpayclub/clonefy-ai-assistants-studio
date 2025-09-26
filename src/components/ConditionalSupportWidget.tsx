import React from 'react';
import { useLocation } from 'react-router-dom';
import SupportChatWidget from './SupportChatWidget';

const ConditionalSupportWidget = () => {
  const location = useLocation();
  
  // Não mostrar o widget de suporte na página de customização
  const hiddenPaths = ['/widget-customization'];
  const shouldShow = !hiddenPaths.includes(location.pathname);
  
  if (!shouldShow) {
    return null;
  }
  
  return <SupportChatWidget />;
};

export default ConditionalSupportWidget;