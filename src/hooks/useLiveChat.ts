import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface LiveChatSession {
  id: string;
  user_id: string;
  instance_name: string;
  contact_number: string;
  contact_name: string | null;
  source: 'whatsapp' | 'widget' | 'telegram' | 'instagram' | 'messenger';
  status: 'ai_active' | 'human_takeover' | 'waiting' | 'closed';
  assistant_id: string | null;
  assistant_name: string | null;
  human_takeover_until: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_sender_type: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface LiveChatMessage {
  id: string;
  user_id: string;
  session_id: string | null;
  instance_name: string;
  contact_number: string;
  contact_name: string | null;
  sender_type: 'customer' | 'ai' | 'human';
  content: string;
  message_type: 'text' | 'audio' | 'image' | 'document' | 'video';
  media_url: string | null;
  source: 'whatsapp' | 'widget' | 'telegram';
  assistant_id: string | null;
  assistant_name: string | null;
  is_read: boolean;
  created_at: string;
}

export function useLiveChat() {
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || null;

  // Use ref to track selectedSessionId without causing re-subscriptions
  const selectedSessionIdRef = useRef<string | null>(null);
  selectedSessionIdRef.current = selectedSessionId;

  // Load initial sessions
  const loadSessions = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'closed')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []) as unknown as LiveChatSession[]);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load messages for selected session
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as unknown as LiveChatMessage[]);

      // Mark messages as read and reset unread count in parallel
      await Promise.all([
        supabase
          .from('live_chat_messages')
          .update({ is_read: true })
          .eq('session_id', sessionId)
          .eq('is_read', false),
        supabase
          .from('live_chat_sessions')
          .update({ unread_count: 0 })
          .eq('id', sessionId)
      ]);

    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [userId]);

  // When auth finishes with no user, stop loading spinner
  useEffect(() => {
    if (!authLoading && !userId) {
      setLoading(false);
    }
  }, [authLoading, userId]);

  // Subscribe to realtime updates + polling fallback
  useEffect(() => {
    if (!userId) return;

    loadSessions();

    // Polling fallback every 30s in case Realtime drops
    const pollInterval = setInterval(() => loadSessions(), 30000);

    // Refresh on window focus
    const handleFocus = () => loadSessions();
    window.addEventListener('focus', handleFocus);

    // Subscribe to sessions changes
    const sessionsChannel = supabase
      .channel(`live-sessions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as unknown as LiveChatSession;
            setSessions(prev => [newSession, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as unknown as LiveChatSession;
            setSessions(prev => {
              const filtered = prev.filter(s => s.id !== updatedSession.id);
              return [updatedSession, ...filtered].sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setSessions(prev => prev.filter(s => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel(`live-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as unknown as LiveChatMessage;

          if (newMessage.session_id === selectedSessionIdRef.current) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id || (m.id.startsWith('temp-') && m.content === newMessage.content))) {
                return prev.map(m =>
                  m.id.startsWith('temp-') && m.content === newMessage.content ? newMessage : m
                );
              }
              return [...prev, newMessage];
            });
          }
          // Refresh sessions to update unread count / last message preview
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, loadSessions]);

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    } else {
      setMessages([]);
    }
  }, [selectedSessionId, loadMessages]);

  // Send message from human with optimistic update
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedSessionId || !userId || !content.trim()) return false;

    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return false;

    const trimmedContent = content.trim();

    const optimisticMessage: LiveChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      session_id: selectedSessionId,
      instance_name: session.instance_name,
      contact_number: session.contact_number,
      contact_name: session.contact_name,
      sender_type: 'human',
      content: trimmedContent,
      message_type: 'text',
      media_url: null,
      source: session.source,
      assistant_id: session.assistant_id,
      assistant_name: session.assistant_name,
      is_read: true,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    supabase.functions.invoke('live-chat-send', {
      body: {
        session_id: selectedSessionId,
        instance_name: session.instance_name,
        contact_number: session.contact_number,
        message: trimmedContent,
        source: session.source,
        user_id: userId
      }
    }).then(({ error }) => {
      if (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        toast({
          title: 'Erro ao enviar',
          description: 'Não foi possível enviar a mensagem',
          variant: 'destructive'
        });
      }
    });

    return true;
  }, [selectedSessionId, userId, sessions, toast]);

  // Toggle human takeover
  const toggleHumanTakeover = useCallback(async (sessionId: string, duration: number = 2) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return false;

      const isCurrentlyTakeover = session.status === 'human_takeover';

      if (isCurrentlyTakeover) {
        await supabase
          .from('live_chat_sessions')
          .update({
            status: 'ai_active',
            human_takeover_until: null
          })
          .eq('id', sessionId);

        if (session.source === 'whatsapp') {
          await supabase
            .from('n8n_fluxogpt')
            .update({ last_sender: 'human', human_takeover_until: null })
            .eq('nomeinstancia', session.instance_name)
            .eq('whatsappuser', session.contact_number);
        }

        toast({
          title: 'IA Reativada',
          description: 'A IA voltará a responder automaticamente'
        });
      } else {
        const takeoverUntil = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

        await supabase
          .from('live_chat_sessions')
          .update({
            status: 'human_takeover',
            human_takeover_until: takeoverUntil
          })
          .eq('id', sessionId);

        if (session.source === 'whatsapp') {
          await supabase
            .from('n8n_fluxogpt')
            .update({ last_sender: 'human', human_takeover_until: takeoverUntil })
            .eq('nomeinstancia', session.instance_name)
            .eq('whatsappuser', session.contact_number);
        }

        toast({
          title: 'IA Pausada',
          description: `Você está atendendo este contato. IA pausada por ${duration}h`
        });
      }

      return true;
    } catch (err) {
      console.error('Error toggling takeover:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      });
      return false;
    }
  }, [sessions, toast]);

  // Close session
  const closeSession = useCallback(async (sessionId: string) => {
    try {
      await supabase
        .from('live_chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId);

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }

      toast({
        title: 'Conversa encerrada',
        description: 'A conversa foi marcada como encerrada'
      });

      return true;
    } catch (err) {
      console.error('Error closing session:', err);
      return false;
    }
  }, [selectedSessionId, toast]);

  // Selected session
  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Stats
  const stats = useMemo(() => {
    const aiActive = sessions.filter(s => s.status === 'ai_active').length;
    const humanTakeover = sessions.filter(s => s.status === 'human_takeover').length;
    const waiting = sessions.filter(s => s.status === 'waiting').length;
    const totalUnread = sessions.reduce((sum, s) => sum + (s.unread_count || 0), 0);

    const telegram = sessions.filter(s => s.source === 'telegram').length;

    return {
      total: sessions.length,
      aiActive,
      humanTakeover,
      waiting,
      totalUnread,
      telegram
    };
  }, [sessions]);

  return {
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
  };
}
