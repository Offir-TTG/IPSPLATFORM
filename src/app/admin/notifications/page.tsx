'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompactNotificationForm } from '@/components/admin/CompactNotificationForm';
import {
  Bell,
  Send,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  Eye,
  CheckCheck,
  Circle,
  RefreshCw,
  ChevronDown,
  X,
} from 'lucide-react';
import type {
  NotificationScope,
  NotificationCategory,
  NotificationPriority,
  CreateNotificationRequest,
} from '@/types/notifications';

interface Course {
  id: string;
  title: string;
}

interface Program {
  id: string;
  title: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const PRIORITY_ICONS = {
  low: Info,
  medium: Bell,
  high: AlertCircle,
  urgent: AlertCircle,
};

const PRIORITY_COLORS = {
  low: 'text-blue-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function AdminNotificationsPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  // Data for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSent: 0,
    todaySent: 0,
    unreadTotal: 0,
    totalDeleted: 0,
  });

  // Sent notifications history
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filters for notification history
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCourses();
    fetchPrograms();
    fetchSentNotifications();

    // Set up polling as a reliable fallback (every 30 seconds)
    const pollInterval = setInterval(() => {
      console.log('[Admin Notifications] Polling for updates...');
      fetchSentNotifications();
    }, 30000);

    // Set up real-time subscription for notification reads
    const setupRealtimeSubscription = async () => {
      const { supabase } = await import('@/lib/supabase/client');

      console.log('[Admin Notifications] Setting up real-time subscription...');

      const channel = supabase
        .channel('admin-notification-reads')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notification_reads',
          },
          (payload) => {
            console.log('[Admin Notifications] Real-time update received:', payload);
            // When any notification is read, refresh the list
            fetchSentNotifications();
          }
        )
        .subscribe((status) => {
          console.log('[Admin Notifications] Subscription status:', status);
        });

      return () => {
        console.log('[Admin Notifications] Unsubscribing from real-time...');
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      clearInterval(pollInterval);
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  const fetchSentNotifications = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/admin/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setSentNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/lms/courses');
      if (response.ok) {
        const result = await response.json();
        setCourses(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const result = await response.json();
        setPrograms(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };


  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-8" dir={direction}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" suppressHydrationWarning>
            {t('admin.notifications.pageTitle', 'Notifications')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('admin.notifications.pageDescription', 'Manage and send notifications to users')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.notifications.totalSent', 'Total Sent')}
              </CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.notifications.allTime', 'All time')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.notifications.todaySent', 'Sent Today')}
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySent}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.notifications.last24Hours', 'Last 24 hours')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.notifications.unreadTotal', 'Total Unread')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadTotal}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.notifications.acrossAllUsers', 'Across all users')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>
                {t('admin.notifications.totalDeleted', 'Total Deleted')}
              </CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeleted}</div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.notifications.deletedByUsers', 'Deleted by users')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create Notification Form */}
        <CompactNotificationForm
          users={users}
          courses={courses}
          programs={programs}
          onSuccess={() => {
            fetchSentNotifications();
            fetchStats();
          }}
          t={t}
          direction={direction}
        />

        {/* Sent Notifications History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span suppressHydrationWarning>
                    {t('admin.notifications.sentHistory', 'Sent Notifications')}
                  </span>
                </CardTitle>
                <CardDescription suppressHydrationWarning>
                  {t('admin.notifications.sentHistoryDesc', 'Recent notifications sent by admins')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSentNotifications}
                disabled={loadingHistory}
              >
                <RefreshCw className={`h-4 w-4 ltr:mr-2 rtl:ml-2 ${loadingHistory ? 'animate-spin' : ''}`} />
                <span suppressHydrationWarning>
                  {t('common.refresh', 'Refresh')}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label htmlFor="filter-scope" className="text-xs" suppressHydrationWarning>
                  {t('admin.notifications.filterScope', 'Filter by Scope')}
                </Label>
                <Select value={filterScope} onValueChange={setFilterScope}>
                  <SelectTrigger id="filter-scope" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" suppressHydrationWarning>
                      {t('common.all', 'All')}
                    </SelectItem>
                    <SelectItem value="individual" suppressHydrationWarning>
                      {t('admin.notifications.individual', 'Individual')}
                    </SelectItem>
                    <SelectItem value="course" suppressHydrationWarning>
                      {t('admin.notifications.course', 'Course')}
                    </SelectItem>
                    <SelectItem value="program" suppressHydrationWarning>
                      {t('admin.notifications.program', 'Program')}
                    </SelectItem>
                    <SelectItem value="tenant" suppressHydrationWarning>
                      {t('admin.notifications.tenant', 'All Users')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-category" className="text-xs" suppressHydrationWarning>
                  {t('admin.notifications.filterCategory', 'Filter by Category')}
                </Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger id="filter-category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" suppressHydrationWarning>
                      {t('common.all', 'All')}
                    </SelectItem>
                    <SelectItem value="lesson" suppressHydrationWarning>
                      {t('admin.notifications.categories.lesson', 'Lesson')}
                    </SelectItem>
                    <SelectItem value="assignment" suppressHydrationWarning>
                      {t('admin.notifications.categories.assignment', 'Assignment')}
                    </SelectItem>
                    <SelectItem value="payment" suppressHydrationWarning>
                      {t('admin.notifications.categories.payment', 'Payment')}
                    </SelectItem>
                    <SelectItem value="enrollment" suppressHydrationWarning>
                      {t('admin.notifications.categories.enrollment', 'Enrollment')}
                    </SelectItem>
                    <SelectItem value="attendance" suppressHydrationWarning>
                      {t('admin.notifications.categories.attendance', 'Attendance')}
                    </SelectItem>
                    <SelectItem value="achievement" suppressHydrationWarning>
                      {t('admin.notifications.categories.achievement', 'Achievement')}
                    </SelectItem>
                    <SelectItem value="announcement" suppressHydrationWarning>
                      {t('admin.notifications.categories.announcement', 'Announcement')}
                    </SelectItem>
                    <SelectItem value="system" suppressHydrationWarning>
                      {t('admin.notifications.categories.system', 'System')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-priority" className="text-xs" suppressHydrationWarning>
                  {t('admin.notifications.filterPriority', 'Filter by Priority')}
                </Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger id="filter-priority" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" suppressHydrationWarning>
                      {t('common.all', 'All')}
                    </SelectItem>
                    <SelectItem value="urgent" suppressHydrationWarning>
                      {t('admin.notifications.priority.urgent', 'Urgent')}
                    </SelectItem>
                    <SelectItem value="high" suppressHydrationWarning>
                      {t('admin.notifications.priority.high', 'High')}
                    </SelectItem>
                    <SelectItem value="medium" suppressHydrationWarning>
                      {t('admin.notifications.priority.medium', 'Medium')}
                    </SelectItem>
                    <SelectItem value="low" suppressHydrationWarning>
                      {t('admin.notifications.priority.low', 'Low')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                {t('admin.notifications.noHistory', 'No notifications sent yet')}
              </div>
            ) : (() => {
              const filteredNotifications = sentNotifications.filter((notification) => {
                if (filterScope !== 'all' && notification.scope !== filterScope) return false;
                if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
                if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
                return true;
              });

              return filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" suppressHydrationWarning>
                  {t('admin.notifications.noMatchingFilters', 'No notifications match your filters')}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table dir={direction}>
                    <TableHeader>
                      <TableRow className={isRtl ? 'text-right' : 'text-left'}>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.title', 'Title')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.recipient', 'Sent To')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.scope', 'Scope')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.category', 'Category')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.priority', 'Priority')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.date', 'Date')}
                        </TableHead>
                        <TableHead suppressHydrationWarning>
                          {t('admin.notifications.table.reads', 'Reads')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((notification) => {
                        const PriorityIcon = PRIORITY_ICONS[notification.priority as NotificationPriority];
                        const priorityColor = PRIORITY_COLORS[notification.priority as NotificationPriority];

                        return (
                          <TableRow key={notification.id}>
                            <TableCell>
                              <PriorityIcon className={`h-4 w-4 ${priorityColor}`} />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-[200px]">
                                <p className="truncate" title={notification.title}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate" title={notification.message}>
                                  {notification.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {notification.recipient_details && (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {notification.scope === 'individual' && <Users className="h-3 w-3" />}
                                    {notification.scope === 'course' && <BookOpen className="h-3 w-3" />}
                                    {notification.scope === 'program' && <GraduationCap className="h-3 w-3" />}
                                    {notification.scope === 'tenant' && <Building2 className="h-3 w-3" />}
                                    <span suppressHydrationWarning>
                                      {notification.scope === 'individual' && t('admin.notifications.entityType.student', 'Student')}
                                      {notification.scope === 'course' && t('admin.notifications.entityType.course', 'Course')}
                                      {notification.scope === 'program' && t('admin.notifications.entityType.program', 'Program')}
                                      {notification.scope === 'tenant' && t('admin.notifications.entityType.allUsers', 'All Users')}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium max-w-[150px] truncate" title={notification.recipient_details}>
                                    {notification.recipient_details}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                                {t(`admin.notifications.scope.${notification.scope}`, notification.scope)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                                {t(`admin.notifications.categories.${notification.category}`, notification.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs"
                                suppressHydrationWarning
                              >
                                {t(`admin.notifications.priority.${notification.priority}`, notification.priority)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {notification.read_count !== undefined && notification.total_recipients !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  {notification.read_count > 0 ? (
                                    <CheckCheck className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Circle className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  <span className="text-sm" suppressHydrationWarning>
                                    {`${notification.read_count}/${notification.total_recipients}`}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100" suppressHydrationWarning>
                  {t('admin.notifications.helpTitle', 'How notifications work')}
                </p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help1', 'Individual: Send to a specific user')}
                  </li>
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help2', 'Course: Send to all students enrolled in a course')}
                  </li>
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help3', 'Program: Send to all students enrolled in a program')}
                  </li>
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help4', 'Tenant: Send to all users in your organization')}
                  </li>
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help5', 'Urgent/High priority notifications show toast alerts')}
                  </li>
                  <li suppressHydrationWarning>
                    • {t('admin.notifications.help6', 'Users can configure their notification preferences')}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
