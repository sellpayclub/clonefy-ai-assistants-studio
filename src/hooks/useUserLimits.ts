import { useState, useEffect } from 'react';
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

  const loadLimits = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user quotas
      const { data: quotaData, error: quotaError } = await (supabase as any)
        .from('user_quotas')
        .select('max_assistants, max_whatsapp_connections')
        .eq('user_id', user.id)
        .single();

      if (quotaError && quotaError.code !== 'PGRST116') {
        console.error('Error loading user quotas:', quotaError);
        return;
      }

      // Get current usage
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', user.id);

      const { data: connections, error: connectionsError } = await supabase
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', user.id);

      if (assistantsError || connectionsError) {
        console.error('Error loading usage data:', { assistantsError, connectionsError });
        return;
      }

      const maxAssistants = quotaData?.max_assistants || 1;
      const maxConnections = quotaData?.max_whatsapp_connections || 1;
      const currentAssistants = assistants?.length || 0;
      const currentConnections = connections?.length || 0;

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
  };

  useEffect(() => {
    loadLimits();
  }, []);

  return {
    limits,
    loading,
    reloadLimits: loadLimits,
  };
};