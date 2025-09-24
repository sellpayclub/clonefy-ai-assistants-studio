import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  start_time: string;
  end_time: string | null;
  messages_count: number;
}

interface AnalyticsDashboardProps {
  analytics: AnalyticsData[];
  sessions: SessionData[];
  period: '7d' | '30d' | '90d';
  loading: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  analytics, 
  sessions, 
  period, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Preparar dados para gráficos
  const chartData = analytics.map(day => ({
    ...day,
    formattedDate: format(new Date(day.date), 'dd/MM', { locale: ptBR })
  }));

  // Dados para gráfico de pizza (distribuição de mensagens)
  const messageDistribution = analytics.reduce((acc, day) => ({
    user: acc.user + (day.total_user_messages || 0),
    bot: acc.bot + (day.total_bot_messages || 0)
  }), { user: 0, bot: 0 });

  const pieData = [
    { name: 'Mensagens dos Usuários', value: messageDistribution.user, color: '#0088fe' },
    { name: 'Respostas do Bot', value: messageDistribution.bot, color: '#00c49f' }
  ];

  // Análise de horários de pico
  const hourlyData = sessions.reduce((acc: any, session) => {
    const hour = new Date(session.start_time).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const hourlyChartData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    conversations: hourlyData[hour] || 0
  }));

  // Taxa de conversão ao longo do tempo
  const conversionData = chartData.map(day => ({
    ...day,
    conversionRate: day.unique_visitors > 0 
      ? ((day.total_conversations / day.unique_visitors) * 100).toFixed(1)
      : 0
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Conversas ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas ao Longo do Tempo</CardTitle>
          <CardDescription>
            Número de conversas iniciadas por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => `Data: ${value}`}
                formatter={(value: any, name) => [value, name === 'total_conversations' ? 'Conversas' : name]}
              />
              <Line 
                type="monotone" 
                dataKey="total_conversations" 
                stroke="#0066cc" 
                strokeWidth={2}
                dot={{ fill: '#0066cc' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Dia</CardTitle>
            <CardDescription>
              Total de mensagens enviadas e recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedDate" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_user_messages" fill="#0088fe" name="Usuários" />
                <Bar dataKey="total_bot_messages" fill="#00c49f" name="Bot" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Mensagens</CardTitle>
            <CardDescription>
              Proporção entre mensagens de usuários e do bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários de Pico */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Maior Atividade</CardTitle>
            <CardDescription>
              Distribuição de conversas por hora do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="conversations" fill="#ff6b35" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão</CardTitle>
            <CardDescription>
              Percentual de visitantes que iniciam uma conversa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedDate" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Taxa de Conversão']}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#ff4757" 
                  strokeWidth={2}
                  dot={{ fill: '#ff4757' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sessões Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
          <CardDescription>
            Últimas sessões de chat registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium">
                    Sessão iniciada em {format(new Date(session.start_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.messages_count} mensagens
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {session.end_time ? (
                    <>
                      Duração: {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60)}min
                    </>
                  ) : (
                    <span className="text-green-600">Em andamento</span>
                  )}
                </div>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sessão registrada ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;