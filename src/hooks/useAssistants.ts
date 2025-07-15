import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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

  const callFunction = async (body: any) => {
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
  };

  const loadAssistants = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await callFunction({ action: 'list' });
      setAssistants(data.assistants || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading assistants:', err);
    } finally {
      setLoading(false);
    }
  };

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
    await loadAssistants(); // Reload list
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
    await loadAssistants(); // Reload list
    return data.assistant;
  };

  const deleteAssistant = async (assistantId: string) => {
    await callFunction({
      action: 'delete',
      assistantId,
    });
    await loadAssistants(); // Reload list
  };

  const getAssistant = async (assistantId: string) => {
    const data = await callFunction({
      action: 'get',
      assistantId,
    });
    return data.assistant;
  };

  useEffect(() => {
    if (session) {
      loadAssistants();
    }
  }, [session]);

  return {
    assistants,
    loading,
    error,
    loadAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    getAssistant,
  };
};