'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { TabPagination } from './TabPagination';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

function priorityVariant(p: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (p === 'critical' || p === 'high') return 'destructive';
  if (p === 'medium') return 'outline';
  return 'secondary';
}

const PAGE_SIZE = 20;

export function UserNotificationsTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/notifications?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setNotifications(d.notifications ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
        </CardContent>
      </Card>
    );
  }
  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.notifications.empty', 'No notifications.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.notifications.title', 'Notifications')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.notifications.count', '{{count}} notifications').replace('{{count}}', String(total))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveTable>
            <ResponsiveTable.Desktop>
              <div className="overflow-x-auto" dir={direction}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.notifications.col.title', 'Title')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.notifications.col.category', 'Category')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.notifications.col.priority', 'Priority')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.notifications.col.sent', 'Sent')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.notifications.col.read', 'Read')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => (
                      <TableRow key={n.id} className={n.read_at ? '' : 'bg-primary/5'}>
                        <TableCell className="max-w-md">
                          <p className="font-medium truncate" dir="auto" title={n.title}>{n.title}</p>
                          {n.message && (
                            <p className="text-xs text-muted-foreground truncate" dir="auto" title={n.message}>
                              {n.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {t(`admin.users.activity.values.category.${n.category}`, n.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityVariant(n.priority)} className="text-[10px]">
                            {t(`admin.users.activity.values.priority.${n.priority}`, n.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(n.created_at).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={n.read_at ? 'secondary' : 'default'} className="text-[10px]">
                            {n.read_at
                              ? t('admin.users.activity.notifications.readBadge', 'Read')
                              : t('admin.users.activity.notifications.unreadBadge', 'Unread')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {notifications.map((n) => (
                <div key={n.id} className={`rounded-lg border p-3 space-y-2 ${n.read_at ? '' : 'border-primary/40 bg-primary/5'}`}>
                  <p className="font-medium break-words" dir="auto">{n.title}</p>
                  {n.message && (
                    <p className="text-sm text-muted-foreground break-words line-clamp-2" dir="auto">
                      {n.message}
                    </p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {t(`admin.users.activity.values.category.${n.category}`, n.category)}
                    </Badge>
                    <Badge variant={priorityVariant(n.priority)} className="text-[10px]">
                      {t(`admin.users.activity.values.priority.${n.priority}`, n.priority)}
                    </Badge>
                    <Badge variant={n.read_at ? 'secondary' : 'default'} className="text-[10px]">
                      {n.read_at
                        ? t('admin.users.activity.notifications.readBadge', 'Read')
                        : t('admin.users.activity.notifications.unreadBadge', 'Unread')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(dateLocale)}
                  </p>
                </div>
              ))}
            </ResponsiveTable.Mobile>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <TabPagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        loading={loading}
      />
    </div>
  );
}
