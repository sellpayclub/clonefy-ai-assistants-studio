import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useOptimizedAssistants } from './useOptimizedAssistants';

export interface Assistant {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  openai_assistant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAssistants = (session: Session | null) => {
  const { assistants, loading, error, reloadAssistants } = useOptimizedAssistants(session);
  const loadAssistants = reloadAssistants;

  // Memoize a função de chamada para evitar re-criações
  const callFunction = useCallback(async (body: Record<string, unknown>) => {
    if (!session) {
      throw new Error('No session available');
    }

    const response = await supabase.functions.invoke('openai-assistants', {
      body,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw response.error;
    }

    return response.data;
  }, [session]);

  const createAssistant = async (assistantData: {
    name: string;
    description?: string;
    instructions: string;
    model?: string;
  }) => {
    const data = await callFunction({
      action: 'create',
      ...assistantData,
    });
    
    // Invalidar cache e recarregar
    await loadAssistants(); // Force refresh
    return data.assistant;
  };

  const updateAssistant = async (assistantId: string, assistantData: {
    name: string;
    description?: string;
    instructions: string;
    model?: string;
  }) => {
    const data = await callFunction({
      action: 'update',
      assistantId,
      ...assistantData,
    });
    
    // Invalidar cache e recarregar
    await loadAssistants(); // Force refresh
    return data.assistant;
  };

  const deleteAssistant = async (assistantId: string) => {
    await callFunction({
      action: 'delete',
      assistantId,
    });
    
    // Invalidar cache e recarregar
    await loadAssistants(); // Force refresh
  };

  const getAssistant = async (assistantId: string) => {
    const data = await callFunction({
      action: 'get',
      assistantId,
    });
    return data.assistant;
  };

  return {
    assistants, loading, error, loadAssistants,
    createAssistant, updateAssistant, deleteAssistant, getAssistant,
  };
};
