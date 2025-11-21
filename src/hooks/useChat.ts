import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface Conversation {
  conversation_id: string;
  conversation_name: string;
  conversation_description?: string;
  conversation_avatar?: string;
  context_type: 'program' | 'course';
  context_id: string;
  context_name: string;
  last_message_at?: string;
  unread_count: number;
  participant_count: number;
  last_message_content?: string;
  last_message_sender_name?: string;
}

export function useChat(conversationId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/chat/conversations/${convId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    convId: string,
    content: string,
    options?: {
      messageType?: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentSize?: number;
      replyToId?: string;
    }
  ) => {
    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return null;
      }

      const response = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setError(null);
      return data.message;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    } finally {
      setSending(false);
    }
  }, []);

  // Subscribe to real-time updates for a conversation
  useEffect(() => {
    if (!conversationId) return;

    // Set up Supabase Realtime channel
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);

          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              attachment_url,
              attachment_name,
              attachment_size,
              reply_to_id,
              is_edited,
              edited_at,
              is_deleted,
              created_at,
              sender:users!messages_sender_id_fkey (
                id,
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as Message]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } as Message : msg
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      fetchConversations();
    }
  }, [conversationId, fetchMessages, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    sending,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
  };
}
