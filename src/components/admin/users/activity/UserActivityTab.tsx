'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabPagination } from './TabPagination';
import { UserAuditTable } from './UserAuditTable';

interface UserActivityTabProps {
  userId: string;
}

type ActivityResponse = { events: AuditEvent[]; total: number };

const CATEGORIES = [
  'DATA', 'AUTH', 'ADMIN', 'CONFIG', 'SECURITY', 'COMPLIANCE',
  'SYSTEM', 'EDUCATION', 'STUDENT_RECORD', 'GRADE', 'ATTENDANCE',
  'PARENTAL_ACCESS',
] as const;

const PAGE_SIZE = 20;

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const { t, direction } = useAdminLanguage();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (currentPage: number, currentCategory: string) => {
      const qs = new URLSearchParams({
        page: String(currentPage),
        per_page: String(PAGE_SIZE),
      });
      if (currentCategory && currentCategory !== 'all') qs.set('category', currentCategory);

      const res = await fetch(`/api/admin/users/${userId}/activity?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load activity');
      const data: ActivityResponse = await res.json();
      setEvents(data.events);
      setTotal(data.total);
    },
    [userId]
  );

  useEffect(() => { setPage(1); }, [category]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(page, category)
      .catch((e) => { if (!cancelled) setError(e.message ?? 'Failed to load activity'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchPage, category, page]);

  if (loading && events.length === 0) {
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
    <div className="space-y-4" dir={direction}>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[220px]">
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
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('admin.users.activity.activity.empty', 'No activity recorded for this user yet.')}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                <span>{t('admin.users.activity.activity.title', 'Activity')}</span>
                <span className="text-sm text-muted-foreground font-normal tabular-nums">
                  {t('admin.users.activity.activity.count', '{{count}} events').replace('{{count}}', String(total))}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <UserAuditTable events={events} />
            </CardContent>
          </Card>

          <TabPagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
