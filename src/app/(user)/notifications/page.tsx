'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  Bell,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  Gift,
  Trophy,
  MessageSquare
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

// MOCKUP DATA
const mockNotifications = [
  {
    id: '1',
    type: 'zoom_meeting',
    title: 'Zoom Meeting Starting Soon',
    message: 'Your live session "Server Components Deep Dive" starts in 15 minutes',
    course: 'Advanced React Patterns',
    time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
    actionLabel: 'user.notifications.actions.joinMeeting',
    actionUrl: 'https://zoom.us/j/123456789',
    metadata: {
      meeting_id: '123 456 789',
      instructor: 'Dr. Sarah Johnson'
    }
  },
  {
    id: '2',
    type: 'zoom_meeting',
    title: 'Live Session Tomorrow',
    message: 'Don\'t forget: "Introduction to Node.js" scheduled for tomorrow at 10:00 AM',
    course: 'Node.js & Express - REST APIs',
    time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    priority: 'medium',
    actionLabel: 'user.notifications.actions.viewDetails',
    actionUrl: '#',
    metadata: {
      meeting_id: '987 654 321',
      instructor: 'Alex Martinez'
    }
  },
  {
    id: '3',
    type: 'assignment_due',
    title: 'Assignment Due Soon',
    message: 'Complete your "Build a REST API" project - Due in 2 days',
    course: 'Node.js & Express - REST APIs',
    time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
    actionLabel: 'user.notifications.actions.startAssignment',
    actionUrl: '#'
  },
  {
    id: '4',
    type: 'achievement',
    title: 'New Achievement Unlocked!',
    message: 'Congratulations! You\'ve earned the "5-Day Streak" badge',
    course: null,
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    priority: 'low',
    actionLabel: 'user.notifications.actions.viewAchievements',
    actionUrl: '#'
  },
  {
    id: '5',
    type: 'course_update',
    title: 'New Content Available',
    message: '3 new lessons added to "Advanced React Patterns & Performance"',
    course: 'Advanced React Patterns',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    priority: 'low',
    actionLabel: 'user.notifications.actions.viewCourse',
    actionUrl: '#'
  },
  {
    id: '6',
    type: 'zoom_recording',
    title: 'Recording Available',
    message: 'Recording for "React Performance Optimization" is now available',
    course: 'Advanced React Patterns',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    priority: 'medium',
    actionLabel: 'user.notifications.actions.watchRecording',
    actionUrl: '#'
  },
  {
    id: '7',
    type: 'message',
    title: 'New Message from Instructor',
    message: 'Dr. Sarah Johnson: "Great work on your last assignment!"',
    course: 'Advanced React Patterns',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    priority: 'medium',
    actionLabel: 'user.notifications.actions.viewMessage',
    actionUrl: '#'
  },
  {
    id: '8',
    type: 'certificate',
    title: 'Certificate Ready!',
    message: 'Your certificate for "Professional Portrait Photography" is ready to download',
    course: 'Professional Portrait Photography',
    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
    actionLabel: 'user.notifications.actions.downloadCertificate',
    actionUrl: '#'
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'zoom_meeting':
    case 'zoom_recording':
      return <Video className="h-5 w-5" />;
    case 'assignment_due':
      return <FileText className="h-5 w-5" />;
    case 'achievement':
      return <Trophy className="h-5 w-5" />;
    case 'course_update':
      return <Bell className="h-5 w-5" />;
    case 'message':
      return <MessageSquare className="h-5 w-5" />;
    case 'certificate':
      return <Gift className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'zoom_meeting':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'assignment_due':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    case 'achievement':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    case 'course_update':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'message':
      return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
    case 'certificate':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    case 'zoom_recording':
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
    default:
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
  }
};

const getTimeAgo = (dateString: string, t: (key: string, fallback?: string) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Future dates
  if (diffMs > 0) {
    if (diffMins < 60) return `${t('user.notifications.time.in', 'In')} ${diffMins} ${t('user.notifications.time.minutes', 'minutes')}`;
    if (diffHours < 24) return `${t('user.notifications.time.in', 'In')} ${diffHours} ${t('user.notifications.time.hours', 'hours')}`;
    if (diffDays === 1) return t('user.notifications.time.tomorrow', 'Tomorrow');
    return `${t('user.notifications.time.in', 'In')} ${diffDays} ${t('user.notifications.time.days', 'days')}`;
  }

  // Past dates
  const absDiffMins = Math.abs(diffMins);
  const absDiffHours = Math.abs(diffHours);
  const absDiffDays = Math.abs(diffDays);

  if (absDiffMins < 60) return `${absDiffMins} ${t('user.notifications.time.minutesAgo', 'minutes ago')}`;
  if (absDiffHours < 24) return `${absDiffHours} ${t('user.notifications.time.hoursAgo', 'hours ago')}`;
  if (absDiffDays === 1) return t('user.notifications.time.yesterday', 'Yesterday');
  return `${absDiffDays} ${t('user.notifications.time.daysAgo', 'days ago')}`;
};

export default function NotificationsPage() {
  const { t } = useUserLanguage();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'zoom') return notification.type.includes('zoom');
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const zoomCount = notifications.filter(n => n.type.includes('zoom')).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.5rem'
          }}>{t('user.notifications.title')}</h1>
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {t('user.notifications.subtitle')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingInlineStart: '0.75rem',
              paddingInlineEnd: '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              backgroundColor: 'transparent',
              color: 'hsl(var(--text-body))',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              transition: 'background-color 0.2s'
            }}
            className="hover:bg-accent"
          >
            <Check className="h-4 w-4" />
            {t('user.notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.notifications.stats.total')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{notifications.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.notifications.stats.unread')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{unreadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>{t('user.notifications.stats.zoom')}</p>
              <p style={{
                fontSize: 'var(--font-size-2xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{zoomCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">
            {t('user.notifications.tabs.all')} ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t('user.notifications.tabs.unread')} ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="zoom">
            {t('user.notifications.tabs.zoom')} ({zoomCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-5 transition-all hover:shadow-md ${
              !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20 ltr:border-l-4 ltr:border-l-blue-500 rtl:border-r-4 rtl:border-r-blue-500' : ''
            }`}
          >
            <div className="flex gap-4">
              {/* Icon */}
              <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)} flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))'
                      }}>{notification.title}</h3>
                      {!notification.read && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingInlineStart: '0.625rem',
                          paddingInlineEnd: '0.625rem',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          borderRadius: 'calc(var(--radius) * 1.5)',
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-family-primary)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}>{t('user.notifications.badge.new')}</span>
                      )}
                      {notification.priority === 'high' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingInlineStart: '0.625rem',
                          paddingInlineEnd: '0.625rem',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          backgroundColor: 'hsl(var(--destructive))',
                          color: 'hsl(var(--destructive-foreground))',
                          borderRadius: 'calc(var(--radius) * 1.5)',
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-family-primary)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}>{t('user.notifications.badge.urgent')}</span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '0.5rem'
                    }}>
                      {notification.message}
                    </p>
                    {notification.course && (
                      <span style={{
                        display: 'inline-block',
                        paddingInlineStart: '0.625rem',
                        paddingInlineEnd: '0.625rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'transparent',
                        color: 'hsl(var(--text-body))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {notification.course}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        title={t('user.notifications.actions.markRead')}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--text-body))',
                          transition: 'background-color 0.2s',
                          borderRadius: 'calc(var(--radius))'
                        }}
                        className="hover:bg-accent"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      title={t('user.notifications.actions.delete')}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--text-body))',
                        transition: 'background-color 0.2s',
                        borderRadius: 'calc(var(--radius))'
                      }}
                      className="hover:bg-accent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata for Zoom meetings */}
                {notification.type === 'zoom_meeting' && notification.metadata && (
                  <Card className="p-3 mb-3 bg-muted/50">
                    <div className="flex items-center gap-4" style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-body))'
                    }}>
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                        <span className="font-mono">{notification.metadata.meeting_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                        <span>{new Date(notification.time).toLocaleDateString()} at {new Date(notification.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1" style={{
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(notification.time, t)}</span>
                  </div>

                  {notification.priority === 'high' ? (
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        paddingInlineStart: '0.75rem',
                        paddingInlineEnd: '0.75rem',
                        paddingTop: '0.375rem',
                        paddingBottom: '0.375rem',
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        transition: 'opacity 0.2s'
                      }}
                      className="hover:opacity-90"
                    >
                      {t(notification.actionLabel)}
                      {notification.type === 'zoom_meeting' && (
                        <ExternalLink className="h-3 w-3 ltr:ml-1 rtl:mr-1" />
                      )}
                    </button>
                  ) : (
                    <button
                      style={{
                        paddingInlineStart: '0.75rem',
                        paddingInlineEnd: '0.75rem',
                        paddingTop: '0.375rem',
                        paddingBottom: '0.375rem',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        backgroundColor: 'transparent',
                        color: 'hsl(var(--text-body))',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        transition: 'background-color 0.2s'
                      }}
                      className="hover:bg-accent"
                    >
                      {t(notification.actionLabel)}
                      {notification.type === 'zoom_meeting' && (
                        <ExternalLink className="h-3 w-3 ltr:ml-1 rtl:mr-1" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
              backgroundColor: 'hsl(var(--muted))'
            }}>
              <Bell className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>{t('user.notifications.empty.title')}</h3>
            <p style={{
              color: 'hsl(var(--text-muted))',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {activeTab === 'all'
                ? t('user.notifications.empty.allCaughtUp')
                : `${t('user.notifications.empty.noFilteredNotifications')} (${activeTab})`
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
