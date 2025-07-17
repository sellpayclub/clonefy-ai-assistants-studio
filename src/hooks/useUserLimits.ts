import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserLimits {
  max_assistants: number;
  max_whatsapp_connections: number;
  current_assistants: number;
  current_whatsapp_connections: number;
  can_create_assistant: boolean;
  can_create_whatsapp_connection: boolean;
  plan_type: string;
}

export const useUserLimits = () => {
  const [user, setUser] = useState<any>(null);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  // Load limits directly
  const loadLimits = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log('=== CARREGANDO LIMITES ===');
    console.log('User ID:', user.id);

    try {
      setLoading(true);

      // Buscar quotas do usuário
      const { data: quotaData, error: quotaError } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (quotaError) {
        console.error('Erro ao buscar quotas:', quotaError);
        setLimits({
          max_assistants: 1,
          max_whatsapp_connections: 1,
          current_assistants: 0,
          current_whatsapp_connections: 0,
          can_create_assistant: true,
          can_create_whatsapp_connection: true,
          plan_type: 'free'
        });
        return;
      }

      // Contar assistentes ativos
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assistantsError) {
        console.error('Erro ao contar assistentes:', assistantsError);
      }

      // Contar conexões WhatsApp
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', user.id);

      if (connectionsError) {
        console.error('Erro ao contar conexões:', connectionsError);
      }

      const currentAssistants = assistantsData?.length || 0;
      const currentConnections = connectionsData?.length || 0;

      const userLimits = {
        max_assistants: quotaData.max_assistants,
        max_whatsapp_connections: quotaData.max_whatsapp_connections,
        current_assistants: currentAssistants,
        current_whatsapp_connections: currentConnections,
        can_create_assistant: currentAssistants < quotaData.max_assistants,
        can_create_whatsapp_connection: currentConnections < quotaData.max_whatsapp_connections,
        plan_type: quotaData.plan_type
      };

      console.log('=== LIMITES CARREGADOS ===');
      console.log('Max assistentes:', userLimits.max_assistants);
      console.log('Max conexões:', userLimits.max_whatsapp_connections);
      console.log('Assistentes atuais:', userLimits.current_assistants);
      console.log('Conexões atuais:', userLimits.current_whatsapp_connections);
      console.log('Plano:', userLimits.plan_type);
      console.log('===========================');

      setLimits(userLimits);
    } catch (error) {
      console.error('Erro crítico ao carregar limites:', error);
      setLimits({
        max_assistants: 1,
        max_whatsapp_connections: 1,
        current_assistants: 0,
        current_whatsapp_connections: 0,
        can_create_assistant: true,
        can_create_whatsapp_connection: true,
        plan_type: 'free'
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar quando user mudar
  useEffect(() => {
    if (user) {
      loadLimits();
    }
  }, [user, loadLimits]);

  // Função para recarregar limites
  const reloadLimits = useCallback(() => {
    return loadLimits();
  }, [loadLimits]);

  return useMemo(() => ({ 
    limits, 
    loading, 
    reloadLimits 
  }), [limits, loading, reloadLimits]);
};