import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserLimits {
  max_assistants: number;
  max_whatsapp_connections: number;
  current_assistants: number;
  current_whatsapp_connections: number;
  can_create_assistant: boolean;
  can_create_whatsapp_connection: boolean;
}

export const useUserLimits = () => {
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLimits = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallel requests for better performance
      const [quotaResult, assistantsResult, connectionsResult] = await Promise.all([
        (supabase as any)
          .from('user_quotas')
          .select('max_assistants, max_whatsapp_connections')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('assistants')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('whatsapp_connections')
          .select('id')
          .eq('user_id', user.id)
      ]);

      const maxAssistants = quotaResult.data?.max_assistants || 1;
      const maxConnections = quotaResult.data?.max_whatsapp_connections || 1;
      const currentAssistants = assistantsResult.data?.length || 0;
      const currentConnections = connectionsResult.data?.length || 0;

      setLimits({
        max_assistants: maxAssistants,
        max_whatsapp_connections: maxConnections,
        current_assistants: currentAssistants,
        current_whatsapp_connections: currentConnections,
        can_create_assistant: currentAssistants < maxAssistants,
        can_create_whatsapp_connection: currentConnections < maxConnections,
      });
    } catch (error) {
      console.error('Error loading user limits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  const reloadLimits = useCallback(() => {
    return loadLimits();
  }, [loadLimits]);

  return useMemo(() => ({ 
    limits, 
    loading, 
    reloadLimits 
  }), [limits, loading, reloadLimits]);
};