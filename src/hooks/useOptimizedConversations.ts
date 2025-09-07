import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { performanceCache, requestCache } from '@/utils/performance';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  assistant_id: string;
  assistants: { name: string };
  messages: Message[];
  updated_at: string;
}

export const useOptimizedConversations = (session: Session | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregamento otimizado de conversas com cache agressivo
  const loadConversations = useCallback(async (forceRefresh = false) => {
    if (!session) return;
    
    const cacheKey = `conversations_${session.user.id}`;
    
    return requestCache.getOrExecute(cacheKey, async () => {
      // Verificar cache primeiro
      if (!forceRefresh) {
        const cached = performanceCache.get(cacheKey) as Conversation[] | null;
        if (cached) {
          setConversations(cached);
          return cached;
        }
      }
      
      setLoading(true);
      try {
        const response = await supabase.functions.invoke('chat-api', {
          body: { action: 'get_conversations' },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.error) throw response.error;

        const conversationsList = response.data?.conversations || [];
        setConversations(conversationsList);
        
        // Cache por 10 minutos
        performanceCache.set(cacheKey, conversationsList, 10);
        return conversationsList;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    });
  }, [session]);

  // Carregamento otimizado de mensagens
  const loadMessages = useCallback(async (conversationId: string, forceRefresh = false) => {
    if (!session) return [];
    
    const cacheKey = `messages_${conversationId}`;
    
    return requestCache.getOrExecute(cacheKey, async () => {
      if (!forceRefresh) {
        const cached = performanceCache.get(cacheKey) as Message[] | null;
        if (cached) return cached;
      }

      const response = await supabase.functions.invoke('chat-api', {
        body: { action: 'get_messages', conversationId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;

      const messages = response.data?.messages || [];
      // Cache mensagens por 5 minutos
      performanceCache.set(cacheKey, messages, 5);
      return messages;
    });
  }, [session]);

  // Envio de mensagem otimizado
  const sendMessage = useCallback(async (conversationId: string, message: string) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('chat-api', {
      body: { action: 'send_message', conversationId, message },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar cache de mensagens para forçar reload
    performanceCache.invalidate(`messages_${conversationId}`);
    
    return response.data;
  }, [session]);

  // Criação otimizada de thread
  const createThread = useCallback(async (assistantId: string) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('chat-api', {
      body: { action: 'create_thread', assistantId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar cache de conversas
    performanceCache.invalidate(`conversations_${session.user.id}`);
    
    return response.data;
  }, [session]);

  // Deletar conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('chat-api', {
      body: { action: 'delete_conversation', conversationId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.error) throw response.error;

    // Invalidar caches relacionados
    performanceCache.invalidate(`conversations_${session.user.id}`);
    performanceCache.invalidate(`messages_${conversationId}`);
    
    return response.data;
  }, [session]);

  // Effect otimizado
  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session, loadConversations]);

  // Retorno memoizado
  return useMemo(() => ({
    conversations,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    createThread,
    deleteConversation,
  }), [conversations, loading, error, loadConversations, loadMessages, sendMessage, createThread, deleteConversation]);
};