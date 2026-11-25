'use client';

/**
 * Creating and editing an automatic reminder, in four steps:
 *   1 What starts it   a catalogue of every event, by area
 *   2 Who and stops    name, products, who gets it, channels, stop conditions, hours
 *   3 The steps        the timeline: messages and what the system does by itself
 *   4 Review           everything in one place, open cases, turn it on
 * Continue stops on a missing field, with the reason in red beside it.
 * Saving is the floating save bar; Delete and Pause sit at the top.
 */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Info, Loader2, Lock, Pause, Play, Plus, Search, Send, Settings2, Trash2, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { ChoiceCard, QuickPills, SaveBar, SummaryRow, joinedBar, joinedSegment, kitButton, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { StepWizard, WizardField, useStepWizard } from '@/components/admin/wizard/StepWizard';
import { AREA_LABEL, AREA_ORDER, AREA_PILL, CATALOG, CATALOG_BY_KEY, TIMING_LABEL, offsetLabel, type Area, type CatalogEvent } from '@/lib/messaging/catalog';
import { htmlToText } from '@/lib/messaging/html';
import type { ReminderInput, StepInput } from '@/lib/messaging/admin';
import { StepEditor } from './StepEditor';
import { MessagePreview } from './MessagePreview';
import { AreaTile, PrefChip, STATUS_DOT, categoryLabel, useBi, useStatusWords } from './shared';

const STEPS = ['trigger', 'who', 'steps', 'review'] as const;
type Step = (typeof STEPS)[number];

interface Audience {
  clients: number;
  emailOff: Record<string, number>;
  digest: number;
  quiet: number;
  existing: { count: number; names: string[] };
}

function fromCatalog(ev: CatalogEvent): ReminderInput {
  return {
    event_key: ev.key,
    name: ev.name.he,
    status: 'draft',
    applies_to: 'new',
    admin_copy: false,
    stop_on: ev.stops.map((s) => s.key),
    product_ids: null,
    send_from: null,
    send_until: null,
    skip_shabbat: null,
    steps: ev.steps.map((s) => ({
      offset_minutes: s.offset,
      send_email: s.sendEmail ?? true,
      admin_copy: s.adminCopy ?? false,
      action_key: s.action ?? null,
      title_he: s.title.he,
      body_he: s.body.he,
    })),
  };
}

const EMPTY: ReminderInput = {
  event_key: '',
  name: '',
  status: 'draft',
  applies_to: 'new',
  admin_copy: false,
  stop_on: [],
  product_ids: null,
  send_from: null,
  send_until: null,
  skip_shabbat: null,
  steps: [],
};

const inputCls = (bad?: boolean) => `h-11 rounded-lg border bg-card px-3 text-base focus:outline-none ${bad ? 'border-red-500' : 'border-border focus:border-primary'}`;

export function ReminderWizard({ id }: { id: string | null }) {
  const { t, direction } = useAdminLanguage();
  const { lang, bi, rtl } = useBi();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const statusWords = useStatusWords();
  const words = saveBarText(t);

  const [form, setForm] = useState<ReminderInput>(EMPTY);
  const [saved, setSaved] = useState<ReminderInput | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activate, setActivate] = useState(true);
  const [aud, setAud] = useState<Audience | null>(null);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [someProducts, setSomeProducts] = useState(false);
  const [isSystem, setIsSystem] = useState(false);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [areaFilter, setAreaFilter] = useState<'all' | Area>('all');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [previewAt, setPreviewAt] = useState(0);

  const ev = CATALOG_BY_KEY[form.event_key];
  const isNew = !id;

  // ----- loading -----
  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/reminders/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { reminder } = await res.json();
      const f: ReminderInput = {
        event_key: reminder.event_key,
        name: reminder.name,
        status: reminder.status,
        applies_to: reminder.applies_to,
        admin_copy: reminder.admin_copy,
        stop_on: reminder.stop_on,
        product_ids: reminder.product_ids,
        send_from: reminder.send_from?.slice(0, 5) ?? null,
        send_until: reminder.send_until?.slice(0, 5) ?? null,
        skip_shabbat: reminder.skip_shabbat,
        steps: reminder.steps.map((s: any) => ({
          offset_minutes: s.offset_minutes,
          send_email: s.send_email,
          admin_copy: s.admin_copy,
          action_key: s.action_key,
          title_he: s.title_he,
          body_he: s.body_he,
        })),
      };
      setForm(f);
      setSaved(f);
      setIsSystem(!!reminder.is_system);
      setSomeProducts(!!f.product_ids?.length);
      setActivate(f.status === 'active');
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    fetch('/api/admin/payments/products', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setProducts((Array.isArray(list) ? list : []).map((p: any) => ({ id: p.id, title: p.title }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.event_key) return;
    fetch(`/api/admin/reminders/audience?event=${encodeURIComponent(form.event_key)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAud)
      .catch(() => {});
  }, [form.event_key]);

  const dirty = isNew ? !!form.event_key : !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const { dialog, allowLeave } = useLeaveGuard(dirty, words.leave);

  // ----- checks -----
  const check = useCallback(
    (s: Step): Record<string, string> => {
      const e: Record<string, string> = {};
      if (s === 'trigger' && !form.event_key) e.event_key = t('admin.reminders.wizard.chooseEvent', 'Choose what starts the reminder.');
      if (s === 'who') {
        if (!form.name.trim()) e.name = t('admin.reminders.wizard.nameRequired', 'Give the reminder a name.');
        if (someProducts && !form.product_ids?.length) e.products = t('admin.reminders.wizard.productsRequired', 'Choose at least one product, or choose all products.');
        const time = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (form.send_from && !time.test(form.send_from)) e.send_from = t('admin.reminders.settings.timeError', 'Use a time like 09:00.');
        if (form.send_until && !time.test(form.send_until)) e.send_until = t('admin.reminders.settings.timeError', 'Use a time like 09:00.');
        if (form.send_from && form.send_until && form.send_from >= form.send_until) e.send_until = t('admin.reminders.settings.orderError', 'The end must be after the start.');
      }
      if (s === 'steps' && ev && !ev.locked) {
        if (!form.steps.length) e.steps = t('admin.reminders.wizard.stepsRequired', 'Add at least one message.');
        form.steps.forEach((st, i) => {
          if (!st.title_he.trim() || !htmlToText(st.body_he).trim()) e[`step${i}`] = t('admin.reminders.wizard.stepIncomplete', 'This message needs a subject and words.');
        });
      }
      return e;
    },
    [form, someProducts, ev, t],
  );

  const wiz = useStepWizard(STEPS, check, params.get('step'));

  // ----- changes -----
  const set = (patch: Partial<ReminderInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    for (const k of Object.keys(patch)) wiz.clearError(k);
  };

  const chooseEvent = (e: CatalogEvent) => {
    if (!isNew && saved && saved.event_key !== e.key) return;
    if (form.event_key === e.key) return;
    setForm(fromCatalog(e));
    setSomeProducts(false);
    wiz.clearError('event_key');
  };

  const sortedSteps = useMemo(() => [...form.steps].map((s, i) => ({ s, i })).sort((a, b) => a.s.offset_minutes - b.s.offset_minutes), [form.steps]);
  const emailOn = form.steps.some((s) => s.send_email);

  // ----- saving -----
  const save = async () => {
    if (!wiz.checkAll()) return;
    setSaving(true);
    const status = isNew ? (wiz.step === 'review' ? (activate ? 'active' : 'off') : 'draft') : form.status;
    try {
      const res = await fetch(isNew ? '/api/admin/reminders' : `/api/admin/reminders/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, product_ids: someProducts ? form.product_ids : null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      toast({
        title:
          status === 'active'
            ? t('admin.reminders.wizard.savedOn', 'Saved. The reminder is on.')
            : t('admin.reminders.wizard.saved', 'The reminder was saved.'),
      });
      allowLeave();
      if (isNew) router.push(`/admin/reminders?open=${body.id}`);
      else {
        setSaved({ ...form, status });
        setForm((f) => ({ ...f, status }));
      }
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!id) return;
    const status = form.status === 'active' ? 'off' : 'active';
    const res = await fetch(`/api/admin/reminders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: t('common.error', 'Error'), description: body.error, variant: 'destructive' });
      return;
    }
    setForm((f) => ({ ...f, status }));
    setSaved((s) => (s ? { ...s, status } : s));
    toast({ title: status === 'active' ? t('admin.reminders.drawer.turnedOn', 'The reminder is on') : t('admin.reminders.drawer.paused', 'The reminder is paused') });
  };

  const remove = async () => {
    if (!id || !confirm(t('admin.reminders.drawer.confirmDelete', 'Delete this reminder? Messages already sent stay in the send log.'))) return;
    const res = await fetch(`/api/admin/reminders/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: t('common.error', 'Error'), description: body.error, variant: 'destructive' });
      return;
    }
    allowLeave();
    toast({ title: t('admin.reminders.drawer.deleted', 'The reminder was deleted') });
    router.push('/admin/reminders');
  };

  const sendTest = async (steps: StepInput[]) => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/reminders/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_key: form.event_key, steps }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      toast({ title: t('admin.reminders.wizard.testSent', '{n} test emails sent to {email}').replace('{n}', String(body.sent)).replace('{email}', body.to) });
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const BackArrow = rtl ? ArrowRight : ArrowLeft;
  const labels: Record<Step, string> = {
    trigger: t('admin.reminders.wizard.step.trigger', 'What starts it'),
    who: t('admin.reminders.wizard.step.who', 'Who, and when it stops'),
    steps: t('admin.reminders.wizard.step.steps', 'The steps'),
    review: t('admin.reminders.wizard.step.review', 'Review and turn on'),
  };

  // ----- the help box beside each step -----
  const prefsBox = ev && ev.category !== 'system' && aud && (
    <div className="rounded-xl bg-primary/10 p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 font-bold">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        {t('admin.reminders.wizard.chose', 'What clients chose')}
      </div>
      <p className="mb-2 text-muted-foreground">{t('admin.reminders.wizard.choseIntro', 'Each client chooses in the portal which updates reach them by email. This reminder belongs with:')}</p>
      <PrefChip>{categoryLabel(ev.category, lang)}</PrefChip>
      <ul className="mt-3 grid gap-2 p-0">
        <li className="list-none">
          <strong>{aud.emailOff[ev.category] ?? 0}</strong> {t('admin.reminders.wizard.choseOff', 'clients turned off email for this. They get the reminder in the bell only.')}
        </li>
        <li className="list-none">
          <strong>{aud.digest}</strong> {t('admin.reminders.wizard.choseDigest', 'clients chose one email a day. The reminder goes into their summary.')}
        </li>
        <li className="list-none">
          <strong>{aud.quiet}</strong> {t('admin.reminders.wizard.choseQuiet', 'clients set quiet hours. The email waits for them to end.')}
        </li>
      </ul>
      <p className="mt-3 text-[13px] text-muted-foreground">{t('admin.reminders.wizard.choseLocked', "The client's choice can't be changed from here.")}</p>
    </div>
  );

  // ----- step 1 -----
  const catalogShown = CATALOG.filter((e) => e.area !== 'system' && (areaFilter === 'all' || e.area === areaFilter)).filter((e) => {
    const q = catalogQuery.trim().toLowerCase();
    return !q || `${e.name.he} ${e.name.en} ${e.when.he} ${e.when.en}`.toLowerCase().includes(q);
  });

  const triggerStep = (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex h-11 min-w-0 flex-1 basis-56 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
            <Search className="h-5 w-5 shrink-0" aria-hidden />
            <input
              type="search"
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder={t('admin.reminders.wizard.searchEvents', "Search, for example 'contract' or 'recording'")}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none"
            />
          </label>
          <div className="overflow-x-auto">
            <QuickPills
              label={t('admin.reminders.areaFilter', 'Area')}
              value={areaFilter}
              onChange={setAreaFilter}
              options={[{ value: 'all' as const, label: t('admin.reminders.all', 'All') }, ...AREA_ORDER.filter((a) => a !== 'system').map((a) => ({ value: a, label: bi(AREA_PILL[a]) }))]}
            />
          </div>
        </div>
        {wiz.errors.event_key && <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">{wiz.errors.event_key}</p>}
        {AREA_ORDER.filter((a) => a !== 'system').map((a) => {
          const list = catalogShown.filter((e) => e.area === a);
          if (!list.length) return null;
          const cats = [...new Set(list.map((e) => e.category))];
          return (
            <div key={a} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[15px] font-extrabold">
                  <AreaTile area={a} small />
                  {bi(AREA_LABEL[a])}
                </span>
                {a === 'team' ? (
                  <PrefChip muted>{t('admin.reminders.wizard.teamChip', 'Sent to the team, not to clients')}</PrefChip>
                ) : (
                  <PrefChip>{t('admin.reminders.group.client', "Client's setting: {list}").replace('{list}', cats.map((c) => categoryLabel(c, lang)).join(' · '))}</PrefChip>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((e) => {
                  const lockedOut = !isNew && saved?.event_key !== e.key;
                  return (
                    <div key={e.key} className={lockedOut ? 'opacity-50' : ''}>
                      <ChoiceCard
                        active={form.event_key === e.key}
                        onClick={() => chooseEvent(e)}
                        title={bi(e.name)}
                        text={`${bi(e.when)} · ${bi(TIMING_LABEL[e.timing])}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <aside className="space-y-3">
        <div className="rounded-xl bg-primary/10 p-4 text-sm">
          <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.whatIs', 'What is an automatic reminder?')}</h3>
          <p>{t('admin.reminders.wizard.whatIs1', 'A short series of messages that goes out by itself when something happens, before something happens, or when something didn\'t happen in time.')}</p>
          <p className="mt-2">{t('admin.reminders.wizard.whatIs2', 'It stops by itself as soon as the matter is sorted.')}</p>
        </div>
        <div className="rounded-xl border border-border p-4 text-sm">
          <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.clientDecides', "The client's settings decide")}</h3>
          <p>{t('admin.reminders.wizard.clientDecides1', 'Each event belongs to one of the update kinds the client chooses in the portal. The kind shows beside each group, and is set automatically.')}</p>
          <p className="mt-2">{t('admin.reminders.wizard.clientDecides2', 'Clients who turned email off for that kind get it in the bell only.')}</p>
        </div>
        <div className="rounded-xl border border-border p-4 text-sm">
          <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.notFound', "Can't find what you need?")}</h3>
          <p>{t('admin.reminders.wizard.notFound1', 'A one-time message to everyone is sent from Notifications, and a regular email on a schedule from Scheduled emails.')}</p>
        </div>
      </aside>
    </div>
  );

  // ----- step 2 -----
  const whoStep = ev && (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-6">
        <p className="text-sm text-muted-foreground">
          {bi(ev.name)} · {t('admin.reminders.wizard.changeEvent', 'you can go back to step 1 to change it.')}
        </p>
        <WizardField label={t('admin.reminders.wizard.name', 'Reminder name')} required error={wiz.errors.name} hint={t('admin.reminders.wizard.nameHint', "The name shows only in the list. Clients don't see it.")} htmlFor="r-name">
          <input id="r-name" className={inputCls(!!wiz.errors.name)} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </WizardField>

        {ev.audience === 'client' && (
          <section className="grid gap-2">
            <h3 className="text-base font-bold">{t('admin.reminders.wizard.productsTitle', 'For which products')}</h3>
            <p className="text-sm text-muted-foreground">{t('admin.reminders.wizard.productsHint', 'It can run for everything, or only for some products.')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard active={!someProducts} onClick={() => { setSomeProducts(false); wiz.clearError('products'); }} title={t('admin.reminders.wizard.allProducts', 'All products')} text={t('admin.reminders.wizard.allProductsText', 'Also products added in the future')} />
              <ChoiceCard active={someProducts} onClick={() => setSomeProducts(true)} title={t('admin.reminders.wizard.someProducts', 'Only products I choose')} text={t('admin.reminders.wizard.someProductsText', 'For example only parent coaching and the club')} />
            </div>
            {someProducts && (
              <div className={`grid max-h-60 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2 ${wiz.errors.products ? 'border-red-500' : 'border-border'}`}>
                {products.map((p) => {
                  const on = !!form.product_ids?.includes(p.id);
                  return (
                    <label key={p.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={on}
                        onChange={() => set({ product_ids: on ? (form.product_ids ?? []).filter((x) => x !== p.id) : [...(form.product_ids ?? []), p.id] })}
                      />
                      <bdi>{p.title}</bdi>
                    </label>
                  );
                })}
              </div>
            )}
            {wiz.errors.products && <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">{wiz.errors.products}</p>}
          </section>
        )}

        <section className="grid gap-2">
          <h3 className="text-base font-bold">{t('admin.reminders.wizard.whoTitle', 'Who gets it')}</h3>
          {ev.audience === 'team' ? (
            <p className="text-sm">{t('admin.reminders.wizard.whoTeam', 'Every admin of the school. A new admin gets it automatically.')}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t('admin.reminders.wizard.whoHint', 'When the client is a child, the parent gets it instead.')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-primary bg-primary/10 p-4 text-sm">
                  <Users className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                  <span>
                    <strong>{t('admin.reminders.wizard.whoClient', 'The client, or the paying parent')}</strong>
                    <span className="block text-muted-foreground">{t('admin.reminders.wizard.whoClientText', 'Whoever the enrollment belongs to')}</span>
                  </span>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" checked={form.admin_copy} onChange={(e) => set({ admin_copy: e.target.checked })} />
                  <span>
                    <strong>{t('admin.reminders.wizard.adminCopy', 'Copy to the team')}</strong>
                    <span className="block text-muted-foreground">{t('admin.reminders.wizard.adminCopyText', 'A short note to every admin on each step that goes out')}</span>
                  </span>
                </label>
              </div>
            </>
          )}
        </section>

        <section className="grid gap-2">
          <h3 className="text-base font-bold">{t('admin.reminders.wizard.channelsTitle', 'How it is sent')}</h3>
          <p className="text-sm text-muted-foreground">{t('admin.reminders.wizard.channelsHint', 'Each step can change this.')}</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
              <input type="checkbox" className="sr-only" checked={emailOn} onChange={(e) => set({ steps: form.steps.map((s) => ({ ...s, send_email: e.target.checked })) })} />
              {t('admin.reminders.channel.email', 'Email')}
            </label>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary">
              <Bell className="h-4 w-4" aria-hidden />
              {t('admin.reminders.channel.bell', 'Portal bell')} · {t('admin.reminders.channel.always', 'always sent')}
            </span>
            {['WhatsApp', 'SMS'].map((c) => (
              <span key={c} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 text-sm text-muted-foreground" aria-disabled>
                {c} <span className="rounded-full bg-muted px-2 text-[11.5px] font-bold">{t('admin.reminders.channel.soon', 'Coming soon')}</span>
              </span>
            ))}
          </div>
        </section>

        {ev.stops.length > 0 && (
          <section className="grid gap-2">
            <h3 className="text-base font-bold">{t('admin.reminders.wizard.stopsTitle', 'When the reminder stops')}</h3>
            <p className="text-sm text-muted-foreground">{t('admin.reminders.wizard.stopsHint', "As soon as one of these happens, the next messages don't go out.")}</p>
            <div className="grid gap-1">
              {ev.stops.map((s) => (
                <label key={s.key} className={`flex min-h-11 items-center gap-3 text-sm ${s.locked ? '' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[hsl(var(--primary))]"
                    checked={s.locked || form.stop_on.includes(s.key)}
                    disabled={s.locked}
                    onChange={(e) => set({ stop_on: e.target.checked ? [...form.stop_on, s.key] : form.stop_on.filter((x) => x !== s.key) })}
                  />
                  <span>
                    {bi(s)}
                    {s.locked && <span className="ms-2 text-[12.5px] text-muted-foreground">{t('admin.reminders.wizard.stopLocked', 'Always on, can\'t be turned off')}</span>}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {ev.audience === 'client' && (
          <section className="grid gap-2">
            <h3 className="text-base font-bold">{t('admin.reminders.wizard.hoursTitle', 'Sending hours')}</h3>
            <p className="text-sm text-muted-foreground">
              {ev.timeSensitive
                ? t('admin.reminders.wizard.hoursTimed', "This reminder is tied to a time, so it isn't held for sending hours. The client's quiet hours still apply: during them it stays in the bell only.")
                : t('admin.reminders.wizard.hoursHint', 'A message that comes outside these hours waits for the morning. If the client has quiet hours, it waits for those too. Empty = the school\'s hours.')}
            </p>
            {!ev.timeSensitive && (
              <>
                <div className="flex flex-wrap items-start gap-3">
                  <WizardField label={t('admin.reminders.settings.from', 'From')} error={wiz.errors.send_from} htmlFor="r-from">
                    <input id="r-from" type="time" className={`${inputCls(!!wiz.errors.send_from)} w-32`} value={form.send_from ?? ''} onChange={(e) => set({ send_from: e.target.value || null })} />
                  </WizardField>
                  <WizardField label={t('admin.reminders.settings.until', 'Until')} error={wiz.errors.send_until} htmlFor="r-until">
                    <input id="r-until" type="time" className={`${inputCls(!!wiz.errors.send_until)} w-32`} value={form.send_until ?? ''} onChange={(e) => set({ send_until: e.target.value || null })} />
                  </WizardField>
                </div>
                <div className={joinedBar}>
                  {([
                    [null, t('admin.reminders.wizard.shabbatSchool', "School's rule")],
                    [true, t('admin.reminders.wizard.shabbatSkip', 'Not on Shabbat')],
                    [false, t('admin.reminders.wizard.shabbatSend', 'Also on Shabbat')],
                  ] as const).map(([v, label]) => (
                    <button key={String(v)} type="button" aria-pressed={form.skip_shabbat === v} onClick={() => set({ skip_shabbat: v })} className={joinedSegment(form.skip_shabbat === v)}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
      <aside className="space-y-3">
        {prefsBox}
        <div className="rounded-xl border border-border p-4 text-sm">
          <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.tip', 'Tip')}</h3>
          <p>{t('admin.reminders.wizard.tip1', 'The portal bell is always sent, so even clients who turned email off see the reminder when they log in.')}</p>
          <p className="mt-2">{t('admin.reminders.wizard.tip2', "There's no need to choose products if the reminder suits everyone.")}</p>
        </div>
      </aside>
    </div>
  );

  // ----- step 3 -----
  type Item = { kind: 'step'; offset: number; s: StepInput; i: number; n: number } | { kind: 'system'; offset: number; he: string; en: string; warn?: { he: string; en: string } };
  const timeline: Item[] = ev
    ? [
        ...sortedSteps.map(({ s, i }, n) => ({ kind: 'step' as const, offset: s.offset_minutes, s, i, n: n + 1 })),
        ...(ev.systemRows ?? []).map((r) => ({ kind: 'system' as const, offset: r.offset, he: r.he, en: r.en, warn: r.warn })),
      ].sort((a, b) => a.offset - b.offset || (a.kind === 'system' ? 1 : -1))
    : [];

  const action = (key: string | null) => ev?.actions.find((a) => a.key === key);

  const stepsStep = ev && (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        {ev.locked ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p>{t('admin.reminders.wizard.lockedSteps', "The words of this alert are written by the system, with the client's and the payment's details. Here you choose only whether it's on, and whether it also goes by email.")}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('admin.reminders.wizard.countsFrom', 'Times count {anchor}. The grey rows happen by themselves, even today.').replace('{anchor}', bi(ev.anchor))}
            </p>
            {wiz.errors.steps && <p className="mb-3 text-[13px] font-semibold text-red-700 dark:text-red-400">{wiz.errors.steps}</p>}
            <ol className="relative m-0 grid gap-3 p-0 ps-6 before:absolute before:bottom-2 before:start-[11px] before:top-2 before:w-0.5 before:bg-border">
              {timeline.map((it, k) =>
                it.kind === 'system' ? (
                  <li key={`sys${k}`} className="relative list-none">
                    <span className="absolute -start-6 top-3 h-3 w-3 rounded-full border-2 border-muted-foreground/40 bg-card" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 text-[11.5px] font-bold">{t('admin.reminders.wizard.auto', 'Automatic')}</span>
                      <span>
                        {offsetLabel(it.offset, lang)} · {bi(it)}
                      </span>
                      {it.warn && <span className="rounded-full bg-amber-100 px-2 text-[12px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">{bi(it.warn)}</span>}
                    </div>
                  </li>
                ) : (
                  <li key={`step${it.i}`} className="relative list-none">
                    <span className="absolute -start-[30px] top-3.5 grid h-6 w-6 place-items-center rounded-full bg-primary text-[12.5px] font-extrabold text-primary-foreground" aria-hidden>
                      {it.n}
                    </span>
                    <div className={`rounded-xl border bg-card p-4 shadow-sm ${wiz.errors[`step${it.i}`] ? 'border-red-500' : 'border-border'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-primary">{offsetLabel(it.offset, lang)}</div>
                          <div className="mt-0.5 font-bold [overflow-wrap:anywhere]" dir="rtl">
                            {it.s.title_he || t('admin.reminders.wizard.noSubject', '(no subject yet)')}
                          </div>
                        </div>
                        <button type="button" onClick={() => setEditing(it.i)} className="min-h-10 rounded-lg border border-border px-3.5 text-sm font-semibold text-primary hover:bg-muted">
                          {t('admin.reminders.wizard.edit', 'Edit')}
                        </button>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground" dir="rtl">
                        {htmlToText(it.s.body_he)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[12.5px]">
                        {it.s.send_email && <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">{t('admin.reminders.channel.email', 'Email')}</span>}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{t('admin.reminders.channel.bell', 'Portal bell')}</span>
                        {action(it.s.action_key) && <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t('admin.reminders.wizard.buttonChip', 'Button: {label}').replace('{label}', action(it.s.action_key)!.he)}</span>}
                        {(it.s.admin_copy || form.admin_copy) && <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t('admin.reminders.channel.adminCopy', 'Copy to the team')}</span>}
                      </div>
                      {wiz.errors[`step${it.i}`] && <p className="mt-2 text-[13px] font-semibold text-red-700 dark:text-red-400">{wiz.errors[`step${it.i}`]}</p>}
                    </div>
                  </li>
                ),
              )}
            </ol>
            <button type="button" onClick={() => setEditing('new')} className={`${kitButton.secondary} mt-4`}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('admin.reminders.wizard.addStep', 'Add a step')}
            </button>
            {sortedSteps.length > 0 && (
              <section className="mt-6 rounded-2xl border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{t('admin.reminders.preview.title', 'How the client sees it')}</h3>
                  {sortedSteps.length > 1 && (
                    <div className={joinedBar}>
                      {sortedSteps.map((x, n) => (
                        <button key={n} type="button" aria-pressed={Math.min(previewAt, sortedSteps.length - 1) === n} onClick={() => setPreviewAt(n)} className={joinedSegment(Math.min(previewAt, sortedSteps.length - 1) === n)}>
                          {t('admin.reminders.drawer.stepN', 'step {n}').replace('{n}', String(n + 1))} · {offsetLabel(x.s.offset_minutes, lang)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <MessagePreview ev={ev} step={sortedSteps[Math.min(previewAt, sortedSteps.length - 1)].s} />
              </section>
            )}
            {ev.stops.some((s) => s.locked) && (
              <p className="mt-4 rounded-lg bg-primary/5 px-3.5 py-2.5 text-sm">
                {t('admin.reminders.wizard.stopLine', "The moment {stop}, the next messages don't go out.").replace('{stop}', ev.stops.filter((s) => s.locked).map((s) => bi(s).toLowerCase()).join(' / '))}
              </p>
            )}
          </>
        )}
      </div>
      <aside className="space-y-3">
        <div className="rounded-xl bg-primary/10 p-4 text-sm">
          <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.inShort', 'In short')}</h3>
          <ul className="m-0 grid gap-1 ps-4">
            {sortedSteps.map(({ s }, n) => (
              <li key={n}>
                {offsetLabel(s.offset_minutes, lang)} · <bdi>{s.title_he}</bdi>
              </li>
            ))}
            {!sortedSteps.length && <li>{t('admin.reminders.wizard.noStepsYet', 'No messages yet')}</li>}
          </ul>
        </div>
        {!ev.locked && (
          <button type="button" disabled={testing || !form.steps.length} onClick={() => sendTest(sortedSteps.map((x) => x.s))} className={`${kitButton.secondary} w-full`}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden />}
            {t('admin.reminders.wizard.testAll', 'Send all the steps to me to check')}
          </button>
        )}
      </aside>
    </div>
  );

  // ----- step 4 -----
  const productsText = someProducts
    ? products.filter((p) => form.product_ids?.includes(p.id)).map((p) => p.title).join(', ') || '—'
    : t('admin.reminders.wizard.allProducts', 'All products');
  const hoursText = ev?.timeSensitive
    ? t('admin.reminders.wizard.hoursTimedShort', 'Tied to the time, no sending-hours wait')
    : `${form.send_from && form.send_until ? `${form.send_from}–${form.send_until}` : t('admin.reminders.wizard.schoolHours', "The school's hours")}${form.skip_shabbat === false ? '' : `, ${t('admin.reminders.wizard.noShabbat', 'not on Shabbat')}`}`;

  const reviewStep = ev && (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">
        <div className="divide-y divide-border rounded-xl border border-border">
          <SummaryRow label={t('admin.reminders.wizard.r.name', 'Name')} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
            <bdi>{form.name}</bdi>
          </SummaryRow>
          <SummaryRow label={t('admin.reminders.wizard.r.starts', 'When it starts')} onChange={() => wiz.go('trigger')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
            {bi(ev.when)}
          </SummaryRow>
          {ev.audience === 'client' && (
            <SummaryRow label={t('admin.reminders.wizard.r.products', 'Products')} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
              {productsText}
            </SummaryRow>
          )}
          <SummaryRow label={t('admin.reminders.wizard.r.who', 'Who gets it')} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
            {ev.audience === 'team' ? t('admin.reminders.wizard.everyAdmin', 'Every admin') : t('admin.reminders.wizard.whoClient', 'The client, or the paying parent')}
          </SummaryRow>
          {!ev.locked && (
            <SummaryRow label={t('admin.reminders.wizard.r.steps', 'Steps')} onChange={() => wiz.go('steps')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
              {sortedSteps.map(({ s }) => offsetLabel(s.offset_minutes, lang)).join(' · ')}
            </SummaryRow>
          )}
          <SummaryRow label={t('admin.reminders.wizard.r.channels', 'Channels')} onChange={() => wiz.go('steps')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
            {[emailOn ? t('admin.reminders.channel.email', 'Email') : null, `${t('admin.reminders.channel.bell', 'Portal bell')} (${t('admin.reminders.channel.always', 'always sent')})`, form.admin_copy || form.steps.some((s) => s.admin_copy) ? t('admin.reminders.channel.adminCopy', 'Copy to the team') : null]
              .filter(Boolean)
              .join(', ')}
          </SummaryRow>
          {ev.category !== 'system' && aud && (
            <SummaryRow label={t('admin.reminders.wizard.r.prefs', "Clients' preferences")} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.details', 'Details')}>
              {t('admin.reminders.wizard.r.prefsText', 'By what each client chose ({category}) · {off} bell only, {digest} in the daily summary')
                .replace('{category}', categoryLabel(ev.category, lang))
                .replace('{off}', String(aud.emailOff[ev.category] ?? 0))
                .replace('{digest}', String(aud.digest))}
            </SummaryRow>
          )}
          {ev.stops.length > 0 && (
            <SummaryRow label={t('admin.reminders.wizard.r.stops', 'Stops when')} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
              {ev.stops.filter((s) => s.locked || form.stop_on.includes(s.key)).map((s) => bi(s)).join(', ')}
            </SummaryRow>
          )}
          {ev.audience === 'client' && (
            <SummaryRow label={t('admin.reminders.wizard.r.hours', 'Hours')} onChange={() => wiz.go('who')} changeLabel={t('admin.reminders.wizard.change', 'Change')}>
              {hoursText}
            </SummaryRow>
          )}
        </div>

        {aud && aud.existing.count > 0 && (
          <section className="grid gap-2">
            <h3 className="text-base font-bold">
              {t('admin.reminders.wizard.existingTitle', 'There are already {n} open cases for this').replace('{n}', String(aud.existing.count))}
            </h3>
            {aud.existing.names.length > 0 && <p className="text-sm text-muted-foreground">{aud.existing.names.join(', ')}. {t('admin.reminders.wizard.existingAsk', 'What should happen with them?')}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard active={form.applies_to === 'new'} onClick={() => set({ applies_to: 'new' })} title={t('admin.reminders.wizard.newOnly', 'Only new cases')} text={t('admin.reminders.wizard.newOnlyText', 'They carry on as today, without messages')} />
              <ChoiceCard active={form.applies_to === 'all'} onClick={() => set({ applies_to: 'all' })} title={t('admin.reminders.wizard.alsoThem', 'Them too')} text={t('admin.reminders.wizard.alsoThemText', 'Each starts from the step that fits the days that passed')} />
            </div>
          </section>
        )}

        {isNew ? (
          <section className="grid gap-2">
            <h3 className="text-base font-bold">{t('admin.reminders.wizard.turnOnNow', 'Turn it on now?')}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceCard active={activate} onClick={() => setActivate(true)} title={t('admin.reminders.wizard.yesOn', 'Yes, turn it on')} text={t('admin.reminders.wizard.yesOnText', 'From the moment you save, every new case starts the reminder')} />
              <ChoiceCard active={!activate} onClick={() => setActivate(false)} title={t('admin.reminders.wizard.keepOff', 'Save it turned off')} text={t('admin.reminders.wizard.keepOffText', 'You can turn it on later from the list')} />
            </div>
          </section>
        ) : (
          <p className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[form.status]}`} aria-hidden />
            {t('admin.reminders.wizard.nowStatus', 'Now: {status}. Use the button at the top to turn it on or pause it.').replace('{status}', statusWords[form.status])}
          </p>
        )}
        {ev.replacesTrigger && (
          <p className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('admin.reminders.wizard.replacesTrigger', 'Turning this on switches off the old email trigger for the same event, so nobody gets two messages.')}
          </p>
        )}
      </div>
      <aside className="space-y-3">
        {!ev.locked && (
          <div className="rounded-xl bg-primary/10 p-4 text-sm">
            <h3 className="mb-1 font-bold">{t('admin.reminders.wizard.beforeOn', 'Before turning it on')}</h3>
            <p>{t('admin.reminders.wizard.beforeOn1', "It's worth sending yourself all the steps and seeing how they look on a phone.")}</p>
            <button type="button" disabled={testing || !form.steps.length} onClick={() => sendTest(sortedSteps.map((x) => x.s))} className={`${kitButton.secondary} mt-3 w-full`}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden />}
              {t('admin.reminders.wizard.testAllShort', 'Send all the steps to me')}
            </button>
            <p className="mt-2 text-[13px] text-muted-foreground">{t('admin.reminders.wizard.sampleNote', 'Test messages come with sample details.')}</p>
          </div>
        )}
      </aside>
    </div>
  );

  // ----- the page -----
  const editingStep: StepInput | null =
    editing === 'new'
      ? { offset_minutes: ev?.timing === 'before' ? -24 * 60 : 24 * 60, send_email: emailOn || !form.steps.length, admin_copy: false, action_key: ev?.actions[0]?.key ?? null, title_he: '', body_he: '<p>שלום {שם},</p><p></p>' }
      : editing != null
        ? form.steps[editing]
        : null;
  const editingPosition = editing === 'new' ? form.steps.length + 1 : editing != null ? sortedSteps.findIndex((x) => x.i === editing) + 1 : 0;

  const saveLabel = isNew
    ? wiz.step === 'review'
      ? activate
        ? t('admin.reminders.wizard.saveOn', 'Save and turn on')
        : t('admin.reminders.wizard.saveOff', 'Save')
      : t('admin.reminders.wizard.saveDraft', 'Save as draft')
    : t('admin.saveBar.save', 'Save');

  const system = ev?.area === 'system';

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-4 p-4 pb-28 md:p-6 md:pb-28" dir={direction}>
        <Link href="/admin/reminders" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <BackArrow className="h-4 w-4" aria-hidden />
          {t('admin.reminders.title', 'Automatic reminders')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="flex flex-wrap items-center gap-3 text-[26px] font-extrabold leading-tight tracking-tight [font-family:inherit] sm:text-3xl">
            <bdi>{isNew ? t('admin.reminders.new', 'New reminder') : form.name || '…'}</bdi>
            {!isNew && !loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-0.5 text-sm font-semibold">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[form.status]}`} aria-hidden />
                {statusWords[form.status]}
              </span>
            )}
          </h1>
          {!isNew && !loading && !notFound && !system && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={toggleStatus} className={kitButton.secondary}>
                {form.status === 'active' ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                {form.status === 'active' ? t('admin.reminders.drawer.pause', 'Pause') : t('admin.reminders.drawer.turnOn', 'Turn on')}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={isSystem}
                title={isSystem ? t('admin.reminders.drawer.builtIn', "Built-in reminders can't be deleted. Pause it instead.") : undefined}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-200 bg-card px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('admin.reminders.drawer.delete', 'Delete')}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : notFound ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">{t('admin.reminders.wizard.notFoundText', 'This reminder was not found. It may have been deleted.')}</p>
        ) : system ? (
          <p className="flex items-start gap-3 rounded-xl border border-border bg-card p-6 text-sm">
            <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {t('admin.reminders.drawer.alwaysText', "The client asked for this message, so it's emailed even to clients who turned email off. Only the wording can be edited, in the email templates.")}{' '}
              <Link href="/admin/emails/templates" className="font-semibold text-primary underline">
                {t('admin.reminders.drawer.editWording', 'Edit the wording')}
              </Link>
            </span>
          </p>
        ) : (
          <StepWizard
            steps={STEPS}
            step={wiz.step}
            labels={labels}
            onGo={wiz.go}
            blocked={wiz.blocked}
            title={
              wiz.step === 'trigger'
                ? t('admin.reminders.wizard.t.trigger', 'What starts the reminder?')
                : wiz.step === 'who'
                  ? t('admin.reminders.wizard.t.who', 'Who it goes to, and when it stops')
                  : wiz.step === 'steps'
                    ? t('admin.reminders.wizard.t.steps', 'What is sent, and when')
                    : t('admin.reminders.wizard.t.review', 'Check that everything is right')
            }
            lead={
              wiz.step === 'trigger'
                ? t('admin.reminders.wizard.l.trigger', 'Choose the moment the reminder starts. You can choose one.')
                : wiz.step === 'review'
                  ? t('admin.reminders.wizard.l.review', 'You can change any line before saving.')
                  : undefined
            }
          >
            {wiz.step === 'trigger' && triggerStep}
            {wiz.step === 'who' && whoStep}
            {wiz.step === 'steps' && stepsStep}
            {wiz.step === 'review' && reviewStep}
          </StepWizard>
        )}

        {ev && editingStep && (
          <StepEditor
            open={editing != null}
            ev={ev}
            step={editingStep}
            position={editingPosition}
            total={editing === 'new' ? form.steps.length + 1 : form.steps.length}
            testing={testing}
            onTest={(s) => sendTest([s])}
            onClose={() => setEditing(null)}
            onDelete={
              editing === 'new' || editing == null
                ? null
                : () => {
                    set({ steps: form.steps.filter((_, i) => i !== editing) });
                    setEditing(null);
                  }
            }
            onSave={(s) => {
              if (editing === 'new') set({ steps: [...form.steps, s] });
              else if (editing != null) set({ steps: form.steps.map((x, i) => (i === editing ? s : x)) });
              wiz.reset();
              setEditing(null);
            }}
          />
        )}

        {!loading && !notFound && !system && (
          <SaveBar isNew={isNew} dirty={dirty} saving={saving} onSave={save} onDiscard={() => saved && setForm(saved)} cancelHref="/admin/reminders" saveLabel={saveLabel} text={words.bar} />
        )}
        {dialog}
      </div>
    </AdminLayout>
  );
}
