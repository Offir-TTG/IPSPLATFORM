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
import { supabase } from '@/lib/supabase/client';
import { useAdminLanguage } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';

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
  const { t } = useAdminLanguage();
  const [rows, setRows] = useState<CronRun[]>([]);
  const [settings, setSettings] = useState<Record<string, CronSetting>>({});
  const [savingCron, setSavingCron] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCron, setFilterCron] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
    field: 'enabled' | 'dry_run',
    value: boolean,
  ) => {
    setSavingCron(cronName);
    // Optimistic update so the switch animates instantly; rollback on error.
    const prev = settings[cronName];
    setSettings((s) => ({
      ...s,
      [cronName]: { ...(prev ?? { cron_name: cronName, enabled: true, dry_run: false, updated_at: '' }), [field]: value },
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
    let q = supabase
      .from('cron_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100);
    if (filterCron !== 'all') q = q.eq('cron_name', filterCron);
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data, error } = await q;
    if (error) {
      console.error('[Cron Monitor] fetch failed:', error);
      setRows([]);
    } else {
      setRows((data ?? []) as CronRun[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    loadSettings();
    const i = setInterval(() => {
      load();
      loadSettings();
    }, 10000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCron, filterStatus]);

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
      <div className="space-y-6 p-4 md:p-0">
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
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium">
            {t('admin.crons.filter', 'Filter')}:
          </label>
          <select
            value={filterCron}
            onChange={(e) => setFilterCron(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm bg-background"
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
            className="px-3 py-1.5 border rounded-md text-sm bg-background"
          >
            <option value="all">{t('admin.crons.allStatuses', 'All statuses')}</option>
            <option value="success">{t('admin.crons.status.success', 'Success')}</option>
            <option value="failed">{t('admin.crons.status.failed', 'Failed')}</option>
            <option value="running">{t('admin.crons.status.running', 'Running')}</option>
            <option value="skipped_dry_run">{t('admin.crons.status.dryRun', 'Dry-run')}</option>
            <option value="skipped_disabled">{t('admin.crons.status.disabled', 'Disabled')}</option>
          </select>
          <span className="text-xs text-muted-foreground ms-auto">
            {t('admin.crons.runCount', '{{count}} runs').replace(
              '{{count}}',
              String(rows.length),
            )}
          </span>
        </div>

        {/* Run table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-start">
                  <th className="px-4 py-2 font-medium text-start">
                    {t('admin.crons.col.when', 'When')}
                  </th>
                  <th className="px-4 py-2 font-medium text-start">
                    {t('admin.crons.col.cron', 'Cron')}
                  </th>
                  <th className="px-4 py-2 font-medium text-start">
                    {t('admin.crons.col.status', 'Status')}
                  </th>
                  <th className="px-4 py-2 font-medium text-start">
                    {t('admin.crons.col.duration', 'Duration')}
                  </th>
                  <th className="px-4 py-2 font-medium text-start">
                    {t('admin.crons.col.result', 'Result')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {t('admin.crons.loading', 'Loading…')}
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {t(
                        'admin.crons.empty',
                        'No runs yet. Crons will log here on their next tick after the cron_runs migration is applied and the new code is deployed.',
                      )}
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const StatusIcon = STATUS_ICON[r.status];
                  const isExpanded = expanded.has(r.id);
                  const summaryText = r.error_message
                    ? r.error_message
                    : r.summary
                      ? JSON.stringify(r.summary)
                      : '—';
                  return (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggle(r.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.started_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {r.cron_name}
                        {r.dry_run && (
                          <span className="ms-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
                            {t('admin.crons.status.dryRun', 'Dry-run').toLowerCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_TONE[r.status]}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs tabular-nums text-muted-foreground">
                        {r.duration_ms != null ? `${r.duration_ms} ms` : '—'}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {isExpanded ? (
                          <pre className="whitespace-pre-wrap break-all font-mono text-[11px] bg-muted/50 p-2 rounded max-w-2xl">
                            {summaryText}
                          </pre>
                        ) : (
                          <span
                            className={`block truncate max-w-md ${r.error_message ? 'text-red-600' : 'text-muted-foreground'}`}
                          >
                            {summaryText}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
