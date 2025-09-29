import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  date: string;
  total_conversations: number;
  total_messages: number;
  total_user_messages: number;
  total_bot_messages: number;
  unique_visitors: number;
}

interface SessionData {
  id: string;
  session_id: string;
  conversation_id: string | null;
  start_time: string;
  end_time: string | null;
  messages_count: number;
}

export const useWidgetAnalytics = (assistantId: string, period: '7d' | '30d' | '90d') => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  const getPeriodDays = (period: string) => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const loadAnalytics = useCallback(async () => {
    if (!assistantId) {
      console.log('⚠️ Analytics: Nenhum assistente selecionado');
      return;
    }

    try {
      setLoading(true);
      const days = getPeriodDays(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log('📊 Carregando analytics para assistente:', assistantId, 'período:', period, 'desde:', startDate);
      
      const { data, error } = await supabase
        .from('widget_analytics')
        .select('*')
        .eq('assistant_id', assistantId)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar analytics:', error);
        throw error;
      }
      
      console.log('✅ Analytics carregados:', data?.length || 0, 'registros');
      setAnalytics(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error);
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, [assistantId, period]);

  const loadSessions = useCallback(async () => {
    if (!assistantId) {
      console.log('⚠️ Sessions: Nenhum assistente selecionado');
      return;
    }

    try {
      const days = getPeriodDays(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      console.log('📊 Carregando sessões para assistente:', assistantId, 'desde:', startDate);
      
      const { data, error } = await supabase
        .from('widget_sessions')
        .select('*')
        .eq('assistant_id', assistantId)
        .gte('start_time', startDate)
        .order('start_time', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Erro ao carregar sessões:', error);
        throw error;
      }
      
      console.log('✅ Sessões carregadas:', data?.length || 0, 'registros');
      setSessions(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar sessões:', error);
      setSessions([]);
    }
  }, [assistantId, period]);

  const exportData = useCallback(async () => {
    if (!assistantId) return null;

    try {
      const days = getPeriodDays(period);
      
      const [analyticsRes, sessionsRes] = await Promise.all([
        supabase
          .from('widget_analytics')
          .select('*')
          .eq('assistant_id', assistantId)
          .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from('widget_sessions')
          .select('*')
          .eq('assistant_id', assistantId)
          .gte('start_time', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        analytics: analyticsRes.data,
        sessions: sessionsRes.data,
        exported_at: new Date().toISOString(),
        period: period,
        assistant_id: assistantId
      };
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }, [assistantId, period]);

  return {
    analytics,
    sessions,
    loading,
    loadAnalytics,
    loadSessions,
    exportData
  };
};