import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgendifyConfig {
  id: string;
  user_id: string;
  assistant_id: string;
  tenant_id: string;
  api_base_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgendifyConfig = (assistantId: string | null, session: any) => {
  const [config, setConfig] = useState<AgendifyConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const loadConfig = useCallback(async () => {
    if (!assistantId || !session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendify_configs')
        .select('*')
        .eq('assistant_id', assistantId)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error loading agendify config:', error);
    } finally {
      setLoading(false);
    }
  }, [assistantId, session]);

  const saveConfig = useCallback(async (tenantId: string, apiBaseUrl: string = 'https://agendamento-agendify.com') => {
    if (!assistantId || !session?.user?.id) {
      toast({
        title: 'Erro',
        description: 'Assistente ou sessão não encontrados',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from('agendify_configs')
        .select('id')
        .eq('assistant_id', assistantId)
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('agendify_configs')
          .update({
            tenant_id: tenantId,
            api_base_url: apiBaseUrl,
            is_active: true,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('agendify_configs')
          .insert({
            user_id: session.user.id,
            assistant_id: assistantId,
            tenant_id: tenantId,
            api_base_url: apiBaseUrl,
            is_active: true,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso!',
        description: 'Configuração do Agendify salva com sucesso.',
      });

      await loadConfig();
      return true;
    } catch (error: any) {
      console.error('Error saving agendify config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [assistantId, session, toast, loadConfig]);

  const disableConfig = useCallback(async () => {
    if (!config?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendify_configs')
        .update({ is_active: false })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Integração desativada',
        description: 'A integração com Agendify foi desativada.',
      });

      await loadConfig();
      return true;
    } catch (error: any) {
      console.error('Error disabling agendify config:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível desativar a integração.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [config, toast, loadConfig]);

  const deleteConfig = useCallback(async () => {
    if (!config?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendify_configs')
        .delete()
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Configuração removida',
        description: 'A configuração do Agendify foi removida.',
      });

      setConfig(null);
      return true;
    } catch (error: any) {
      console.error('Error deleting agendify config:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a configuração.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [config, toast]);

  const testConnection = useCallback(async () => {
    if (!assistantId || !session) {
      toast({
        title: 'Erro',
        description: 'Assistente ou sessão não encontrados',
        variant: 'destructive',
      });
      return false;
    }

    setTesting(true);
    try {
      const response = await supabase.functions.invoke('agendify-proxy', {
        body: {
          action: 'test_connection',
          assistant_id: assistantId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast({
          title: 'Conexão OK!',
          description: `Conectado ao Agendify. ${response.data.servicesCount} serviço(s) encontrado(s).`,
        });
        return true;
      } else {
        toast({
          title: 'Falha na conexão',
          description: response.data?.message || 'Não foi possível conectar ao Agendify.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error testing agendify connection:', error);
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível testar a conexão.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setTesting(false);
    }
  }, [assistantId, session, toast]);

  return {
    config,
    loading,
    testing,
    loadConfig,
    saveConfig,
    disableConfig,
    deleteConfig,
    testConnection,
    isConfigured: !!config?.is_active,
  };
};
