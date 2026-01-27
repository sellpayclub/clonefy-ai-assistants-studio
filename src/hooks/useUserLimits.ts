import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { performanceCache } from '@/utils/performance';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const loadLimits = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const now = Date.now();
      
      // Rate limiting
      if (!forceRefresh && (now - lastLoadRef.current) < 500) {
        return;
      }
      lastLoadRef.current = now;

      // Check cache first
      const cacheKey = `user-limits-${user.id}`;
      if (!forceRefresh) {
        const cached = performanceCache.get(cacheKey) as UserLimits | null;
        if (cached) {
          setLimits(cached);
          setLoading(false);
          return;
        }
      }

      // Execute all queries in parallel
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

      const quotaData = quotaResult.status === 'fulfilled' && !quotaResult.value.error
        ? quotaResult.value.data
        : { max_assistants: 5, max_whatsapp_connections: 3, plan_type: 'free' };

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
  }, [user]);

  const reloadLimits = useCallback(async () => {
    if (user) {
      const cacheKey = `user-limits-${user.id}`;
      performanceCache.invalidate(cacheKey);
    }
    setLoading(true);
    await loadLimits(true);
  }, [loadLimits, user]);

  // Initial load when user changes
  useEffect(() => {
    if (user) {
      loadLimits();
    }
  }, [loadLimits, user]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-quotas-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_quotas',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          const cacheKey = `user-limits-${user.id}`;
          performanceCache.invalidate(cacheKey);
          loadLimits(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLimits, user]);

  return { limits, loading, reloadLimits };
};
