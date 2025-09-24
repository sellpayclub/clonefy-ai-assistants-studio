import { useState, useCallback } from 'react';
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
          button_position: (data.button_position as 'left' | 'right') || 'right'
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
          button_position: (result.button_position as 'left' | 'right') || 'right'
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