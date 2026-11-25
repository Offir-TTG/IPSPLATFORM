'use client';

/**
 * The drawer of one reminder: its numbers, its steps, the clients it is
 * running for now (each can be stopped), and the latest activity. The
 * reminder's actions are at the bottom.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { DrawerSection, DrawerShell, DrawerStat, drawerButton, drawerPrimary } from '@/components/admin/drawer-kit';
import { CATALOG_BY_KEY, offsetLabel } from '@/lib/messaging/catalog';
import type { Chaser } from '@/lib/messaging/store';
import { AreaTile, STATUS_DOT, areaLabel, dateTime, money, shortDate, useBi, useOutcomeWords, useReasonWords, useStatusWords } from './shared';

interface DrawerData {
  reminder: Chaser;
  stats: { sentMonth: number; paidAfter: number; running: number };
  running: { id: string; userId: string; name: string; sentSteps: number; nextAt: string | null; emailOff: boolean; product: string | null }[];
  activity: { id: string; name: string; title: string; outcome: string; reason: string | null; at: string; stepPosition: number | null }[];
}

export function ReminderDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const { t } = useAdminLanguage();
  const { lang, bi } = useBi();
  const { toast } = useToast();
  const statusWords = useStatusWords();
  const outcomes = useOutcomeWords();
  const reasons = useReasonWords();
  const [data, setData] = useState<DrawerData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/admin/reminders/${id}`, { cache: 'no-store' });
    if (res.ok) setData(await res.json());
  }, [id]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const call = async (key: string, url: string, init: RequestInit, done: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      toast({ title: done });
      return body;
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const r = data?.reminder;
  const ev = r ? CATALOG_BY_KEY[r.event_key] : undefined;
  const system = ev?.area === 'system';
  const isPayment = ev?.area === 'payments';

  const setStatus = async (status: Chaser['status']) => {
    if (!r) return;
    const ok = await call('status', `/api/admin/reminders/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, status === 'active' ? t('admin.reminders.drawer.turnedOn', 'The reminder is on') : t('admin.reminders.drawer.paused', 'The reminder is paused'));
    if (ok) {
      await load();
      onChanged();
    }
  };

  const remove = async () => {
    if (!r || !window.confirm(t('admin.reminders.drawer.confirmDelete', 'Delete this reminder? Messages already sent stay in the send log.'))) return;
    const ok = await call('delete', `/api/admin/reminders/${r.id}`, { method: 'DELETE' }, t('admin.reminders.drawer.deleted', 'The reminder was deleted'));
    if (ok) {
      onChanged();
      onClose();
    }
  };

  const duplicate = async () => {
    if (!r) return;
    const ok = await call('copy', `/api/admin/reminders/${r.id}/duplicate`, { method: 'POST' }, t('admin.reminders.drawer.copied', 'A copy was saved as a draft'));
    if (ok?.id) window.location.assign(`/admin/reminders/${ok.id}`);
  };

  const stopClient = async (runId: string) => {
    const ok = await call(`stop:${runId}`, `/api/admin/reminders/runs/${runId}/stop`, { method: 'POST' }, t('admin.reminders.drawer.stopped', 'Stopped for this client'));
    if (ok) await load();
  };

  return (
    <DrawerShell
      open={!!id}
      onClose={onClose}
      status={r ? `${areaLabel(ev, lang)} · ${statusWords[r.status]}` : '…'}
      statusDot={r ? STATUS_DOT[r.status] : 'bg-muted'}
      lead={ev ? <AreaTile area={ev.area} /> : <span />}
      title={r?.name ?? ''}
      subtitle={ev ? bi(ev.when) : undefined}
      description={t('admin.reminders.drawer.description', 'An automatic reminder: its steps, the clients it is running for, and recent activity.')}
      stats={
        <>
          <DrawerStat label={t('admin.reminders.drawer.sentMonth', 'Sent this month')} value={data ? String(data.stats.sentMonth) : '–'} />
          {isPayment ? (
            <DrawerStat label={t('admin.reminders.drawer.paidAfter', 'Paid after it')} value={data ? money(data.stats.paidAfter, null, lang) : '–'} small />
          ) : (
            <DrawerStat label={t('admin.reminders.drawer.steps', 'Steps')} value={r ? String(system ? 1 : r.steps.length) : '–'} />
          )}
          <DrawerStat label={t('admin.reminders.drawer.running', 'In progress now')} value={data ? String(data.stats.running) : '–'} />
        </>
      }
      footer={
        r && (
          <>
            {system ? (
              <Link href="/admin/emails/templates" className={drawerPrimary}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t('admin.reminders.drawer.editWording', 'Edit the wording')}
              </Link>
            ) : (
              <Link href={`/admin/reminders/${r.id}`} className={drawerPrimary}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t('admin.reminders.drawer.edit', 'Edit the reminder')}
              </Link>
            )}
            {!system && (
              <div className="grid grid-cols-3 gap-2">
                {r.status === 'active' ? (
                  <button type="button" className={drawerButton} disabled={!!busy} onClick={() => setStatus('off')}>
                    {busy === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" aria-hidden />}
                    {t('admin.reminders.drawer.pause', 'Pause')}
                  </button>
                ) : (
                  <button type="button" className={drawerButton} disabled={!!busy} onClick={() => setStatus('active')}>
                    {busy === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" aria-hidden />}
                    {t('admin.reminders.drawer.turnOn', 'Turn on')}
                  </button>
                )}
                <button type="button" className={drawerButton} disabled={!!busy || !!ev?.locked} onClick={duplicate}>
                  <Copy className="h-4 w-4" aria-hidden />
                  {t('admin.reminders.drawer.duplicate', 'Duplicate')}
                </button>
                <button
                  type="button"
                  className={`${drawerButton} text-red-700 dark:text-red-400`}
                  disabled={!!busy || r.is_system}
                  title={r.is_system ? t('admin.reminders.drawer.builtIn', "Built-in reminders can't be deleted. Pause it instead.") : undefined}
                  onClick={remove}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t('admin.reminders.drawer.delete', 'Delete')}
                </button>
              </div>
            )}
          </>
        )
      }
    >
      {!data ? (
        <div className="grid min-h-[200px] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {system ? (
            <DrawerSection title={t('admin.reminders.drawer.alwaysTitle', 'Always sent')}>
              <p className="px-3.5 py-3 text-sm text-muted-foreground">
                {t('admin.reminders.drawer.alwaysText', "The client asked for this message, so it's emailed even to clients who turned email off. Only the wording can be edited, in the email templates.")}
              </p>
            </DrawerSection>
          ) : (
            <DrawerSection
              title={t('admin.reminders.drawer.stepsTitle', 'Steps')}
              action={
                !ev?.locked && (
                  <Link href={`/admin/reminders/${data.reminder.id}?step=steps`} className="text-sm font-semibold text-primary hover:underline">
                    {t('admin.reminders.drawer.editSteps', 'Edit')}
                  </Link>
                )
              }
            >
              <ol className="m-0 divide-y divide-border p-0">
                {data.reminder.steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[12.5px] font-extrabold text-primary">{s.position}</span>
                    <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{s.title_he}</span>
                    <span className="shrink-0 text-muted-foreground">{offsetLabel(s.offset_minutes, lang)}</span>
                  </li>
                ))}
                {!data.reminder.steps.length && <li className="px-3.5 py-3 text-sm text-muted-foreground">{t('admin.reminders.drawer.noSteps', 'No messages yet.')}</li>}
              </ol>
            </DrawerSection>
          )}

          {!system && (
            <DrawerSection title={t('admin.reminders.drawer.runningTitle', 'In progress now')}>
              {data.running.length ? (
                <ul className="m-0 divide-y divide-border p-0">
                  {data.running.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                      <span className="min-w-0">
                        <strong>{c.name}</strong>
                        <span className="text-muted-foreground">
                          {' · '}
                          {c.sentSteps
                            ? t('admin.reminders.drawer.stepSent', 'step {n} sent').replace('{n}', String(c.sentSteps))
                            : t('admin.reminders.drawer.notYet', 'nothing sent yet')}
                          {c.nextAt && ` · ${t('admin.reminders.drawer.next', 'next on {date}').replace('{date}', shortDate(c.nextAt, lang))}`}
                          {c.emailOff && ` · ${t('admin.reminders.drawer.bellOnly', 'bell only (email off)')}`}
                        </span>
                      </span>
                      <button type="button" onClick={() => stopClient(c.id)} disabled={!!busy} className="min-h-9 rounded-lg border border-border px-3 text-[13px] font-semibold text-primary hover:bg-muted">
                        {busy === `stop:${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.reminders.drawer.stop', 'Stop')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3.5 py-3 text-sm text-muted-foreground">{t('admin.reminders.drawer.noneRunning', 'Nobody is in the middle of this reminder.')}</p>
              )}
            </DrawerSection>
          )}

          <DrawerSection
            title={t('admin.reminders.drawer.activity', 'Recent activity')}
            action={
              <Link href="/admin/communications/log" className="text-sm font-semibold text-primary hover:underline">
                {t('admin.reminders.drawer.fullLog', 'Send log')}
              </Link>
            }
          >
            {data.activity.length ? (
              <ul className="m-0 divide-y divide-border p-0">
                {data.activity.map((a) => {
                  const o = (outcomes as Record<string, { label: string }>)[a.outcome];
                  return (
                    <li key={a.id} className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-sm">
                      <span className="min-w-0">
                        <strong>{a.name}</strong>
                        {a.stepPosition ? ` · ${t('admin.reminders.drawer.stepN', 'step {n}').replace('{n}', String(a.stepPosition))}` : ''}
                        <span className="block text-[13px] text-muted-foreground">
                          {o?.label}
                          {a.reason ? ` · ${reasons(a.reason, ev?.category, lang)}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] text-muted-foreground">{dateTime(a.at, lang)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3.5 py-3 text-sm text-muted-foreground">{t('admin.reminders.drawer.noActivity', 'Nothing was sent yet.')}</p>
            )}
          </DrawerSection>
        </>
      )}
    </DrawerShell>
  );
}
