import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LiveChatSession {
  id: string;
  user_id: string;
  instance_name: string;
  contact_number: string;
  contact_name: string | null;
  source: 'whatsapp' | 'widget';
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
  source: 'whatsapp' | 'widget';
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
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

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
      
      // Type assertion since we know the structure
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

      // Mark messages as read
      await supabase
        .from('live_chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('is_read', false);

      // Reset unread count on session
      await supabase
        .from('live_chat_sessions')
        .update({ unread_count: 0 })
        .eq('id', sessionId);

    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    loadSessions();

    // Subscribe to sessions changes
    const sessionsChannel = supabase
      .channel('live-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Session update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as unknown as LiveChatSession;
            setSessions(prev => [newSession, ...prev]);
            
            // Play notification sound for new session
            playNotificationSound();
          } else if (payload.eventType === 'UPDATE') {
            const updatedSession = payload.new as unknown as LiveChatSession;
            setSessions(prev => {
              const filtered = prev.filter(s => s.id !== updatedSession.id);
              // Sort by last_message_at desc
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
      .channel('live-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New message:', payload);
          const newMessage = payload.new as unknown as LiveChatMessage;
          
          // Add message if it's for the selected session
          if (newMessage.session_id === selectedSessionId) {
            setMessages(prev => [...prev, newMessage]);
          }

          // Play sound for customer messages
          if (newMessage.sender_type === 'customer') {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, selectedSessionId, loadSessions]);

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    } else {
      setMessages([]);
    }
  }, [selectedSessionId, loadMessages]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1aW19dZGdvcnBzd3x8f4CCgoKDgoGAf359e3p4dnRycW9ubWxramlpaGdmZmVkZGNjYmJhYWBgX19eXl1dXFxbW1tbWlpaWVlZWFhYV1dXV1ZWVlVVVVRUVFNTU1JSUlFRUVBQUE9PT05OTk1NTUxMTEtLS0pKSklJSUhISEdHR0ZGRkVFRURERENDQ0JCQkFBQUBAQD8/Pz4+Pj09PTw8PDs7Ozo6Ojk5OTg4ODc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC8vLy4uLi0tLSwsLCsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx4eHh0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEhERERAQEA8PDw4ODg0NDQwMDAsLCwoKCgkJCQgICAcHBwYGBgUFBQQEBAMDAwICAgEBAQAAAA==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  // Send message from human
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedSessionId || !userId || !content.trim()) return false;

    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return false;

    try {
      // Call edge function to send message
      const { data, error } = await supabase.functions.invoke('live-chat-send', {
        body: {
          session_id: selectedSessionId,
          instance_name: session.instance_name,
          contact_number: session.contact_number,
          message: content.trim(),
          source: session.source,
          user_id: userId
        }
      });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive'
      });
      return false;
    }
  }, [selectedSessionId, userId, sessions, toast]);

  // Toggle human takeover
  const toggleHumanTakeover = useCallback(async (sessionId: string, duration: number = 2) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return false;

      const isCurrentlyTakeover = session.status === 'human_takeover';
      
      if (isCurrentlyTakeover) {
        // Reactivate AI
        await supabase
          .from('live_chat_sessions')
          .update({ 
            status: 'ai_active',
            human_takeover_until: null 
          })
          .eq('id', sessionId);

        // Also update n8n_fluxogpt if it's WhatsApp
        if (session.source === 'whatsapp') {
          // Use type assertion to handle columns not in generated types
          await supabase
            .from('n8n_fluxogpt')
            .update({ last_sender: 'human' })
            .eq('nomeinstancia', session.instance_name)
            .eq('whatsappuser', session.contact_number);
        }

        toast({
          title: 'IA Reativada',
          description: 'A IA voltará a responder automaticamente'
        });
      } else {
        // Activate human takeover
        const takeoverUntil = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();

        await supabase
          .from('live_chat_sessions')
          .update({ 
            status: 'human_takeover',
            human_takeover_until: takeoverUntil 
          })
          .eq('id', sessionId);

        // Also update n8n_fluxogpt if it's WhatsApp
        if (session.source === 'whatsapp') {
          await supabase
            .from('n8n_fluxogpt')
            .update({ last_sender: 'human' })
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

    return {
      total: sessions.length,
      aiActive,
      humanTakeover,
      waiting,
      totalUnread
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
