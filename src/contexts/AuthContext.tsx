import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { performanceCache } from '@/utils/performance';
import { brokeredPreviewStorage } from '@/integrations/supabase/previewAuthStorage';
import { SUPABASE_URL } from '@/lib/supabase-config';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        receivedAuthEvent = true;
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
          performanceCache.clear();
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active || receivedAuthEvent) return;
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.warn('Unable to restore auth session:', error);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (error) {
      console.warn('Error during signOut:', error);
      // Explicit logout must also work while the auth server is unavailable.
      const storage = brokeredPreviewStorage();
      const key = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
      await storage?.removeItem(key);
      await storage?.removeItem(`${key}-user`);
    } finally {
      setUser(null);
      setSession(null);
      queryClient.clear();
      performanceCache.clear();
      window.location.href = '/auth';
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
