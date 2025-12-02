import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActionButton {
  label: string;
  message: string;
}

export type WidgetTemplate = 'classic' | 'bubble' | 'agent_card' | 'quick_questions';

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
  // New template fields
  widget_template: WidgetTemplate;
  bubble_message: string;
  quick_questions: string[];
  action_buttons: ActionButton[];
  show_status_indicator: boolean;
  status_text: string;
}

export const useWidgetCustomization = (assistantId: string) => {
  const [customization, setCustomization] = useState<WidgetCustomization | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCustomization = useCallback(async () => {
    if (!assistantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('widget_customizations')
        .select('*')
        .eq('assistant_id', assistantId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCustomization({
          ...data,
          button_position: (data.button_position as 'left' | 'right') || 'right',
          // Parse new template fields
          widget_template: (data.widget_template as WidgetTemplate) || 'classic',
          bubble_message: data.bubble_message || 'Oi! Como posso te ajudar?',
          quick_questions: Array.isArray(data.quick_questions) ? (data.quick_questions as unknown as string[]) : [],
          action_buttons: Array.isArray(data.action_buttons) ? (data.action_buttons as unknown as ActionButton[]) : [],
          show_status_indicator: data.show_status_indicator !== false,
          status_text: data.status_text || 'Online agora'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar personalização:', error);
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
        quick_questions: data.quick_questions as unknown as any,
        action_buttons: data.action_buttons as unknown as any,
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
        setCustomization({
          ...result,
          button_position: (result.button_position as 'left' | 'right') || 'right',
          // Parse new template fields
          widget_template: (result.widget_template as WidgetTemplate) || 'classic',
          bubble_message: result.bubble_message || 'Oi! Como posso te ajudar?',
          quick_questions: Array.isArray(result.quick_questions) ? (result.quick_questions as unknown as string[]) : [],
          action_buttons: Array.isArray(result.action_buttons) ? (result.action_buttons as unknown as ActionButton[]) : [],
          show_status_indicator: result.show_status_indicator !== false,
          status_text: result.status_text || 'Online agora'
        });
      }
      return result;
    } catch (error) {
      console.error('Erro ao salvar personalização:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  return {
    customization,
    loading,
    loadCustomization,
    saveCustomization
  };
};