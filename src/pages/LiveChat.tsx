import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLiveChat } from '@/hooks/useLiveChat';
import { SessionsList } from '@/components/live-chat/SessionsList';
import { ChatWindow } from '@/components/live-chat/ChatWindow';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bot,
  User,
  Radio,
  RefreshCw,
  Send,
  Eraser
} from 'lucide-react';

export default function LiveChat() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('90');
  const [onlyClosed, setOnlyClosed] = useState(true);

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
    cleanupSessions,
    loadSessions
  } = useLiveChat();

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (statusFilter !== 'all' && session.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && session.source !== sourceFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p>Carregando conversas...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
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
              <div className="flex items-center gap-1 text-sky-500">
                <Send className="h-4 w-4" />
                <span className="font-medium">{stats.telegram}</span>
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
                  <SelectItem value="telegram">✈️ Telegram</SelectItem>
                  <SelectItem value="widget">💬 Widget</SelectItem>
                  <SelectItem value="telegram">✈️ Telegram</SelectItem>
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
  );
}
