import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WidgetCustomization {
  id?: string;
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

// Cache local para evitar requests desnecessários
const customizationCache = new Map<string, { data: WidgetCustomization; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useOptimizedWidgetCustomization = (assistantId: string) => {
  const [customization, setCustomization] = useState<WidgetCustomization | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadCustomization = useCallback(async () => {
    if (!assistantId) {
      setCustomization(null);
      return;
    }

    console.log('🔄 Carregando personalização para assistente:', assistantId);

    // Verificar cache local
    const cached = customizationCache.get(assistantId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando dados do cache para assistente:', assistantId);
      setCustomization(cached.data);
      return;
    }

    // Cancelar request anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('widget_customizations')
        .select('*')
        .eq('assistant_id', assistantId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const customizationData = {
          ...data,
          button_position: (data.button_position as 'left' | 'right') || 'right'
        };
        
        console.log('✅ Personalização carregada do banco:', customizationData);
        
        // Atualizar cache
        customizationCache.set(assistantId, {
          data: customizationData,
          timestamp: now
        });
        
        setCustomization(customizationData);
      } else {
        console.log('⚠️ Nenhuma personalização encontrada para assistente:', assistantId);
        setCustomization(null);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar personalização:', error);
      setCustomization(null);
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  const saveCustomization = useCallback(async (data: Omit<WidgetCustomization, 'id'>) => {
    if (!assistantId) throw new Error('Assistant ID é obrigatório');

    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) throw new Error('Usuário não autenticado');

      const customizationData = {
        ...data,
        user_id: session.session.user.id,
        assistant_id: assistantId
      };

      const { data: result, error } = await supabase
        .from('widget_customizations')
        .upsert(customizationData, {
          onConflict: 'assistant_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      if (result) {
        const savedData = {
          ...result,
          button_position: (result.button_position as 'left' | 'right') || 'right'
        };
        
        // Atualizar cache imediatamente
        customizationCache.set(assistantId, {
          data: savedData,
          timestamp: Date.now()
        });
        
        setCustomization(savedData);
      }
      return result;
    } catch (error) {
      console.error('Erro ao salvar personalização:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Limpar cache quando mudar de assistente
  const clearCache = useCallback(() => {
    customizationCache.delete(assistantId);
    console.log('🗑️ Cache limpo para assistente:', assistantId);
  }, [assistantId]);

  return {
    customization,
    loading,
    loadCustomization,
    saveCustomization,
    clearCache
  };
};