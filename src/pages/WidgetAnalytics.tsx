import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle, Users, Clock, TrendingUp, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWidgetAnalytics } from '@/hooks/useWidgetAnalytics';
import AnalyticsDashboard from '@/components/widget/AnalyticsDashboard';

const WidgetAnalytics = () => {
  const [searchParams] = useSearchParams();
  const assistantId = searchParams.get('assistant');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [assistants, setAssistants] = useState<any[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const {
    analytics,
    sessions,
    loading,
    loadAnalytics,
    loadSessions,
    exportData
  } = useWidgetAnalytics(selectedAssistant || assistantId || '', period);

  useEffect(() => {
    loadAssistants();
  }, []);

  useEffect(() => {
    if (assistantId) {
      setSelectedAssistant(assistantId);
    }
  }, [assistantId]);

  useEffect(() => {
    if (selectedAssistant) {
      loadAnalytics();
      loadSessions();
    }
  }, [selectedAssistant, period, loadAnalytics, loadSessions]);

  const loadAssistants = async () => {
    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
    }
  };

  const calculateTotals = () => {
    if (!analytics.length) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        totalVisitors: 0,
        avgSessionDuration: '0min'
      };
    }

    const totals = analytics.reduce((acc, day) => ({
      totalConversations: acc.totalConversations + (day.total_conversations || 0),
      totalMessages: acc.totalMessages + (day.total_messages || 0),
      totalVisitors: acc.totalVisitors + (day.unique_visitors || 0)
    }), {
      totalConversations: 0,
      totalMessages: 0,
      totalVisitors: 0
    });

    // Calcular duração média das sessões
    const validSessions = sessions.filter(s => s.end_time);
    const avgDuration = validSessions.length > 0 
      ? validSessions.reduce((acc, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.end_time!);
          return acc + (end.getTime() - start.getTime());
        }, 0) / validSessions.length / 1000 / 60 // convertir para minutos
      : 0;

    return {
      ...totals,
      avgSessionDuration: `${Math.round(avgDuration)}min`
    };
  };

  const totals = calculateTotals();

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `widget-analytics-${selectedAssistant}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analytics do Widget
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu widget de chat
          </p>
        </div>

        {/* Seletores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Assistente</label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={period} onValueChange={(value: '7d' | '30d' | '90d') => setPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </CardContent>
          </Card>
        </div>

        {selectedAssistant && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.totalConversations}</div>
                  <Badge variant="secondary" className="mt-1">
                    {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média: {totals.totalConversations > 0 ? Math.round(totals.totalMessages / totals.totalConversations) : 0} por conversa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.totalVisitors}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa de conversão: {totals.totalVisitors > 0 ? Math.round((totals.totalConversations / totals.totalVisitors) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totals.avgSessionDuration}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por sessão
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard de Analytics */}
            <AnalyticsDashboard 
              analytics={analytics}
              sessions={sessions}
              period={period}
              loading={loading}
            />
          </>
        )}

        {!selectedAssistant && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um assistente</h3>
                <p className="text-muted-foreground">
                  Escolha um assistente para ver as métricas de desempenho do widget
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WidgetAnalytics;