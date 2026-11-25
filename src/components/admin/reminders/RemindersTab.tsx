'use client';

/**
 * The first tab: every reminder, grouped by area, each group showing which
 * of the client's settings it falls under. A row opens the drawer.
 */

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Bell, Mail, SearchX, WifiOff, Zap } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { KpiItem, KpiStrip, ListPanel, ListRow, ListSearch, ListSkeleton, ListState, QuickPills, kitButton } from '@/components/admin/notifications/kit';
import { AREA_LABEL, AREA_ORDER, AREA_PILL, CATALOG_BY_KEY, type Area } from '@/lib/messaging/catalog';
import type { ReminderRow } from '@/lib/messaging/admin';
import { AlwaysBadge, AreaTile, NewBadge, PrefChip, STATUS_DOT, categoryLabel, stepsLine, useBi, useStatusWords } from './shared';
import { ReminderDrawer } from './ReminderDrawer';

export interface ListData {
  reminders: ReminderRow[];
  kpis: { active: number; sentMonth: number; bellOnlyMonth: number; attention: number };
}

const COLUMNS = '40px minmax(0,1fr) 72px 200px 104px';

export function RemindersTab({ data, error, reload, openId }: { data: ListData | null; error: string | null; reload: () => void; openId: string | null }) {
  const { t } = useAdminLanguage();
  const { lang, bi, rtl } = useBi();
  const statusWords = useStatusWords();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<'all' | Area>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'off'>('all');
  const [open, setOpen] = useState<string | null>(openId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.reminders ?? []).filter((r) => {
      const ev = CATALOG_BY_KEY[r.event_key];
      if (area !== 'all' && ev?.area !== area) return false;
      if (status === 'active' && r.status !== 'active') return false;
      if (status === 'off' && r.status === 'active') return false;
      if (q && !`${r.name} ${ev ? bi(ev.when) : ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, query, area, status, bi]);

  const groups = AREA_ORDER.map((a) => ({ area: a, rows: filtered.filter((r) => CATALOG_BY_KEY[r.event_key]?.area === a) })).filter((g) => g.rows.length);

  const reach = (r: ReminderRow) => {
    const parts: string[] = [];
    if (r.month.email) parts.push(t('admin.reminders.reach.email', '{n} email').replace('{n}', r.month.email.toLocaleString()));
    if (r.month.bellOnly) parts.push(t('admin.reminders.reach.bellOnly', '{n} bell only').replace('{n}', r.month.bellOnly.toLocaleString()));
    if (r.month.digest) parts.push(t('admin.reminders.reach.digest', '{n} in the summary').replace('{n}', r.month.digest.toLocaleString()));
    if (r.month.waiting) parts.push(t('admin.reminders.reach.waiting', '{n} waiting').replace('{n}', r.month.waiting.toLocaleString()));
    if (r.month.failed) parts.push(t('admin.reminders.reach.failed', "{n} didn't arrive").replace('{n}', r.month.failed.toLocaleString()));
    return parts.join(' · ') || '—';
  };

  const groupChip = (a: Area) => {
    if (a === 'team') return <PrefChip muted>{t('admin.reminders.group.team', 'Sent to every admin')}</PrefChip>;
    if (a === 'system') return <PrefChip muted>{t('admin.reminders.group.system', 'Always sent, because the client asked for them · only the wording can be edited')}</PrefChip>;
    const cats = [...new Set(groups.find((g) => g.area === a)?.rows.map((r) => CATALOG_BY_KEY[r.event_key]?.category).filter(Boolean))];
    return <PrefChip>{t('admin.reminders.group.client', "Client's setting: {list}").replace('{list}', cats.map((c) => categoryLabel(c, lang)).join(' · '))}</PrefChip>;
  };

  const state = error ? (
    <ListState
      icon={WifiOff}
      tone="red"
      title={error === 'needs_migration' ? t('admin.reminders.needsMigration', 'Automatic reminders are almost ready') : t('admin.reminders.loadError', "Couldn't load the reminders")}
      text={error === 'needs_migration' ? t('admin.reminders.needsMigrationText', 'One database update still needs to run. Until then, messages keep going out as before.') : error}
      action={
        <button type="button" onClick={reload} className={kitButton.secondary}>
          {t('admin.reminders.retry', 'Try again')}
        </button>
      }
    />
  ) : !data ? (
    <ListSkeleton rows={6} />
  ) : !filtered.length ? (
    <ListState icon={SearchX} tone="grey" title={t('admin.reminders.noResults', 'No reminders match')} />
  ) : undefined;

  return (
    <>
      <KpiStrip label={t('admin.reminders.numbers', 'Numbers')}>
        <KpiItem icon={<Zap />} label={t('admin.reminders.kpi.active', 'Reminders on')} value={String(data?.kpis.active ?? '–')} onClick={() => setStatus(status === 'active' ? 'all' : 'active')} active={status === 'active'} />
        <KpiItem icon={<Mail />} tone="blue" label={t('admin.reminders.kpi.sent', 'Sent this month')} value={data ? data.kpis.sentMonth.toLocaleString() : '–'} />
        <KpiItem icon={<Bell />} tone="grey" label={t('admin.reminders.kpi.bellOnly', "Bell only, by the client's choice")} value={data ? data.kpis.bellOnlyMonth.toLocaleString() : '–'} />
        <KpiItem
          icon={<AlertTriangle />}
          tone="amber"
          label={t('admin.reminders.kpi.attention', 'Clients who need attention')}
          value={String(data?.kpis.attention ?? '–')}
          onClick={() => window.location.assign('/admin/communications/attention')}
        />
      </KpiStrip>

      <ListPanel
        label={t('admin.reminders.listLabel', 'Reminders')}
        toolbar={<ListSearch value={query} onChange={setQuery} placeholder={t('admin.reminders.search', 'Search reminders')} clearLabel={t('admin.reminders.clearSearch', 'Clear search')} />}
        pills={
          <>
            <QuickPills
              label={t('admin.reminders.areaFilter', 'Area')}
              value={area}
              onChange={setArea}
              options={[{ value: 'all' as const, label: t('admin.reminders.all', 'All') }, ...AREA_ORDER.map((a) => ({ value: a, label: bi(AREA_PILL[a]) }))]}
            />
            <QuickPills
              label={t('admin.reminders.statusFilter', 'Status')}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all' as const, label: t('admin.reminders.allStatuses', 'Any status') },
                { value: 'active' as const, label: t('admin.reminders.onOnly', 'On') },
                { value: 'off' as const, label: t('admin.reminders.offOnly', 'Off') },
              ]}
            />
          </>
        }
        columns={COLUMNS}
        head={['', t('admin.reminders.col.reminder', 'Reminder · when it goes out'), t('admin.reminders.col.steps', 'Steps'), t('admin.reminders.col.reach', 'How it reached people this month'), t('admin.reminders.col.status', 'Status')]}
        state={state}
        footer={
          data && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13.5px] text-muted-foreground">
              <span>
                {t('admin.reminders.showing', 'Showing {n} of {total} · pressing a row opens the reminder').replace('{n}', String(filtered.length)).replace('{total}', String(data.reminders.length))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <NewBadge /> {t('admin.reminders.newMeans', "= wasn't sent before, ready to turn on")}
              </span>
            </div>
          )
        }
      >
        {groups.map((g) => (
          <div key={g.area}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-5 py-3">
              <span className="flex items-center gap-2 text-[15px] font-extrabold">
                {bi(AREA_LABEL[g.area])} <span className="text-[13px] font-medium text-muted-foreground">{g.rows.length}</span>
              </span>
              {groupChip(g.area)}
            </div>
            {g.rows.map((r) => {
              const ev = CATALOG_BY_KEY[r.event_key];
              const system = ev?.area === 'system';
              return (
                <ListRow key={r.id} columns={COLUMNS} onOpen={() => setOpen(r.id)} label={r.name} selected={open === r.id} rtl={rtl}>
                  {ev ? <AreaTile area={ev.area} /> : <span />}
                  <div className="min-w-0 pe-10 md:pe-0">
                    <div className="flex flex-wrap items-center gap-2 font-bold">
                      <bdi>{r.name}</bdi>
                      {system ? <AlwaysBadge /> : r.isNew && <NewBadge />}
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {[r.steps.length ? stepsLine(r.steps, lang) : null, ev ? bi(ev.when) : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    <span className="me-1.5 font-normal text-muted-foreground md:hidden">{t('admin.reminders.col.steps', 'Steps')}:</span>
                    {system ? 1 : r.steps.length}
                  </div>
                  <div className="text-sm font-semibold">{reach(r)}</div>
                  {system ? (
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT.active}`} aria-hidden />
                      {statusWords.active}
                    </div>
                  ) : (
                    <StatusSwitch row={r} label={statusWords[r.status]} onChanged={reload} />
                  )}
                </ListRow>
              );
            })}
          </div>
        ))}
      </ListPanel>

      <ReminderDrawer id={open} onClose={() => setOpen(null)} onChanged={reload} />
    </>
  );
}

/**
 * Turns a reminder on or off right from the list. Sits above the row's own
 * button, so pressing it doesn't open the drawer. Turning one on asks first:
 * from that moment it starts going out to clients.
 */
function StatusSwitch({ row, label, onChanged }: { row: ReminderRow; label: string; onChanged: () => void }) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const on = row.status === 'active';

  const toggle = async () => {
    const next = on ? 'off' : 'active';
    if (next === 'active' && !window.confirm(t('admin.reminders.switch.confirmOn', 'Turn on "{name}"? From now on, every new case starts it.').replace('{name}', row.name))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reminders/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      toast({ title: next === 'active' ? t('admin.reminders.drawer.turnedOn', 'The reminder is on') : t('admin.reminders.switch.off', 'The reminder is off') });
      onChanged();
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${row.name}: ${on ? t('admin.reminders.switch.turnOff', 'Turn off') : t('admin.reminders.switch.turnOn', 'Turn on')}`}
      disabled={busy}
      onClick={toggle}
      className={`relative z-10 inline-flex min-h-9 items-center gap-2 justify-self-start rounded-full border px-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
        on ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
      }`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <span className={`relative inline-block h-4 w-7 rounded-full transition-colors ${on ? 'bg-green-600' : 'bg-muted-foreground/30'}`} aria-hidden>
          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${on ? 'end-0.5' : 'start-0.5'}`} />
        </span>
      )}
      {label}
    </button>
  );
}
