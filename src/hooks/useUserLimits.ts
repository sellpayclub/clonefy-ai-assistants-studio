import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { performanceCache } from '@/utils/performance';

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
  const lastLoadRef = useRef<number>(0);
  const userIdRef = useRef<string | null>(null);

  const loadLimits = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Rate limiting - prevent multiple calls within 500ms (reduced from 1s)
      if (!forceRefresh && (now - lastLoadRef.current) < 500) {
        return;
      }
      lastLoadRef.current = now;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      userIdRef.current = user.id;

      // Check cache first - reduced TTL to 1 minute for limits
      const cacheKey = `user-limits-${user.id}`;
      if (!forceRefresh) {
        const cached = performanceCache.get(cacheKey) as UserLimits | null;
        if (cached) {
          setLimits(cached);
          setLoading(false);
          return;
        }
      }

      // Execute all queries in parallel for better performance
      const [quotaResult, assistantsResult, whatsappResult, n8nResult] = await Promise.allSettled([
        supabase
          .from('user_quotas')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('assistants')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('whatsapp_connections')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        supabase
          .from('n8n_fluxogpt')
          .select('id', { count: 'exact' })
          .eq('emailuser', user.email || '')
      ]);

      // Handle quota data
      const quotaData = quotaResult.status === 'fulfilled' && !quotaResult.value.error
        ? quotaResult.value.data
        : { max_assistants: 5, max_whatsapp_connections: 3, plan_type: 'free' };

      // Handle counts
      const currentAssistants = assistantsResult.status === 'fulfilled'
        ? (assistantsResult.value.count || 0)
        : 0;

      const currentWhatsAppConnections = whatsappResult.status === 'fulfilled'
        ? (whatsappResult.value.count || 0)
        : 0;

      const currentN8nConnections = n8nResult.status === 'fulfilled'
        ? (n8nResult.value.count || 0)
        : 0;

      const totalConnections = currentWhatsAppConnections + currentN8nConnections;

      const newLimits = {
        max_assistants: quotaData.max_assistants,
        max_whatsapp_connections: quotaData.max_whatsapp_connections,
        current_assistants: currentAssistants,
        current_whatsapp_connections: totalConnections,
        can_create_assistant: currentAssistants < quotaData.max_assistants,
        can_create_whatsapp_connection: totalConnections < quotaData.max_whatsapp_connections,
        plan_type: quotaData.plan_type
      };

      setLimits(newLimits);
      
      // Cache the result for only 1 minute (reduced from 15 min)
      performanceCache.set(cacheKey, newLimits, 1);
    } catch (error: any) {
      console.error('Erro ao carregar limites:', error);
      setLimits({
        max_assistants: 5,
        max_whatsapp_connections: 3,
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

  const reloadLimits = useCallback(async () => {
    // Clear cache when manually reloading
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const cacheKey = `user-limits-${user.id}`;
      performanceCache.invalidate(cacheKey);
    }
    setLoading(true);
    await loadLimits(true);
  }, [loadLimits]);

  // Initial load
  useEffect(() => {
    loadLimits();
  }, [loadLimits]);

  // Realtime subscription para atualizar limites quando admin alterar
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Subscribe to changes in user_quotas table for this user
      channel = supabase
        .channel(`user-quotas-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_quotas',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Limites atualizados pelo admin:', payload);
            // Invalidar cache e recarregar
            const cacheKey = `user-limits-${user.id}`;
            performanceCache.invalidate(cacheKey);
            loadLimits(true);
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadLimits]);

  return { limits, loading, reloadLimits };
};
