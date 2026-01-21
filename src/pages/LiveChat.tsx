import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLiveChat } from '@/hooks/useLiveChat';
import { SessionsList } from '@/components/live-chat/SessionsList';
import { ChatWindow } from '@/components/live-chat/ChatWindow';
import { 
  MessageSquare, 
  Bot, 
  User, 
  Radio,
  RefreshCw
} from 'lucide-react';

export default function LiveChat() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const {
    sessions,
    messages,
    selectedSession,
    selectedSessionId,
    setSelectedSessionId,
    loading,
    stats,
    sendMessage,
    toggleHumanTakeover,
    closeSession,
    loadSessions
  } = useLiveChat();

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && session.source !== sourceFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radio className="h-6 w-6 text-primary" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Chat ao Vivo</h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe e gerencie conversas em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Stats */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-1 text-green-600">
                    <Bot className="h-4 w-4" />
                    <span className="font-medium">{stats.aiActive}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{stats.humanTakeover}</span>
                  </div>
                  {stats.totalUnread > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                      {stats.totalUnread} não lidas
                    </Badge>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ai_active">🤖 IA Ativa</SelectItem>
                      <SelectItem value="human_takeover">👤 Humano</SelectItem>
                      <SelectItem value="waiting">⏳ Aguardando</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                      <SelectItem value="widget">💬 Widget</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => loadSessions()}
                    title="Atualizar"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sessions List - 350px width */}
            <div className="w-[350px] flex-shrink-0">
              <SessionsList
                sessions={filteredSessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-muted/30">
              <ChatWindow
                session={selectedSession}
                messages={messages}
                onSendMessage={sendMessage}
                onToggleTakeover={toggleHumanTakeover}
                onClose={closeSession}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
