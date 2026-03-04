import { useMemo, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, MessageSquare, Bot, User, Clock } from 'lucide-react';
import type { LiveChatSession } from '@/hooks/useLiveChat';

interface SessionsListProps {
  sessions: LiveChatSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function getStatusIndicator(status: LiveChatSession['status']) {
  switch (status) {
    case 'ai_active':
      return { color: 'bg-green-500', label: 'IA Ativa', icon: Bot };
    case 'human_takeover':
      return { color: 'bg-blue-500', label: 'Humano', icon: User };
    case 'waiting':
      return { color: 'bg-yellow-500', label: 'Aguardando', icon: Clock };
    default:
      return { color: 'bg-gray-400', label: 'Fechado', icon: MessageSquare };
  }
}

export const SessionsList = memo(function SessionsList({
  sessions,
  selectedSessionId,
  onSelectSession,
  searchQuery,
  onSearchChange
}: SessionsListProps) {
  // Memoize filtered sessions
  const filteredSessions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return sessions.filter(session => 
      session.contact_name?.toLowerCase().includes(query) ||
      session.contact_number.includes(query) ||
      session.assistant_name?.toLowerCase().includes(query) ||
      session.last_message_preview?.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma conversa ativa</p>
              <p className="text-sm">As conversas aparecerão aqui em tempo real</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const statusInfo = getStatusIndicator(session.status);
              const StatusIcon = statusInfo.icon;
              const isSelected = session.id === selectedSessionId;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                    isSelected && 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Indicator */}
                    <div className="relative mt-1">
                      <div className={cn(
                        'h-3 w-3 rounded-full',
                        statusInfo.color
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {session.contact_name || session.contact_number}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(session.last_message_at)}
                        </span>
                      </div>

                      {/* Preview */}
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {session.last_sender_type === 'ai' && '🤖 '}
                        {session.last_sender_type === 'human' && '👤 '}
                        {session.last_message_preview || 'Nova conversa'}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs h-5">
                          {session.source === 'telegram' ? '✈️ Telegram' : session.source === 'whatsapp' ? '📱 WhatsApp' : '💬 Widget'}
                        </Badge>
                        
                        {session.assistant_name && (
                          <Badge variant="secondary" className="text-xs h-5 truncate max-w-[100px]">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {session.assistant_name}
                          </Badge>
                        )}

                        {session.unread_count > 0 && (
                          <Badge className="text-xs h-5 bg-primary">
                            {session.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
