'use client';

/**
 * The drawer for editing one step of a reminder: when it goes out, how
 * (email, the bell is always on, a copy to the team), the subject and the
 * message with its details and button, and a preview with sample details.
 */

import { useEffect, useState } from 'react';
import { Bell, Loader2, Send, Trash2, X } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { WizardField } from '@/components/admin/wizard/StepWizard';
import { drawerButton, drawerPrimary } from '@/components/admin/drawer-kit';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { OFFSET_UNITS, type CatalogEvent } from '@/lib/messaging/catalog';
import { isBlankHtml } from '@/lib/messaging/html';
import type { StepInput } from '@/lib/messaging/admin';
import { MessageEditor } from './MessageEditor';
import { MessagePreview } from './MessagePreview';
import { categoryLabel, useBi } from './shared';

type Unit = 'minutes' | 'hours' | 'days';
type Mode = 'now' | 'after' | 'before';

function split(offset: number): { mode: Mode; amount: number; unit: Unit } {
  if (offset === 0) return { mode: 'now', amount: 1, unit: 'days' };
  const abs = Math.abs(offset);
  const mode: Mode = offset < 0 ? 'before' : 'after';
  if (abs % OFFSET_UNITS.DAY === 0) return { mode, amount: abs / OFFSET_UNITS.DAY, unit: 'days' };
  if (abs % OFFSET_UNITS.HOUR === 0) return { mode, amount: abs / OFFSET_UNITS.HOUR, unit: 'hours' };
  return { mode, amount: abs, unit: 'minutes' };
}

function join(mode: Mode, amount: number, unit: Unit): number {
  if (mode === 'now') return 0;
  const minutes = amount * (unit === 'days' ? OFFSET_UNITS.DAY : unit === 'hours' ? OFFSET_UNITS.HOUR : 1);
  return mode === 'before' ? -minutes : minutes;
}

export function StepEditor({
  open,
  ev,
  step,
  position,
  total,
  onSave,
  onDelete,
  onClose,
  onTest,
  testing,
}: {
  open: boolean;
  ev: CatalogEvent;
  step: StepInput | null;
  position: number;
  total: number;
  onSave: (s: StepInput) => void;
  onDelete: (() => void) | null;
  onClose: () => void;
  onTest: (s: StepInput) => void;
  testing: boolean;
}) {
  const { t, direction } = useAdminLanguage();
  const { lang, bi } = useBi();
  const [draft, setDraft] = useState<StepInput | null>(step);
  const [timing, setTiming] = useState(() => split(step?.offset_minutes ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(step);
    setTiming(split(step?.offset_minutes ?? 0));
    setErrors({});
  }, [step, open]);

  const modes: Mode[] = ev.timing === 'before' ? ['before', 'now'] : ['now', 'after'];
  const offset = join(timing.mode, timing.amount, timing.unit);

  const check = (): StepInput | null => {
    if (!draft) return null;
    const e: Record<string, string> = {};
    if (!draft.title_he.trim()) e.title = t('admin.reminders.step.subjectRequired', 'Write a subject.');
    if (isBlankHtml(draft.body_he)) e.body = t('admin.reminders.step.bodyRequired', 'Write the message.');
    if (timing.mode !== 'now' && (!Number.isFinite(timing.amount) || timing.amount < 1)) e.timing = t('admin.reminders.step.timingRequired', 'Choose how long.');
    setErrors(e);
    return Object.keys(e).length ? null : { ...draft, offset_minutes: offset };
  };

  const details = ev.placeholders.map((p) => ({ label: p.he, insert: `{${p.he}}` }));

  if (!draft) return null;
  const action = ev.actions.find((a) => a.key === draft.action_key);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side={direction === 'rtl' ? 'left' : 'right'} dir={direction} className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl sm:max-w-[560px] [&>[data-default-close]]:hidden">
        <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-4 pt-6">
          <p className="pe-10 text-[13.5px] font-semibold text-muted-foreground">
            {t('admin.reminders.step.ofTotal', 'Step {n} of {total}').replace('{n}', String(position)).replace('{total}', String(total))} · {bi(ev.name)}
          </p>
          <SheetTitle className="mt-1 pe-10 text-[22px] font-extrabold leading-tight [font-family:inherit] [overflow-wrap:anywhere]">
            {draft.title_he || t('admin.reminders.step.newStep', 'New step')}
          </SheetTitle>
          <SheetDescription className="sr-only">{t('admin.reminders.step.description', 'Edit when this message goes out and what it says.')}</SheetDescription>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="grid gap-2">
            <h3 className="text-sm font-bold">{t('admin.reminders.step.when', 'When')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className={joinedBar}>
                {modes.map((m) => (
                  <button key={m} type="button" aria-pressed={timing.mode === m} onClick={() => setTiming((x) => ({ ...x, mode: m }))} className={joinedSegment(timing.mode === m)}>
                    {m === 'now' ? (ev.timing === 'before' ? t('admin.reminders.step.atStart', 'At the time') : t('admin.reminders.step.now', 'Right away')) : m === 'after' ? t('admin.reminders.step.after', 'After') : t('admin.reminders.step.before', 'Before')}
                  </button>
                ))}
              </div>
              {timing.mode !== 'now' && (
                <>
                  <input
                    type="number"
                    min={1}
                    value={timing.amount}
                    onChange={(e) => setTiming((x) => ({ ...x, amount: Math.max(1, Math.round(Number(e.target.value) || 1)) }))}
                    aria-label={t('admin.reminders.step.amount', 'How long')}
                    className="h-11 w-20 rounded-lg border border-border bg-card px-2 text-center text-base tabular-nums focus:border-primary focus:outline-none"
                  />
                  <select
                    value={timing.unit}
                    onChange={(e) => setTiming((x) => ({ ...x, unit: e.target.value as Unit }))}
                    aria-label={t('admin.reminders.step.unit', 'Unit')}
                    className="h-11 rounded-lg border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="minutes">{t('admin.reminders.step.minutes', 'minutes')}</option>
                    <option value="hours">{t('admin.reminders.step.hours', 'hours')}</option>
                    <option value="days">{t('admin.reminders.step.days', 'days')}</option>
                  </select>
                </>
              )}
              <span className="text-sm text-muted-foreground">{bi(ev.anchor)}</span>
            </div>
            {errors.timing && <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errors.timing}</p>}
            <p className="text-[13px] text-muted-foreground">
              {ev.timeSensitive
                ? t('admin.reminders.step.timeSensitiveHint', "This message is tied to a time. If it would land in the client's quiet hours, it stays in the bell only instead of arriving late.")
                : t('admin.reminders.step.waitHint', "If it falls at night, on Shabbat or in the client's quiet hours, the message waits for the first allowed time.")}
            </p>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-bold">{t('admin.reminders.step.how', 'How')}</h3>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
                <input type="checkbox" className="sr-only" checked={draft.send_email} onChange={(e) => setDraft({ ...draft, send_email: e.target.checked })} />
                {t('admin.reminders.channel.email', 'Email')}
              </label>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 text-sm font-medium text-primary">
                <Bell className="h-4 w-4" aria-hidden />
                {t('admin.reminders.channel.bellAlways', 'Portal bell · always')}
              </span>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
                <input type="checkbox" className="sr-only" checked={draft.admin_copy} onChange={(e) => setDraft({ ...draft, admin_copy: e.target.checked })} />
                {t('admin.reminders.channel.adminCopy', 'Copy to the team')}
              </label>
            </div>
            <p className="text-[13px] text-muted-foreground">
              {t(
                'admin.reminders.step.prefsHint',
                "By what each client chose in the portal: clients who turned off email for '{category}' get the bell only, and clients who chose one email a day get it in the summary.",
              ).replace('{category}', categoryLabel(ev.category, lang))}
            </p>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-bold">{t('admin.reminders.step.message', 'Message')}</h3>
            <WizardField label={t('admin.reminders.step.subject', 'Subject')} required error={errors.title} htmlFor="step-subject">
              <input
                id="step-subject"
                dir="rtl"
                value={draft.title_he}
                onChange={(e) => {
                  setDraft({ ...draft, title_he: e.target.value });
                  setErrors((x) => ({ ...x, title: '' }));
                }}
                className={`h-11 rounded-lg border bg-card px-3 text-base focus:outline-none ${errors.title ? 'border-red-500' : 'border-border focus:border-primary'}`}
              />
            </WizardField>
            <div className="grid gap-1.5">
              <span className="text-sm font-semibold">
                {t('admin.reminders.step.body', 'The message')} <span className="text-red-600">*</span>
              </span>
              <MessageEditor
                value={draft.body_he}
                onChange={(html) => {
                  setDraft((d) => (d ? { ...d, body_he: html } : d));
                  setErrors((x) => ({ ...x, body: '' }));
                }}
                details={details}
                invalid={!!errors.body}
              />
              {errors.body && <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errors.body}</p>}
            </div>
            {ev.actions.length > 0 && (
              <div className="grid gap-1.5">
                <span className="text-sm font-semibold">{t('admin.reminders.step.button', 'Button at the end')}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    aria-pressed={!draft.action_key}
                    onClick={() => setDraft({ ...draft, action_key: null })}
                    className={`inline-flex min-h-9 items-center rounded-full border px-3 text-[13px] font-semibold ${!draft.action_key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                  >
                    {t('admin.reminders.step.noButton', 'No button')}
                  </button>
                  {ev.actions.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      aria-pressed={draft.action_key === a.key}
                      onClick={() => setDraft({ ...draft, action_key: a.key })}
                      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-[13px] font-semibold ${draft.action_key === a.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                    >
                      {a.he}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <h3 className="text-sm font-bold">{t('admin.reminders.preview.title', 'How the client sees it')}</h3>
              <MessagePreview ev={ev} step={{ ...draft, offset_minutes: offset }} height={460} />
            </div>
          </section>
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          <button
            type="button"
            className={drawerPrimary}
            onClick={() => {
              const s = check();
              if (s) onSave(s);
            }}
          >
            {t('admin.reminders.step.save', 'Save the step')}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={drawerButton}
              disabled={testing}
              onClick={() => {
                const s = check();
                if (s) onTest(s);
              }}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden />}
              {t('admin.reminders.step.test', 'Send a test to me')}
            </button>
            <button type="button" className={`${drawerButton} text-red-700 dark:text-red-400`} disabled={!onDelete} onClick={() => onDelete?.()}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('admin.reminders.step.delete', 'Delete the step')}
            </button>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
