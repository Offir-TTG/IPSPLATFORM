'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AuditEventsTable } from '@/components/audit/AuditEventsTable';
import type { AuditEvent } from '@/lib/audit/types';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserActivityTabProps {
  userId: string;
}

type ActivityResponse = { events: AuditEvent[]; nextCursor: string | null };

const CATEGORIES = [
  'DATA', 'AUTH', 'ADMIN', 'CONFIG', 'SECURITY', 'COMPLIANCE',
  'SYSTEM', 'EDUCATION', 'STUDENT_RECORD', 'GRADE', 'ATTENDANCE',
  'PARENTAL_ACCESS',
] as const;

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const { t } = useAdminLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null, currentCategory: string, append: boolean) => {
      const qs = new URLSearchParams({ limit: '50' });
      if (cursor) qs.set('cursor', cursor);
      if (currentCategory && currentCategory !== 'all') qs.set('category', currentCategory);

      const res = await fetch(`/api/admin/users/${userId}/activity?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to load activity');
      const data: ActivityResponse = await res.json();

      setEvents((prev) => (append ? [...prev, ...data.events] : data.events));
      setNextCursor(data.nextCursor);
    },
    [userId]
  );

  // Initial + category-change load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(null, category, false)
      .catch((e) => {
        if (!cancelled) setError(e.message ?? 'Failed to load activity');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchPage, category]);

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      await fetchPage(nextCursor, category, true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('admin.users.activity.activity.filterAll', 'All categories')}
            </SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`admin.users.activity.values.auditCategory.${c}`, c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{events.length}</span>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('admin.users.activity.activity.empty', 'No activity recorded for this user yet.')}
          </CardContent>
        </Card>
      ) : (
        <>
          <AuditEventsTable events={events} isAdmin t={t} />
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />}
                {t('admin.users.activity.activity.loadMore', 'Load more')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
