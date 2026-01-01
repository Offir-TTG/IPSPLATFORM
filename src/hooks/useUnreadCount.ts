import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

/**
 * Lightweight React hook for notification unread count
 * Used for bell icon badge display
 * Features:
 * - Fetches unread count via API
 * - Real-time updates via Supabase Realtime
 * - Auto-refreshes every 30 seconds as fallback
 * - Optimized for performance (minimal data transfer)
 */
export function useUnreadCount() {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch unread count
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<{ unread_count: number }>({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  // Get current user ID for realtime subscription
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Subscribe to notification changes
      const channel = supabase
        .channel('unread-count-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          () => {
            // New notification created, invalidate count
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_reads',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Notification was marked as read
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notification_reads',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Notification was marked as unread
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
          },
          () => {
            // Notification was deleted
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          }
        });

      // Cleanup on unmount
      return () => {
        channel.unsubscribe();
        setIsSubscribed(false);
      };
    };

    setupRealtime();
  }, [queryClient]);

  return {
    unreadCount: data?.unread_count || 0,
    isLoading,
    error,
    isSubscribed,
    refetch,
  };
}
