import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Read the saved agents under the customer's RLS policy. Listing agents must
// not depend on an Edge Function, an OpenAI key or an OpenAI balance.
export const useOptimizedAssistants = (session: Session | null) => {
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const queryKey = ['assistants', userId];
  const query = useQuery({
    queryKey,
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    refetchOnReconnect: true,
    retry: (failures, error: { code?: string; status?: number }) =>
      failures < 2 && !['42501', 'PGRST301', 'PGRST302'].includes(error.code ?? '') &&
      error.status !== 401 && error.status !== 403,
  });

  const reloadAssistants = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['assistants', userId] });
  }, [queryClient, userId]);

  return {
    assistants: userId ? query.data ?? [] : [],
    loading: Boolean(userId) && query.isPending,
    error: query.error ? 'Não foi possível consultar seus agentes. Tente novamente em instantes.' : null,
    reloadAssistants,
  };
};
