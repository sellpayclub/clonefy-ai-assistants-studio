import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

interface QueryConfig {
  queryKey: string[];
  queryFn: () => Promise<any>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
}

export const useOptimizedQuery = ({ 
  queryKey, 
  queryFn, 
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus = false
}: QueryConfig) => {
  const queryClient = useQueryClient();

  // Memoize the query function to prevent unnecessary re-renders
  const memoizedQueryFn = useCallback(queryFn, []);

  const query = useQuery({
    queryKey,
    queryFn: memoizedQueryFn,
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Optimized invalidation function
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Optimized refetch function
  const refetchQuery = useCallback(() => {
    return query.refetch();
  }, [query]);

  // Return memoized result to prevent unnecessary re-renders
  return useMemo(() => ({
    ...query,
    invalidateQuery,
    refetchQuery,
  }), [query, invalidateQuery, refetchQuery]);
};

// Helper hook for Supabase queries with correct typing
export const useSupabaseQuery = (
  table: string,
  select: string = '*',
  filters?: Record<string, any>,
  options?: Partial<QueryConfig>
) => {
  const queryKey = useMemo(() => [table, select, JSON.stringify(filters)], [table, select, filters]);
  
  const queryFn = useCallback(async () => {
    let query = (supabase as any).from(table).select(select);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }, [table, select, filters]);

  return useOptimizedQuery({
    queryKey,
    queryFn,
    ...options,
  });
};