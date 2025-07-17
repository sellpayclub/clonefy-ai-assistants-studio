import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedQuery } from './useOptimizedQuery';

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

  // Get current user optimized
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  // Optimized query for user limits using React Query
  const { data: limits, isLoading, refetch } = useOptimizedQuery({
    queryKey: ['user-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_user_usage_stats', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error fetching user limits:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          max_assistants: 1,
          max_whatsapp_connections: 1,
          current_assistants: 0,
          current_whatsapp_connections: 0,
          can_create_assistant: true,
          can_create_whatsapp_connection: true,
          plan_type: 'free'
        };
      }

      const userData = data[0];
      return {
        max_assistants: userData.max_assistants,
        max_whatsapp_connections: userData.max_whatsapp_connections,
        current_assistants: userData.current_assistants,
        current_whatsapp_connections: userData.current_whatsapp_connections,
        can_create_assistant: userData.current_assistants < userData.max_assistants,
        can_create_whatsapp_connection: userData.current_whatsapp_connections < userData.max_whatsapp_connections,
        plan_type: userData.plan_type
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresher data for limits
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Memoized reload function
  const reloadLimits = useCallback(() => {
    return refetch();
  }, [refetch]);

  // Return memoized result to prevent unnecessary re-renders
  return useMemo(() => ({ 
    limits, 
    loading: isLoading, 
    reloadLimits 
  }), [limits, isLoading, reloadLimits]);
};