import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GlobalStats {
  total_users: number;
  total_leads: number;
  active_sessions: number;
  total_connections: number;
  total_assistants: number;
}

interface AdminLead {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  whatsapp_number: string;
  email: string | null;
  company: string | null;
  status: string;
  source: string;
  pipeline_stage: string | null;
  lead_score: number | null;
  sentiment: string | null;
  last_interaction: string | null;
  created_at: string;
  tags: string[] | null;
  intent_summary: string | null;
}

interface AdminSession {
  id: string;
  user_id: string;
  user_email: string;
  contact_number: string;
  contact_name: string | null;
  instance_name: string;
  status: string;
  source: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  assistant_name: string | null;
  created_at: string;
}

export function useAdminData() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_global_stats');
      if (error) throw error;
      setStats(data as unknown as GlobalStats);
    } catch (e: any) {
      console.error('Admin stats error:', e);
      setError(e.message);
    }
  }, []);

  const loadLeads = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_leads', {
        target_user_id: userId || null,
      });
      if (error) throw error;
      setLeads((data as unknown as AdminLead[]) || []);
    } catch (e: any) {
      console.error('Admin leads error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_sessions', {
        target_user_id: userId || null,
      });
      if (error) throw error;
      setSessions((data as unknown as AdminSession[]) || []);
    } catch (e: any) {
      console.error('Admin sessions error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadLeads(), loadSessions()]);
    setLoading(false);
  }, [loadStats, loadLeads, loadSessions]);

  return {
    stats,
    leads,
    sessions,
    loading,
    error,
    loadStats,
    loadLeads,
    loadSessions,
    loadAll,
  };
}
