import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { debounce } from '@/utils/performance';

interface DashboardStats {
  assistants: number;
  connections: number;
  conversations: number;
  messages: number;
}

export const useDashboardStats = (user: User | null) => {
  const [stats, setStats] = useState<DashboardStats>({ 
    assistants: 0, 
    connections: 0, 
    conversations: 0, 
    messages: 0 
  });
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced update function para evitar múltiplas chamadas
  const debouncedLoadStats = useCallback(
    debounce(async () => {
      if (!user) return;

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        // Execute all queries in parallel para maior velocidade
        const [assistantsResult, connectionsResult, n8nResult] = await Promise.allSettled([
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

        if (signal.aborted) return;

        const assistantsCount = assistantsResult.status === 'fulfilled' 
          ? (assistantsResult.value.count || 0) 
          : 0;
        
        const connectionsCount = connectionsResult.status === 'fulfilled' 
          ? (connectionsResult.value.count || 0) 
          : 0;
        
        const n8nCount = n8nResult.status === 'fulfilled' 
          ? (n8nResult.value.count || 0) 
          : 0;

        setStats({
          assistants: assistantsCount,
          connections: connectionsCount + n8nCount,
          conversations: 0,
          messages: 0
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar estatísticas:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    [user]
  );

  useEffect(() => {
    debouncedLoadStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedLoadStats]);


  const reloadStats = useCallback(() => {
    debouncedLoadStats();
  }, [debouncedLoadStats]);

  return { stats, loading, reloadStats };
};