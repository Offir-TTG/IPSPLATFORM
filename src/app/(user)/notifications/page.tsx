'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationPriority, NotificationCategory } from '@/types/notifications';
import Link from 'next/link';

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  urgent: 'text-destructive bg-destructive/10 border-destructive/20',
  high: 'text-warning bg-warning/10 border-warning/20',
  medium: 'text-info bg-info/10 border-info/20',
  low: 'text-primary bg-primary/10 border-primary/20',
};

const PRIORITY_ICONS: Record<NotificationPriority, any> = {
  urgent: AlertCircle,
  high: AlertCircle,
  medium: Bell,
  low: Info,
};

// Category labels will be dynamically translated using t() function

export default function NotificationsPage() {
  const { t } = useUserLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for deleted notifications
  const [deletedNotifications, setDeletedNotifications] = useState<Notification[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  // Fetch notifications with real-time updates
  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  } = useNotifications();

  // Fetch deleted count on page load
  useEffect(() => {
    fetchDeletedCount();
  }, []);

  // Fetch deleted notifications when deleted tab is active
  useEffect(() => {
    if (activeTab === 'deleted') {
      fetchDeletedNotifications();
    }
  }, [activeTab]);

  const fetchDeletedCount = async () => {
    try {
      const response = await fetch('/api/notifications/deleted?limit=0');
      const data = await response.json();
      setDeletedCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching deleted count:', error);
    }
  };

  const fetchDeletedNotifications = async () => {
    setLoadingDeleted(true);
    try {
      const response = await fetch('/api/notifications/deleted');
      const data = await response.json();
      setDeletedNotifications(data.notifications || []);
      setDeletedCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching deleted notifications:', error);
    } finally {
      setLoadingDeleted(false);
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'deleted'
    ? deletedNotifications
    : notifications.filter((notif) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notif.is_read;
        if (activeTab === 'read') return notif.is_read;
        return true;
      });

  // Handle delete confirmation
  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete.id);
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const getCategoryLabel = (category: NotificationCategory): string => {
    const key = `user.notifications.category.${category}`;
    const fallback = category.charAt(0).toUpperCase() + category.slice(1);
    return t(key, fallback);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return t('user.notifications.time.justNow', 'Just now');
    if (diffInMins < 60) {
      const template = t('user.notifications.time.minutesAgo', `${diffInMins} minutes ago`);
      return template.replace('{count}', diffInMins.toString());
    }
    if (diffInHours < 24) {
      const template = t('user.notifications.time.hoursAgo', `${diffInHours} hours ago`);
      return template.replace('{count}', diffInHours.toString());
    }
    const template = t('user.notifications.time.daysAgo', `${diffInDays} days ago`);
    return template.replace('{count}', diffInDays.toString());
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const PriorityIcon = PRIORITY_ICONS[notification.priority];
    const priorityColor = PRIORITY_COLORS[notification.priority];
    const isRead = notification.is_read ?? false;

    return (
      <div
        className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
          isRead
            ? 'bg-card border-border/50 hover:border-border/70'
            : 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-sm hover:shadow-md hover:border-primary/30'
        }`}
      >
        {/* Visual indicators for read/unread */}
        {!isRead ? (
          <div className="absolute top-0 ltr:left-0 rtl:right-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
        ) : (
          <div className="absolute top-0 ltr:left-0 rtl:right-0 w-1 h-full bg-gradient-to-b from-success to-success/50"></div>
        )}

        <div className="p-5 ltr:pl-6 rtl:pr-6">
          <div className="flex items-start gap-4">
            {/* Priority Icon */}
            <div className={`relative flex-shrink-0 p-2.5 rounded-xl transition-all duration-300 ${
              isRead
                ? 'bg-success/10 text-success'
                : `shadow-sm ${priorityColor} group-hover:scale-110`
            }`}>
              <PriorityIcon className="h-5 w-5" />
              {!isRead && (
                <span className="absolute -top-1 ltr:-right-1 rtl:-left-1 h-3 w-3 rounded-full bg-primary border-2 border-background animate-pulse"></span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={`text-sm leading-tight transition-all ${
                      !isRead
                        ? 'font-semibold text-foreground'
                        : 'font-medium text-foreground'
                    }`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
                    {notification.message}
                  </p>

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTimeAgo(notification.created_at)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-foreground">
                      {getCategoryLabel(notification.category)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity">
                  {!isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={isMarkingAsRead}
                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                      title={t('user.notifications.markRead', 'Mark as read')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(notification)}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title={t('user.notifications.delete', 'Delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Button */}
              {notification.action_url && (
                <Link href={notification.action_url} className="inline-block mt-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80 font-medium group/link"
                  >
                    {notification.action_label || t('user.notifications.viewDetails', 'View Details')}
                    <ExternalLink className="ltr:ml-1.5 rtl:mr-1.5 h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }} suppressHydrationWarning>
              {t('user.notifications.title', 'Notifications')}
            </h1>
            <p style={{
              color: 'hsl(var(--text-muted))',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }} suppressHydrationWarning>
              {t('user.notifications.subtitle', 'Stay updated with your learning journey')}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={() => {
                console.log('[NotificationsPage] Mark All button clicked, unreadCount:', unreadCount);
                markAllAsRead();
              }}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <>
                  <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                  <span suppressHydrationWarning>
                    {t('user.notifications.markingAllRead', 'Marking...')}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                  <span suppressHydrationWarning>
                    {t('user.notifications.markAllRead', 'Mark All as Read')}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }} suppressHydrationWarning>
                {t('user.notifications.stats.total', 'Total')}
              </p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{total}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              backgroundColor: 'hsl(var(--accent))'
            }}>
              <Bell className="h-6 w-6" style={{ color: 'hsl(var(--accent-foreground))' }} />
            </div>
          </div>
        </Card>

        <Card className="p-4 ltr:border-l-4 rtl:border-r-4" style={{ borderColor: 'hsl(var(--primary))' }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }} suppressHydrationWarning>
                {t('user.notifications.stats.unread', 'Unread')}
              </p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--primary))'
              }}>{unreadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              backgroundColor: 'hsl(var(--primary) / 0.1)'
            }}>
              <Bell className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.25rem'
              }} suppressHydrationWarning>
                {t('user.notifications.stats.read', 'Read')}
              </p>
              <p style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{total - unreadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
              backgroundColor: 'hsl(var(--success) / 0.1)'
            }}>
              <CheckCircle2 className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-6 pt-6">
            <TabsList>
              <TabsTrigger value="all" suppressHydrationWarning>
                {t('user.notifications.tabs.all', 'All')} ({total})
              </TabsTrigger>
              <TabsTrigger value="unread" suppressHydrationWarning>
                {t('user.notifications.tabs.unread', 'Unread')} ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read" suppressHydrationWarning>
                {t('user.notifications.tabs.read', 'Read')} ({total - unreadCount})
              </TabsTrigger>
              <TabsTrigger value="deleted" suppressHydrationWarning>
                {t('user.notifications.tabs.deleted', 'Deleted')} ({deletedCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="p-6 space-y-3">
            {(isLoading || (activeTab === 'deleted' && loadingDeleted)) ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
                <p style={{
                  color: 'hsl(var(--text-muted))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }} suppressHydrationWarning>
                  {t('common.loading', 'Loading...')}
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                  backgroundColor: 'hsl(var(--destructive) / 0.1)'
                }}>
                  <AlertCircle className="h-8 w-8" style={{ color: 'hsl(var(--destructive))' }} />
                </div>
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '0.5rem'
                }} suppressHydrationWarning>
                  {t('user.notifications.error', 'Failed to load notifications')}
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                  backgroundColor: 'hsl(var(--muted))'
                }}>
                  <Bell className="h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }} suppressHydrationWarning>
                  {t('user.notifications.noNotifications', 'No notifications')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle suppressHydrationWarning>
              {t('user.notifications.deleteDialog.title', 'Delete Notification?')}
            </AlertDialogTitle>
            <AlertDialogDescription suppressHydrationWarning>
              {t('user.notifications.deleteDialog.description', 'Are you sure you want to delete this notification? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {notificationToDelete && (
            <div className="rounded-lg border bg-muted/50 p-3 my-2">
              <p className="font-medium text-sm mb-1">{notificationToDelete.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{notificationToDelete.message}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel suppressHydrationWarning>
              {t('user.notifications.deleteDialog.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
              <span suppressHydrationWarning>
                {t('user.notifications.deleteDialog.confirm', 'Delete')}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
