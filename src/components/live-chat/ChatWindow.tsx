import { memo, useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Bot, 
  User, 
  Pause, 
  Play, 
  MoreVertical,
  Phone,
  X,
  Clock,
  MessageSquare
} from 'lucide-react';
import type { LiveChatSession, LiveChatMessage } from '@/hooks/useLiveChat';

interface ChatWindowProps {
  session: LiveChatSession | null;
  messages: LiveChatMessage[];
  onSendMessage: (content: string) => Promise<boolean>;
  onToggleTakeover: (sessionId: string, duration?: number) => Promise<boolean>;
  onClose: (sessionId: string) => Promise<boolean>;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

const MessageBubble = memo(function MessageBubble({ message }: { message: LiveChatMessage }) {
  const isCustomer = message.sender_type === 'customer';
  const isAI = message.sender_type === 'ai';
  const isHuman = message.sender_type === 'human';

  return (
    <div className={cn(
      'flex gap-2 max-w-[85%]',
      isCustomer ? 'self-start' : 'self-end flex-row-reverse'
    )}>
      {/* Avatar */}
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
        isCustomer && 'bg-muted',
        isAI && 'bg-green-100 dark:bg-green-900/30',
        isHuman && 'bg-blue-100 dark:bg-blue-900/30'
      )}>
        {isCustomer && <User className="h-4 w-4 text-muted-foreground" />}
        {isAI && <Bot className="h-4 w-4 text-green-600" />}
        {isHuman && <User className="h-4 w-4 text-blue-600" />}
      </div>

      {/* Content */}
      <div className={cn(
        'rounded-2xl px-4 py-2',
        isCustomer && 'bg-muted rounded-tl-sm',
        isAI && 'bg-green-100 dark:bg-green-900/30 rounded-tr-sm',
        isHuman && 'bg-blue-100 dark:bg-blue-900/30 rounded-tr-sm'
      )}>
        {/* Sender label for AI/Human */}
        {!isCustomer && (
          <p className={cn(
            'text-xs font-medium mb-1',
            isAI && 'text-green-600',
            isHuman && 'text-blue-600'
          )}>
            {isAI ? '🤖 IA' : '👤 Você'}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Time */}
        <p className={cn(
          'text-xs mt-1 opacity-60',
          !isCustomer && 'text-right'
        )}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
});

export const ChatWindow = memo(function ChatWindow({
  session,
  messages,
  onSendMessage,
  onToggleTakeover,
  onClose
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when session changes
  useEffect(() => {
    if (session) {
      inputRef.current?.focus();
    }
  }, [session?.id]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    const success = await onSendMessage(inputValue.trim());
    setSending(false);

    if (success) {
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // No session selected
  if (!session) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Selecione uma conversa</h3>
        <p className="text-sm text-center mt-2">
          Escolha uma conversa à esquerda para visualizar e responder mensagens em tempo real
        </p>
      </div>
    );
  }

  const isTakeover = session.status === 'human_takeover';

  // Group messages by date
  const messagesByDate: { [key: string]: LiveChatMessage[] } = {};
  messages.forEach(msg => {
    const date = formatDate(msg.created_at);
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(msg);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">
                {session.contact_name || (session.source === 'widget' ? 'Visitante' : session.contact_number)}
              </h2>
              <Badge variant={isTakeover ? 'default' : 'secondary'} className="text-xs">
                {isTakeover ? '👤 Você atendendo' : '🤖 IA Ativa'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {(session.source === 'whatsapp' || session.source === 'telegram') && (
                <>
                  <Phone className="h-3 w-3" />
                  <span>{session.contact_number}</span>
                  <span>•</span>
                </>
              )}
              <span>
                {session.source === 'whatsapp' ? '📱 WhatsApp' :
                 session.source === 'telegram' ? '✈️ Telegram' : '💬 Widget'}
              </span>
              {session.assistant_name && (
                <>
                  <span>•</span>
                  <span>{session.assistant_name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Takeover Button */}
            <Button
              variant={isTakeover ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleTakeover(session.id)}
            >
              {isTakeover ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Reativar IA
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar IA
                </>
              )}
            </Button>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleTakeover(session.id, 1)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Pausar IA por 1h
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleTakeover(session.id, 4)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Pausar IA por 4h
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleTakeover(session.id, 8)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Pausar IA por 8h
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem 
                  onClick={() => onClose(session.id)}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Encerrar conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="flex flex-col gap-6">
          {Object.entries(messagesByDate).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date separator */}
              <div className="flex items-center justify-center my-2">
                <div className="bg-muted px-4 py-1.5 rounded-full text-xs text-muted-foreground font-medium">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              <div className="flex flex-col gap-4">
                {msgs.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-base">Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">As mensagens aparecerão aqui em tempo real</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Ao enviar uma mensagem, a IA será pausada automaticamente por 2 horas
        </p>
      </div>
    </div>
  );
});
