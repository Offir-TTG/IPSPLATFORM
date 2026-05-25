'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  PowerOff,
} from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';

/**
 * Cron monitor — surfaces the last N rows of public.cron_runs so an
 * accidental email-blast (or any other runaway) is visible the moment
 * it starts. Companion to the runCron() wrapper in src/lib/cron/.
 *
 * Client component: polls every 10s + relies on AdminLayout's
 * client-side auth bootstrap.
 */

type CronStatus =
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped_dry_run'
  | 'skipped_disabled';

type CronRun = {
  id: string;
  cron_name: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: CronStatus;
  summary: Record<string, unknown> | null;
  error_message: string | null;
  dry_run: boolean;
};

type CronSetting = {
  cron_name: string;
  enabled: boolean;
  dry_run: boolean;
  log_runs: boolean;
  updated_at: string;
};

const STATUS_TONE: Record<CronStatus, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  failed: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  running: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  skipped_dry_run: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
  skipped_disabled: 'bg-muted text-muted-foreground',
};

const STATUS_ICON: Record<CronStatus, typeof CheckCircle2> = {
  success: CheckCircle2,
  failed: XCircle,
  running: Clock,
  skipped_dry_run: AlertCircle,
  skipped_disabled: PowerOff,
};

const KNOWN_CRONS = [
  'lesson-reminders',
  'process-email-queue',
  'drain-outbox',
  'create-payment-invoices',
  'retry-failed-payments',
  'check-overdue-payments',
];

export default function AdminCronMonitorPage() {
  const { t, direction } = useAdminLanguage();
  const [rows, setRows] = useState<CronRun[]>([]);
  const [settings, setSettings] = useState<Record<string, CronSetting>>({});
  const [savingCron, setSavingCron] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCron, setFilterCron] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const isRtl = direction === 'rtl';

  const statusLabel = (s: CronStatus) => {
    switch (s) {
      case 'success':
        return t('admin.crons.status.success', 'Success');
      case 'failed':
        return t('admin.crons.status.failed', 'Failed');
      case 'running':
        return t('admin.crons.status.running', 'Running');
      case 'skipped_dry_run':
        return t('admin.crons.status.dryRun', 'Dry-run');
      case 'skipped_disabled':
        return t('admin.crons.status.disabled', 'Disabled');
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/cron-settings', { cache: 'no-store' });
      const j = await res.json();
      if (j.success) {
        const byName: Record<string, CronSetting> = {};
        for (const s of j.data as CronSetting[]) byName[s.cron_name] = s;
        setSettings(byName);
      }
    } catch (e) {
      console.error('[Cron Monitor] settings fetch failed:', e);
    }
  };

  const toggleSetting = async (
    cronName: string,
    field: 'enabled' | 'dry_run' | 'log_runs',
    value: boolean,
  ) => {
    setSavingCron(cronName);
    // Optimistic update so the switch animates instantly; rollback on error.
    const prev = settings[cronName];
    setSettings((s) => ({
      ...s,
      [cronName]: { ...(prev ?? { cron_name: cronName, enabled: true, dry_run: false, log_runs: true, updated_at: '' }), [field]: value },
    }));
    try {
      const res = await fetch('/api/admin/cron-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron_name: cronName, [field]: value }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'save failed');
      setSettings((s) => ({ ...s, [cronName]: j.data }));
    } catch (e) {
      console.error('[Cron Monitor] settings patch failed:', e);
      // Rollback
      if (prev) setSettings((s) => ({ ...s, [cronName]: prev }));
    } finally {
      setSavingCron(null);
    }
  };

  const load = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(pageSize));
      if (filterCron !== 'all') params.set('cron_name', filterCron);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/admin/cron-runs?${params.toString()}`, { cache: 'no-store' });
      const j = await res.json();
      if (j.success) {
        setRows(j.data as CronRun[]);
        setTotal(j.total ?? 0);
      } else {
        console.error('[Cron Monitor] fetch failed:', j.error);
        setRows([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('[Cron Monitor] fetch threw:', e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever filters change so we don't end up on
  // a page that no longer exists in the filtered set.
  useEffect(() => {
    setPage(1);
  }, [filterCron, filterStatus]);

  useEffect(() => {
    load();
    loadSettings();
    const i = setInterval(() => {
      load();
      loadSettings();
    }, 10000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCron, filterStatus, page]);

  // Latest tick per known cron so a stuck or failing one pops out before
  // the admin has to scan the row list.
  const healthByCron = KNOWN_CRONS.map((name) => {
    const latest = rows.find((r) => r.cron_name === name);
    return { name, latest };
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl p-4 md:p-6 space-y-6" dir={direction}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <Activity className="h-7 w-7 text-primary" />
              {t('admin.crons.title', 'Cron monitor')}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t(
                'admin.crons.subtitle',
                'Last 100 cron runs. Auto-refreshes every 10s. Failed or stuck crons appear first in the per-cron health row.',
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent transition-colors text-sm w-fit"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.crons.refresh', 'Refresh')}
          </button>
        </div>

        {/* Per-cron latest tick + toggles */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {healthByCron.map(({ name, latest }) => {
            const StatusIcon = latest ? STATUS_ICON[latest.status] : Clock;
            const toneClass = latest
              ? STATUS_TONE[latest.status]
              : 'bg-muted text-muted-foreground';
            const setting = settings[name];
            const isEnabled = setting?.enabled ?? true;
            const isDryRun = setting?.dry_run ?? false;
            const isLogRuns = setting?.log_runs ?? true;
            const isSaving = savingCron === name;
            return (
              <div
                key={name}
                className={`bg-card border rounded-lg p-4 transition-colors ${
                  !isEnabled ? 'opacity-70' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFilterCron(name)}
                  className="w-full text-start hover:opacity-90"
                  title={t('admin.crons.filterByCron', 'Filter run table by this cron')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold">{name}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${toneClass}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {latest
                        ? statusLabel(latest.status)
                        : t('admin.crons.noRunsYet', 'No runs yet')}
                    </span>
                  </div>
                  {latest && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>
                        {new Date(latest.started_at).toLocaleString()}
                        {latest.duration_ms != null && (
                          <span> · {latest.duration_ms} ms</span>
                        )}
                      </div>
                      {latest.error_message && (
                        <div className="text-red-600 truncate" title={latest.error_message}>
                          {latest.error_message}
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Toggle row — separate <div>, NOT inside the filter
                    button, so the Switch click doesn't bubble to it. */}
                <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium">
                      {isEnabled
                        ? t('admin.crons.toggle.enabled', 'Enabled')
                        : t('admin.crons.toggle.disabled', 'Disabled')}
                    </span>
                    <Switch
                      checked={isEnabled}
                      disabled={isSaving}
                      onCheckedChange={(v) => toggleSetting(name, 'enabled', v)}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-muted-foreground">
                      {t('admin.crons.toggle.dryRun', 'Dry-run mode')}
                    </span>
                    <Switch
                      checked={isDryRun}
                      disabled={isSaving || !isEnabled}
                      onCheckedChange={(v) => toggleSetting(name, 'dry_run', v)}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-muted-foreground">
                      {t('admin.crons.toggle.logRuns', 'Store run history')}
                    </span>
                    <Switch
                      checked={isLogRuns}
                      disabled={isSaving}
                      onCheckedChange={(v) => toggleSetting(name, 'log_runs', v)}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <label className="text-sm font-medium shrink-0">
            {t('admin.crons.filter', 'Filter')}:
          </label>
          <select
            value={filterCron}
            onChange={(e) => setFilterCron(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm bg-background min-w-0 flex-1 sm:flex-initial"
          >
            <option value="all">{t('admin.crons.allCrons', 'All crons')}</option>
            {KNOWN_CRONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm bg-background min-w-0 flex-1 sm:flex-initial"
          >
            <option value="all">{t('admin.crons.allStatuses', 'All statuses')}</option>
            <option value="success">{t('admin.crons.status.success', 'Success')}</option>
            <option value="failed">{t('admin.crons.status.failed', 'Failed')}</option>
            <option value="running">{t('admin.crons.status.running', 'Running')}</option>
            <option value="skipped_dry_run">{t('admin.crons.status.dryRun', 'Dry-run')}</option>
            <option value="skipped_disabled">{t('admin.crons.status.disabled', 'Disabled')}</option>
          </select>
        </div>

        {/* Run table — Card + ResponsiveTable like /admin/emails/queue.
            Desktop: real <Table> with a single expandable summary row
            per click. Mobile: stacked card per run with the same
            expand-on-tap behaviour. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.crons.runs', 'Runs')} ({total})
            </CardTitle>
            <CardDescription>
              {t('admin.crons.runsHint', 'Showing {{n}} of {{total}}. Tap a row to see the full summary.')
                .replace('{{n}}', String(rows.length))
                .replace('{{total}}', String(total))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && rows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {t('admin.crons.loading', 'Loading…')}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {t(
                  'admin.crons.empty',
                  'No runs yet. Crons will log here on their next tick after the cron_runs migration is applied and the new code is deployed.',
                )}
              </div>
            ) : (
              <ResponsiveTable>
                <ResponsiveTable.Desktop>
                  <div className="overflow-x-auto" dir={direction}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.crons.col.when', 'When')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.crons.col.cron', 'Cron')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.crons.col.status', 'Status')}
                          </TableHead>
                          <TableHead className={`tabular-nums ${isRtl ? 'text-right' : 'text-left'}`}>
                            {t('admin.crons.col.duration', 'Duration')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.crons.col.result', 'Result')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => {
                          const StatusIcon = STATUS_ICON[r.status];
                          const isExpanded = expanded.has(r.id);
                          const summaryText = r.error_message
                            ? r.error_message
                            : r.summary
                              ? JSON.stringify(r.summary, null, 2)
                              : '—';
                          return (
                            <TableRow
                              key={r.id}
                              className="cursor-pointer"
                              onClick={() => toggle(r.id)}
                            >
                              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                <div title={new Date(r.started_at).toLocaleString()}>
                                  {formatDistanceToNow(new Date(r.started_at), {
                                    addSuffix: true,
                                    locale: isRtl ? heLocale : undefined,
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="truncate">{r.cron_name}</span>
                                  {r.dry_run && (
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                      {t('admin.crons.status.dryRun', 'Dry-run').toLowerCase()}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`gap-1 ${STATUS_TONE[r.status]} border-transparent`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusLabel(r.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs tabular-nums text-muted-foreground">
                                {r.duration_ms != null ? `${r.duration_ms} ms` : '—'}
                              </TableCell>
                              <TableCell className="max-w-0 w-full">
                                {isExpanded ? (
                                  <pre
                                    className="whitespace-pre-wrap break-all font-mono text-[11px] bg-muted/50 p-2 rounded"
                                    dir="ltr"
                                  >
                                    {summaryText}
                                  </pre>
                                ) : (
                                  <span
                                    className={`block truncate text-xs ${r.error_message ? 'text-destructive' : 'text-muted-foreground'}`}
                                    dir="ltr"
                                  >
                                    {summaryText}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ResponsiveTable.Desktop>

                {/* Mobile: card per run. Compact header (cron + status),
                    relative time, duration chip, expandable summary. */}
                <ResponsiveTable.Mobile className="space-y-2" dir={direction}>
                  {rows.map((r) => {
                    const StatusIcon = STATUS_ICON[r.status];
                    const isExpanded = expanded.has(r.id);
                    const summaryText = r.error_message
                      ? r.error_message
                      : r.summary
                        ? JSON.stringify(r.summary, null, 2)
                        : '—';
                    return (
                      <div
                        key={r.id}
                        className="rounded-lg border p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggle(r.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium truncate">
                                {r.cron_name}
                              </span>
                              {r.dry_run && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {t('admin.crons.status.dryRun', 'Dry-run').toLowerCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(r.started_at), {
                                addSuffix: true,
                                locale: isRtl ? heLocale : undefined,
                              })}
                              {r.duration_ms != null && (
                                <span className="tabular-nums">{' · '}{r.duration_ms} ms</span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`gap-1 shrink-0 ${STATUS_TONE[r.status]} border-transparent`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusLabel(r.status)}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <pre
                            className="whitespace-pre-wrap break-all font-mono text-[11px] bg-muted/50 p-2 rounded max-h-64 overflow-auto"
                            dir="ltr"
                          >
                            {summaryText}
                          </pre>
                        ) : (
                          <p
                            className={`text-xs truncate ${r.error_message ? 'text-destructive' : 'text-muted-foreground'}`}
                            dir="ltr"
                          >
                            {summaryText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </ResponsiveTable.Mobile>
              </ResponsiveTable>
            )}

            {/* Pagination — mirrors /admin/emails/queue */}
            {total > pageSize && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('common.page', 'Page')} {page} {t('common.of', 'of')} {Math.max(1, Math.ceil(total / pageSize))}
                </div>
                <div className="flex gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    {t('common.previous', 'Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                    disabled={page >= Math.ceil(total / pageSize) || loading}
                  >
                    {t('common.next', 'Next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
