'use client';

/**
 * Sending settings: the school's sending hours and Shabbat rule, the daily
 * summary time, how the client's settings apply (with how many clients
 * turned email off for each kind), and who gets team alerts (every admin).
 * Saved with the floating save bar, like every editor.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { SaveBar, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { WizardField } from '@/components/admin/wizard/StepWizard';
import { CATALOG_BY_KEY } from '@/lib/messaging/catalog';
import { CLIENT_CATEGORIES } from '@/lib/messaging/categories';
import type { ReminderRow } from '@/lib/messaging/admin';
import { categoryLabel, useBi } from './shared';

interface Settings {
  send_from: string;
  send_until: string;
  skip_shabbat: boolean;
  digest_time: string;
}

interface Loaded {
  settings: Settings;
  audience: { clients: number; emailOff: Record<string, number>; digest: number; quiet: number };
  admins: number;
}

const card = 'rounded-2xl border border-border bg-card p-5 shadow-sm';
const input = 'h-11 w-28 rounded-lg border border-border bg-card px-3 text-center text-base tabular-nums focus:border-primary focus:outline-none';

export function SettingsTab({ reminders }: { reminders: ReminderRow[] }) {
  const { t } = useAdminLanguage();
  const { lang } = useBi();
  const { toast } = useToast();
  const words = saveBarText(t);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reminders/settings', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setLoaded(body);
      setForm(body.settings);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !!loaded && !!form && JSON.stringify(form) !== JSON.stringify(loaded.settings);
  const { dialog } = useLeaveGuard(dirty, words.leave);

  const set = (patch: Partial<Settings>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setErrors({});
  };

  const save = async () => {
    if (!form) return;
    const e: Record<string, string> = {};
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!time.test(form.send_from)) e.send_from = t('admin.reminders.settings.timeError', 'Use a time like 09:00.');
    if (!time.test(form.send_until)) e.send_until = t('admin.reminders.settings.timeError', 'Use a time like 09:00.');
    if (!e.send_from && !e.send_until && form.send_from >= form.send_until) e.send_until = t('admin.reminders.settings.orderError', 'The end must be after the start.');
    if (!time.test(form.digest_time)) e.digest_time = t('admin.reminders.settings.timeError', 'Use a time like 09:00.');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reminders/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.field) setErrors({ [body.field]: body.error });
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setLoaded((l) => (l ? { ...l, settings: form } : l));
      toast({ title: t('admin.reminders.settings.saved', 'Sending settings saved') });
    } catch (err) {
      toast({ title: t('common.error', 'Error'), description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Which reminders fall under each of the client's settings.
  const byCategory = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of reminders) {
      const ev = CATALOG_BY_KEY[r.event_key];
      if (!ev || ev.category === 'system') continue;
      m.set(ev.category, [...(m.get(ev.category) ?? []), r.name]);
    }
    return m;
  }, [reminders]);

  if (loadError) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{loadError}</p>;
  if (!loaded || !form) {
    return (
      <div className="grid min-h-[240px] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rules = [
    [t('admin.reminders.settings.rule1Title', 'The portal bell always gets it.'), t('admin.reminders.settings.rule1', 'Every reminder shows in the bell, whatever the settings.')],
    [t('admin.reminders.settings.rule2Title', 'Email only to clients who left that kind on.'), t('admin.reminders.settings.rule2', 'Clients who turned it off get the bell only.')],
    [
      t('admin.reminders.settings.rule3Title', 'Quiet hours:'),
      t('admin.reminders.settings.rule3', "the email waits for them to end. A message tied to a time, like 30 minutes before a meeting, isn't sent late. It stays in the bell only."),
    ],
    [
      t('admin.reminders.settings.rule4Title', 'One email a day:'),
      t('admin.reminders.settings.rule4', "the reminder goes into the day's summary instead of its own email. A message tied to a time doesn't wait for the summary either."),
    ],
    [t('admin.reminders.settings.rule5Title', 'System messages are always sent:'), t('admin.reminders.settings.rule5', 'portal invitation, enrollment link and password reset, because the client asked for them.')],
    [t('admin.reminders.settings.rule6Title', 'Team alerts'), t('admin.reminders.settings.rule6', 'go to every admin, not to clients.')],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.reminders.settings.hoursTitle', 'Sending hours')}</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{t('admin.reminders.settings.hoursHint', 'The default for every reminder. Each reminder can change it.')}</p>
          <div className="flex flex-wrap items-start gap-3">
            <WizardField label={t('admin.reminders.settings.from', 'From')} error={errors.send_from} htmlFor="send-from">
              <input id="send-from" type="time" className={input} value={form.send_from} onChange={(e) => set({ send_from: e.target.value })} />
            </WizardField>
            <WizardField label={t('admin.reminders.settings.until', 'Until')} error={errors.send_until} htmlFor="send-until">
              <input id="send-until" type="time" className={input} value={form.send_until} onChange={(e) => set({ send_until: e.target.value })} />
            </WizardField>
          </div>
          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={form.skip_shabbat} onChange={(e) => set({ skip_shabbat: e.target.checked })} />
            {t('admin.reminders.settings.shabbat', 'No sending on Shabbat and holidays')}
          </label>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t('admin.reminders.settings.zoneNote', "By the school's time zone. A client's quiet hours are checked by the client's own time zone.")}
          </p>
        </section>

        <section className={card}>
          <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.reminders.settings.digestTitle', 'The daily summary')}</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {t('admin.reminders.settings.digestHint', 'For clients who chose "one email a day": all of the day\'s updates in one email.')}
          </p>
          <WizardField label={t('admin.reminders.settings.digestAt', 'Sent every day at')} error={errors.digest_time} htmlFor="digest-time">
            <input id="digest-time" type="time" className={input} value={form.digest_time} onChange={(e) => set({ digest_time: e.target.value })} />
          </WizardField>
          <p className="mt-3 text-sm">
            {t('admin.reminders.settings.digestCount', '{n} clients chose the summary.').replace('{n}', String(loaded.audience.digest))}
          </p>
        </section>
      </div>

      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.reminders.settings.rulesTitle', "How the client's settings work")}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          {t('admin.reminders.settings.rulesHint', "Each client chooses in the portal what reaches them by email. This is how it applies to reminders. The client's choice can't be changed from here.")}
        </p>
        <ol className="m-0 grid list-none gap-x-7 p-0 md:grid-cols-2">
          {rules.map(([title, text], i) => (
            <li key={i} className="flex items-start gap-3 py-2 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[12.5px] font-extrabold text-primary">{i + 1}</span>
              <span>
                <strong>{title}</strong> {text}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[180px_minmax(0,1fr)_120px] gap-4 bg-muted/40 px-4 py-2.5 text-[13px] font-semibold text-muted-foreground md:grid">
            <span>{t('admin.reminders.settings.colClient', "Client's setting")}</span>
            <span>{t('admin.reminders.settings.colReminders', 'Which reminders')}</span>
            <span>{t('admin.reminders.settings.colOff', 'Turned email off')}</span>
          </div>
          {CLIENT_CATEGORIES.map((c) => (
            <div key={c} className="grid gap-1 border-t border-border px-4 py-3 text-sm md:grid-cols-[180px_minmax(0,1fr)_120px] md:gap-4">
              <strong>{categoryLabel(c, lang)}</strong>
              <span className="text-muted-foreground">
                {c === 'announcement' ? t('admin.reminders.settings.announcementRow', "Messages sent from 'Notifications'") : (byCategory.get(c) ?? []).join(', ') || '—'}
              </span>
              <span>
                <span className="me-1.5 text-muted-foreground md:hidden">{t('admin.reminders.settings.colOff', 'Turned email off')}:</span>
                {loaded.audience.emailOff[c] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.reminders.settings.teamTitle', 'Who gets team alerts')}</h2>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          {t('admin.reminders.settings.teamHint', 'Refunds, charge disputes and contracts go to every user with the admin role. A new admin gets them automatically.')}
        </p>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4 text-primary" aria-hidden />
          {t('admin.reminders.settings.allAdmins', 'Every admin · {n} users').replace('{n}', String(loaded.admins))}
        </p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{t('admin.reminders.settings.teamNote', "Nothing to set. To change who gets them, change the user's role in Users.")}</p>
      </section>

      <SaveBar isNew={false} dirty={dirty} saving={saving} onSave={save} onDiscard={() => setForm(loaded.settings)} saveLabel={t('admin.saveBar.save', 'Save')} text={words.bar} />
      {dialog}
    </div>
  );
}
