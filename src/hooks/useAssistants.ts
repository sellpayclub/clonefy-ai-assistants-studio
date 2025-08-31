import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { cache } from '@/utils/cache';

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
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize a função de chamada para evitar re-criações
  const callFunction = useCallback(async (body: any) => {
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

  // Otimiza o carregamento de assistentes com cache
  const loadAssistants = useCallback(async (forceRefresh = false) => {
    if (!session) return;
    
    const cacheKey = `assistants_${session.user.id}`;
    
    // Verificar cache primeiro (só se não for refresh forçado)
    if (!forceRefresh) {
      const cachedData = cache.get<Assistant[]>(cacheKey);
      if (cachedData) {
        setAssistants(cachedData);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await callFunction({ action: 'list' });
      const assistantsList = data.assistants || [];
      
      setAssistants(assistantsList);
      // Cache por 3 minutos
      cache.set(cacheKey, assistantsList, 3);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading assistants:', err);
    } finally {
      setLoading(false);
    }
  }, [session, callFunction]);

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
    if (session) {
      cache.invalidate(`assistants_${session.user.id}`);
    }
    await loadAssistants(true); // Force refresh
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
    if (session) {
      cache.invalidate(`assistants_${session.user.id}`);
    }
    await loadAssistants(true); // Force refresh
    return data.assistant;
  };

  const deleteAssistant = async (assistantId: string) => {
    await callFunction({
      action: 'delete',
      assistantId,
    });
    
    // Invalidar cache e recarregar
    if (session) {
      cache.invalidate(`assistants_${session.user.id}`);
    }
    await loadAssistants(true); // Force refresh
  };

  const getAssistant = async (assistantId: string) => {
    const data = await callFunction({
      action: 'get',
      assistantId,
    });
    return data.assistant;
  };

  // Otimiza a execução do effect
  useEffect(() => {
    if (session) {
      loadAssistants();
    }
  }, [session, loadAssistants]);

  // Memoize o retorno para evitar re-renders desnecessários
  return useMemo(() => ({
    assistants,
    loading,
    error,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    getAssistant,
  }), [assistants, loading, error, loadAssistants]);
};