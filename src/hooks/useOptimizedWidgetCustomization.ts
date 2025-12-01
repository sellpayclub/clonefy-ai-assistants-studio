import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActionButton {
  label: string;
  message: string;
}

export type WidgetTemplate = 'classic' | 'bubble' | 'agent_card' | 'quick_questions';

export interface WidgetCustomization {
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
  // New template fields
  widget_template: WidgetTemplate;
  bubble_message: string;
  quick_questions: string[];
  action_buttons: ActionButton[];
  show_status_indicator: boolean;
  status_text: string;
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

    // Carregando personalização para assistente

    // Verificar cache local
    const cached = customizationCache.get(assistantId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Usando dados do cache
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
        const customizationData: WidgetCustomization = {
          ...data,
          button_position: (data.button_position as 'left' | 'right') || 'right',
          // Parse new template fields
          widget_template: (data.widget_template as WidgetTemplate) || 'classic',
          bubble_message: data.bubble_message || 'Oi! Como posso te ajudar?',
          quick_questions: Array.isArray(data.quick_questions) ? data.quick_questions : [],
          action_buttons: Array.isArray(data.action_buttons) ? data.action_buttons : [],
          show_status_indicator: data.show_status_indicator !== false,
          status_text: data.status_text || 'Online agora'
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

      console.log('📤 Enviando dados para o banco:', {
        widget_template: customizationData.widget_template,
        widget_template_type: typeof customizationData.widget_template
      });

      const { data: result, error } = await supabase
        .from('widget_customizations')
        .upsert(customizationData, {
          onConflict: 'assistant_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }
      
      console.log('📥 Dados retornados do banco:', {
        widget_template: result?.widget_template,
        widget_template_type: typeof result?.widget_template
      });
      
      if (result) {
        const savedData: WidgetCustomization = {
          ...result,
          button_position: (result.button_position as 'left' | 'right') || 'right',
          // Parse new template fields - preservar valor do banco se existir
          widget_template: (result.widget_template !== null && result.widget_template !== undefined && result.widget_template !== '') 
            ? (result.widget_template as WidgetTemplate) 
            : 'classic',
          bubble_message: result.bubble_message || 'Oi! Como posso te ajudar?',
          quick_questions: Array.isArray(result.quick_questions) ? result.quick_questions : [],
          action_buttons: Array.isArray(result.action_buttons) ? result.action_buttons : [],
          show_status_indicator: result.show_status_indicator !== false,
          status_text: result.status_text || 'Online agora'
        };
        
        console.log('✅ Dados processados após salvar:', {
          widget_template: savedData.widget_template,
          widget_template_type: typeof savedData.widget_template
        });
        
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
    // Cache limpo
  }, [assistantId]);

  return {
    customization,
    loading,
    loadCustomization,
    saveCustomization,
    clearCache
  };
};