import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { performanceCache, requestCache } from '@/utils/performance';

interface WhatsAppConnection {
  id: number;
  nomeinstancia: string;
  idassistentgpt: string;
  emailuser: string;
  threadid?: string;
  whatsappuser?: string;
  message?: string;
  timeout?: string;
  created_at: string;
  IDvoz?: string;
  ApiELEVEN?: string;
}

export const useOptimizedWhatsApp = (session: Session | null) => {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregamento otimizado de conexões
  const loadConnections = useCallback(async (forceRefresh = false) => {
    if (!session) return;
    
    const cacheKey = `whatsapp_connections_${session.user.id}`;
    
    return requestCache.getOrExecute(cacheKey, async () => {
      if (!forceRefresh) {
        const cached = performanceCache.get(cacheKey) as WhatsAppConnection[] | null;
        if (cached) {
          setConnections(cached);
          return cached;
        }
      }
      
      setLoading(true);
      try {
        const response = await supabase.functions.invoke('whatsapp-evolution', {
          body: { action: 'list' },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.error) throw response.error;

        const connectionsList = response.data?.connections || [];
        setConnections(connectionsList);
        
        // Cache por 8 minutos
        performanceCache.set(cacheKey, connectionsList, 8);
        return connectionsList;
      } catch (error: any) {
        console.error('Error loading connections:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    });
  }, [session]);

  // Criação otimizada de conexão
  const createConnection = useCallback(async (data: {
    instanceName: string;
    assistantId: string;
    elevenLabsApiKey?: string;
    voiceId?: string;
  }) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('whatsapp-evolution', {
      body: { 
        action: 'create',
        ...data
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar cache
    performanceCache.invalidate(`whatsapp_connections_${session.user.id}`);
    await loadConnections(true);
    
    return response.data;
  }, [session, loadConnections]);

  // Atualização de configurações de voz
  const updateVoiceSettings = useCallback(async (connectionId: number, data: {
    elevenLabsApiKey: string;
    voiceId: string;
  }) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('whatsapp-evolution', {
      body: { 
        action: 'update_voice',
        connectionId,
        ...data
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar cache e recarregar
    performanceCache.invalidate(`whatsapp_connections_${session.user.id}`);
    await loadConnections(true);
    
    return response.data;
  }, [session, loadConnections]);

  // Exclusão otimizada
  const deleteConnection = useCallback(async (connectionId: number) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('whatsapp-evolution', {
      body: { action: 'delete', connectionId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar cache e atualizar estado local
    performanceCache.invalidate(`whatsapp_connections_${session.user.id}`);
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    return response.data;
  }, [session]);

  // Geração de QR Code otimizada
  const generateQRCode = useCallback(async (instanceName: string) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('whatsapp-evolution', {
      body: { action: 'qr', instanceName },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;
    return response.data;
  }, [session]);

  // Retorno memoizado
  return useMemo(() => ({
    connections,
    loading,
    loadConnections,
    createConnection,
    updateVoiceSettings,
    deleteConnection,
    generateQRCode,
  }), [connections, loading, loadConnections, createConnection, updateVoiceSettings, deleteConnection, generateQRCode]);
};