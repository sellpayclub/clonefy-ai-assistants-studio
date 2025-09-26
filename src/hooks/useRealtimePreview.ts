import { useState, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface PreviewData {
  widget_name: string;
  avatar_url: string;
  button_icon_url: string;
  welcome_message: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  button_position: 'left' | 'right';
  is_active: boolean;
}

export function useRealtimePreview(initialData: PreviewData) {
  const [previewData, setPreviewData] = useState<PreviewData>(initialData);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Debounce das mudanças para melhor performance
  const debouncedPreviewData = useDebounce(previewData, 150);
  
  const updatePreviewData = useCallback((field: keyof PreviewData, value: any) => {
    // Clear timeout anterior
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Atualizar imediatamente para responsividade
    setPreviewData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Timeout para operações pesadas se necessário
    updateTimeoutRef.current = setTimeout(() => {
      // Operações adicionais se necessário
    }, 300);
  }, []);
  
  const resetPreviewData = useCallback((newData: PreviewData) => {
    setPreviewData(newData);
  }, []);
  
  return {
    previewData: debouncedPreviewData,
    updatePreviewData,
    resetPreviewData
  };
}