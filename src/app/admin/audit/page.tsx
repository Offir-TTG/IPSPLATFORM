'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserAuditTable } from '@/components/admin/users/activity/UserAuditTable';
import { TabPagination } from '@/components/admin/users/activity/TabPagination';
import { AuditFilters, FilterState } from '@/components/audit/AuditFilters';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const { t, direction } = useAdminLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [totalCount, setTotalCount] = useState(0);
  // 1-indexed to match TabPagination. The API uses offset/limit so we
  // convert at fetch time.
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    totalEvents: 0,
    highRiskEvents: 0,
    failedEvents: 0,
    todayEvents: 0,
  });

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [filters, page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });

      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.eventTypes) params.append('event_types', filters.eventTypes.join(','));
      if (filters.eventCategories) params.append('event_categories', filters.eventCategories.join(','));
      if (filters.resourceTypes) params.append('resource_types', filters.resourceTypes.join(','));
      if (filters.riskLevels) params.append('risk_levels', filters.riskLevels.join(','));
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load audit events');
      }

      setEvents(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err: any) {
      console.error('Load events error:', err);
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [totalRes, highRiskRes, failedRes, todayRes] = await Promise.all([
        fetch('/api/audit/events?limit=1'),
        fetch(`/api/audit/events?risk_levels=high,critical&limit=1`),
        fetch(`/api/audit/events?status=failure&limit=1`),
        fetch(`/api/audit/events?date_from=${yesterday.toISOString()}&limit=1`),
      ]);

      const [total, highRisk, failed, today] = await Promise.all([
        totalRes.json(),
        highRiskRes.json(),
        failedRes.json(),
        todayRes.json(),
      ]);

      setStats({
        totalEvents: total.count || 0,
        highRiskEvents: highRisk.count || 0,
        failedEvents: failed.count || 0,
        todayEvents: today.count || 0,
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6" dir={direction}>
        {/* Header — matches the user activity page heading style:
            primary-tinted icon, h1 + muted subtitle. */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            {t('admin.audit.title', 'Audit Trail')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('admin.audit.subtitle', 'Monitor all system activities and compliance events')}
          </p>
        </div>

        {/* Stats Cards — Shadcn Card layout, same visual rhythm as the
            count chips on each user activity tab. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            value={stats.totalEvents}
            label={t('admin.audit.stats.total', 'Total Events')}
          />
          <StatCard
            value={stats.highRiskEvents}
            label={t('admin.audit.stats.highRisk', 'High Risk')}
            tone="destructive"
          />
          <StatCard
            value={stats.failedEvents}
            label={t('admin.audit.stats.failed', 'Failed Actions')}
            tone="destructive"
          />
          <StatCard
            value={stats.todayEvents}
            label={t('admin.audit.stats.today', 'Last 24 Hours')}
            tone="primary"
          />
        </div>

        {/* Filters */}
        <AuditFilters onFilterChange={handleFilterChange} isAdmin={true} t={t} />

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="py-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Events Table — wrapped in the same Card+Header pattern as
            UserActivityTab so the audit page matches the rest of the
            admin shell visually. */}
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.audit.table.noEvents', 'No audit events found')}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                  <span>{t('admin.audit.title', 'Audit Trail')}</span>
                  <span className="text-sm text-muted-foreground font-normal tabular-nums">
                    {t('admin.users.activity.activity.count', '{{count}} events').replace(
                      '{{count}}',
                      String(totalCount),
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <UserAuditTable events={events} />
              </CardContent>
            </Card>

            <TabPagination
              page={page}
              total={totalCount}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              loading={loading}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

/**
 * Stat tile matching the look of the count chips on the user activity
 * tabs — Shadcn Card, large tabular number on top, muted label below.
 * `tone` swaps the number color to primary or destructive when the
 * metric is a positive/risk signal.
 */
function StatCard({
  value,
  label,
  tone = 'default',
}: {
  value: number;
  label: string;
  tone?: 'default' | 'primary' | 'destructive';
}) {
  const valueClass =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'primary'
        ? 'text-primary'
        : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
