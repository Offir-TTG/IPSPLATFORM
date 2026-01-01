import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useUserLanguage } from '@/context/AppContext';
import type {
  Notification,
  GetNotificationsRequest,
  GetNotificationsResponse,
} from '@/types/notifications';

/**
 * React hook for managing notifications
 * Features:
 * - Fetches notifications with filters and pagination
 * - Real-time updates via Supabase Realtime
 * - Mutations for mark as read, delete
 * - Auto-shows toast for urgent/high priority notifications
 */
export function useNotifications(params: GetNotificationsRequest = {}) {
  const { t } = useUserLanguage();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Build query key with params for cache management
  const queryKey = ['notifications', params];

  // Fetch notifications
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<GetNotificationsResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      if (params.category) searchParams.set('category', params.category);
      if (params.priority) searchParams.set('priority', params.priority);
      if (params.unread_only) searchParams.set('unread_only', 'true');

      const response = await fetch(`/api/notifications?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return response.json();
    },
    refetchInterval: 60000, // Refetch every 60 seconds as fallback
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get current user ID for realtime subscription
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            // Show toast for urgent/high priority notifications
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              toast(newNotification.title, {
                description: newNotification.message,
                duration: newNotification.priority === 'urgent' ? 10000 : 5000,
                action: newNotification.action_url ? {
                  label: newNotification.action_label || 'View',
                  onClick: () => {
                    window.location.href = newNotification.action_url!;
                  },
                } : undefined,
              });
            }

            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error(t('user.notifications.errors.markReadFailed', 'Failed to mark notification as read'));
    },
  });

  // Mark notification as unread
  const markAsUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as unread');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('Error marking notification as unread:', error);
      toast.error(t('user.notifications.errors.markUnreadFailed', 'Failed to mark notification as unread'));
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      if (data.marked_count > 0) {
        const message = t('user.notifications.success.markedAllRead', `Marked ${data.marked_count} notifications as read`);
        toast.success(message.replace('{count}', data.marked_count.toString()));
      } else {
        toast.info(t('user.notifications.info.noUnreadNotifications', 'No unread notifications to mark'));
      }
    },
    onError: (error) => {
      console.error('Error marking all as read:', error);
      toast.error(t('user.notifications.errors.markAllReadFailed', 'Failed to mark all notifications as read'));
    },
  });

  // Delete notification (admin only)
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success(t('user.notifications.success.deleted', 'Notification deleted'));
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error(t('user.notifications.errors.deleteFailed', 'Failed to delete notification'));
    },
  });

  return {
    // Data
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unread_count || 0,
    hasMore: data?.has_more || false,

    // Loading states
    isLoading,
    error,
    isSubscribed,

    // Actions
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
}
