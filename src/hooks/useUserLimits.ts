import { useState, useEffect, useCallback } from 'react';
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
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // Load limits directly
  const loadLimits = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      console.log('=== CARREGANDO LIMITES ===');
      console.log('User ID:', user.id);

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
        setLoading(false);
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

      // Também contar da tabela n8n_fluxogpt para compatibilidade
      const { data: n8nConnectionsData, error: n8nConnectionsError } = await supabase
        .from('n8n_fluxogpt')
        .select('id')
        .eq('emailuser', user.email);

      if (n8nConnectionsError) {
        console.error('Erro ao contar conexões n8n:', n8nConnectionsError);
      }

      const currentAssistants = assistantsData?.length || 0;
      const currentWhatsAppConnections = (connectionsData?.length || 0);
      const currentN8nConnections = (n8nConnectionsData?.length || 0);
      const totalConnections = currentWhatsAppConnections + currentN8nConnections;

      const userLimits = {
        max_assistants: quotaData.max_assistants,
        max_whatsapp_connections: quotaData.max_whatsapp_connections,
        current_assistants: currentAssistants,
        current_whatsapp_connections: totalConnections,
        can_create_assistant: currentAssistants < quotaData.max_assistants,
        can_create_whatsapp_connection: totalConnections < quotaData.max_whatsapp_connections,
        plan_type: quotaData.plan_type
      };

      console.log('=== LIMITES CARREGADOS ===');
      console.log('Max assistentes:', userLimits.max_assistants);
      console.log('Max conexões:', userLimits.max_whatsapp_connections);
      console.log('Assistentes atuais:', userLimits.current_assistants);
      console.log('Conexões WhatsApp:', currentWhatsAppConnections);
      console.log('Conexões N8N:', currentN8nConnections);
      console.log('Total conexões:', userLimits.current_whatsapp_connections);
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
  }, []);

  // Carregar na inicialização
  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  // Função para recarregar limites
  const reloadLimits = useCallback(() => {
    return loadLimits();
  }, [loadLimits]);

  return { limits, loading, reloadLimits };
};