import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { debounce, performanceCache } from '@/utils/performance';

interface Assistant {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: string;
  openai_assistant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tools?: any[];
}

export const useOptimizedAssistants = (session: Session | null) => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const lastLoadRef = useRef<number>(0);

  const loadAssistants = useCallback(
    debounce(async (forceRefresh = false) => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const now = Date.now();
        
        // Rate limiting
        if (!forceRefresh && (now - lastLoadRef.current) < 2000) {
          return;
        }
        lastLoadRef.current = now;

        // Check cache first
        const cacheKey = `assistants-${session.user.id}`;
        if (!forceRefresh) {
          const cached = performanceCache.get(cacheKey) as Assistant[] | null;
          if (cached) {
            setAssistants(cached);
            setLoading(false);
            return;
          }
        }

        // Call Edge Function
        const response = await supabase.functions.invoke('openai-assistants', {
          body: { action: 'list' },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.error) {
          throw response.error;
        }

        const assistantsList = response.data?.assistants || [];
        setAssistants(assistantsList);
        
        // Cache for 2 minutes
        performanceCache.set(cacheKey, assistantsList);
      } catch (error: any) {
        console.error('Error loading assistants:', error);
        // Don't show error toast for cached requests
        if (forceRefresh) {
          throw error;
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    [session]
  );

  const reloadAssistants = useCallback(async () => {
    if (session) {
      const cacheKey = `assistants-${session.user.id}`;
      performanceCache.clear();
    }
    setLoading(true);
    await loadAssistants(true);
  }, [loadAssistants, session]);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  return { assistants, loading, reloadAssistants };
};