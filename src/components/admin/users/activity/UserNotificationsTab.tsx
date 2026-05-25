'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

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

export function UserNotificationsTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/notifications`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => { if (!cancelled) setNotifications(d.notifications ?? []); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
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

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.notifications.empty', 'No notifications.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Card key={n.id} className={n.read_at ? '' : 'border-primary/40'}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-1 break-words">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {t(`admin.users.activity.values.category.${n.category}`, n.category)}
                </Badge>
                <Badge variant={priorityVariant(n.priority)} className="text-xs">
                  {t(`admin.users.activity.values.priority.${n.priority}`, n.priority)}
                </Badge>
                <Badge variant={n.read_at ? 'secondary' : 'default'} className="text-xs">
                  {n.read_at
                    ? t('admin.users.activity.notifications.readBadge', 'Read')
                    : t('admin.users.activity.notifications.unreadBadge', 'Unread')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
