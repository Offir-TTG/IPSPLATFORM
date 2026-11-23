'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { kitButton } from '@/components/admin/notifications/kit';

interface Target {
  payment_plan_id: string | null;
  label: string | null;
  amount: number;
  frequency: string;
  members: number;
}
interface Change {
  id: string;
  payment_plan_id: string | null;
  old_amount: number;
  new_amount: number;
  effective_date: string;
  applies_to: 'new' | 'all';
  notice_days: number;
  notice_sent_at: string | null;
  applied_at: string | null;
}
interface Pricing {
  is_subscription: boolean;
  currency: string;
  targets: Target[];
  changes: Change[];
}

const NOTICE_OPTIONS = [14, 30, 45, 60];

/** Two little bar charts: who pays the new price. */
function AppliesPicture({ all }: { all: boolean }) {
  const bar = (on: boolean, i: number) => <i key={i} className={`w-3 rounded-t ${on ? 'h-7 bg-primary' : 'h-4 bg-muted-foreground/30'}`} />;
  return (
    <span className="flex h-10 items-end gap-1 rounded-lg border border-border bg-card px-2 pb-1" aria-hidden>
      {all ? [false, false, true, true, true].map(bar) : [false, false, false, true, true].map(bar)}
    </span>
  );
}

/**
 * In a subscription product's drawer: the membership price, any scheduled
 * change (with who it applies to and when members are told), and "Change
 * price". Renders nothing for products that aren't memberships.
 */
export function SubscriptionPriceSection({ productId }: { productId: string }) {
  const { t, language, direction } = useAdminLanguage();
  const { toast } = useToast();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const [data, setData] = useState<Pricing | null>(null);
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Change | null>(null);
  const [busy, setBusy] = useState(false);
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  // The form
  const [targetId, setTargetId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [appliesTo, setAppliesTo] = useState<'new' | 'all' | null>(null);
  const [noticeDays, setNoticeDays] = useState(30);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/price-changes`);
      const json = await res.json();
      setData(json.success ? json.data : null);
    } catch {
      setData(null);
    }
  }, [productId]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: data?.currency || 'USD', maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${n}`;
    }
  };
  const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const per = (frequency: string) =>
    frequency === 'annually'
      ? t('admin.priceChange.perYear', 'per year')
      : frequency === 'quarterly'
        ? t('admin.priceChange.perQuarter', 'per quarter')
        : frequency === 'weekly'
          ? t('admin.priceChange.perWeek', 'per week')
          : t('admin.priceChange.perMonth', 'per month');

  const target = useMemo(() => data?.targets.find((x) => (x.payment_plan_id ?? null) === targetId) ?? data?.targets[0] ?? null, [data, targetId]);
  const pendingFor = (planId: string | null) => data?.changes.find((c) => !c.applied_at && (c.payment_plan_id ?? null) === planId) ?? null;

  if (!data || !data.is_subscription) return null;

  const openForm = () => {
    const first = data.targets.find((x) => !pendingFor(x.payment_plan_id)) ?? data.targets[0];
    setTargetId(first?.payment_plan_id ?? null);
    setAmount('');
    setDate('');
    setAppliesTo(null);
    setNoticeDays(30);
    setErrors({});
    setOpen(true);
  };

  const errorText = (code: string) =>
    ({
      price_required: t('admin.priceChange.err.price', 'Write the new price (more than 0).'),
      same_price: t('admin.priceChange.err.same', 'This is already the price.'),
      applies_to_required: t('admin.priceChange.err.applies', 'Choose who the new price applies to.'),
      date_future: t('admin.priceChange.err.date', 'Choose a date after today.'),
      date_notice: t('admin.priceChange.err.notice', 'For current members the date must be at least {n} days away, so the email reaches them in time.').replace('{n}', String(noticeDays)),
      already_scheduled: t('admin.priceChange.err.scheduled', 'A change for this price is already scheduled. Cancel it first.'),
      plan_invalid: t('admin.priceChange.err.plan', 'Choose a price to change.'),
      notice_invalid: t('admin.priceChange.err.noticeDays', 'Choose how long before to tell members.'),
    })[code] ?? code;

  const submit = async () => {
    // Same rules as the server, so the reason shows by the field right away.
    const e: Record<string, string> = {};
    const n = Number(amount);
    if (!(n > 0)) e.new_amount = 'price_required';
    else if (target && n === target.amount) e.new_amount = 'same_price';
    if (!appliesTo) e.applies_to = 'applies_to_required';
    const today = new Date().toISOString().slice(0, 10);
    if (!date || date <= today) e.effective_date = 'date_future';
    else if (appliesTo === 'all' && date < new Date(Date.now() + noticeDays * 86400000).toISOString().slice(0, 10)) e.effective_date = 'date_notice';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/price-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_plan_id: target?.payment_plan_id ?? null, new_amount: n, effective_date: date, applies_to: appliesTo, notice_days: noticeDays }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        else throw new Error(json.error || 'save failed');
        return;
      }
      toast({ title: t('common.success', 'Success'), description: t('admin.priceChange.scheduled', 'The price change is scheduled.') });
      setOpen(false);
      await load();
    } catch (err) {
      toast({ title: t('common.error', 'Error'), description: err instanceof Error ? err.message : t('admin.priceChange.saveError', 'The change was not saved. Try again.'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const cancelChange = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/price-changes/${cancelling.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'cancel failed');
      toast({
        title: t('common.success', 'Success'),
        description: json.told
          ? t('admin.priceChange.cancelledTold', 'The change was cancelled. {n} members were told the price stays.').replace('{n}', String(json.told))
          : t('admin.priceChange.cancelled', 'The change was cancelled.'),
      });
      setCancelling(null);
      await load();
    } catch {
      toast({ title: t('common.error', 'Error'), description: t('admin.priceChange.cancelError', 'The change was not cancelled. Try again.'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const noticeDate = (c: Change) => {
    const d = new Date(`${c.effective_date}T12:00:00`);
    d.setDate(d.getDate() - c.notice_days);
    return d.toISOString().slice(0, 10);
  };
  const n = Number(amount);

  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <div className="flex items-center justify-between gap-2 bg-primary/[0.06] px-3.5 py-1.5">
        <h3 className="py-1 text-sm font-bold text-primary [font-family:inherit]">{t('admin.priceChange.title', 'Membership price')}</h3>
        <button type="button" onClick={openForm} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary hover:bg-primary/10">
          <Tag className="h-3.5 w-3.5" aria-hidden />
          {t('admin.priceChange.change', 'Change price')}
        </button>
      </div>
      <dl className="m-0 divide-y divide-border px-3.5 text-sm">
        {data.targets.map((x) => {
          const pending = pendingFor(x.payment_plan_id);
          return (
            <div key={x.payment_plan_id ?? 'product'} className="space-y-1.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-muted-foreground">
                  {x.label || t('admin.priceChange.price', 'Price')} · {t('admin.priceChange.members', '{n} members').replace('{n}', String(x.members))}
                </dt>
                <dd className="m-0 font-bold">
                  {money(x.amount)} <span className="font-normal text-muted-foreground">{per(x.frequency)}</span>
                </dd>
              </div>
              {pending && (
                <div className="rounded-lg bg-amber-50 px-2.5 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <b>
                    {t('admin.priceChange.pendingLine', '{price} from {date}').replace('{price}', money(pending.new_amount)).replace('{date}', longDate(pending.effective_date))}
                  </b>{' '}
                  · {pending.applies_to === 'all' ? t('admin.priceChange.forAll', 'everyone') : t('admin.priceChange.forNew', 'new members only')}
                  {pending.applies_to === 'all' && (
                    <span className="block">
                      {pending.notice_sent_at
                        ? t('admin.priceChange.noticeSent', 'Members were emailed on {date}.').replace('{date}', longDate(pending.notice_sent_at))
                        : t('admin.priceChange.noticeOn', 'Members will be emailed on {date}.').replace('{date}', longDate(noticeDate(pending)))}
                    </span>
                  )}
                  <button type="button" onClick={() => setCancelling(pending)} className="mt-1 block min-h-8 font-semibold text-red-700 hover:underline dark:text-red-400">
                    {t('admin.priceChange.cancel', 'Cancel this change')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </dl>

      {/* Change price */}
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="max-w-xl" dir={direction}>
          <DialogHeader>
            <DialogTitle className="[font-family:inherit]">{t('admin.priceChange.dialogTitle', 'Change the membership price')}</DialogTitle>
            <DialogDescription>
              {target ? t('admin.priceChange.today', 'Today: {price} {per}').replace('{price}', money(target.amount)).replace('{per}', per(target.frequency)) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            {data.targets.length > 1 && (
              <div className="grid gap-1.5 text-sm">
                <span className="font-semibold">{t('admin.priceChange.which', 'Which price?')}</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.targets.map((x) => {
                    const on = (x.payment_plan_id ?? null) === (target?.payment_plan_id ?? null);
                    return (
                      <button
                        key={x.payment_plan_id ?? 'product'}
                        type="button"
                        onClick={() => setTargetId(x.payment_plan_id ?? null)}
                        className={`rounded-xl border p-3 text-start ${on ? 'border-2 border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      >
                        <b className="block">{x.label || t('admin.priceChange.price', 'Price')}</b>
                        <span className="text-[13px] text-muted-foreground">
                          {money(x.amount)} {per(x.frequency)} · {t('admin.priceChange.members', '{n} members').replace('{n}', String(x.members))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold">
                  {t('admin.priceChange.newPrice', 'New price')} <span className="text-red-600">*</span>
                </span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((x) => ({ ...x, new_amount: '' }));
                  }}
                  dir="ltr"
                  className={`h-11 rounded-lg border bg-card px-3 outline-none focus:border-primary ${errors.new_amount ? 'border-red-500' : 'border-border'}`}
                />
                {errors.new_amount && <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errorText(errors.new_amount)}</span>}
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold">
                  {t('admin.priceChange.fromDate', 'From date')} <span className="text-red-600">*</span>
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setErrors((x) => ({ ...x, effective_date: '' }));
                  }}
                  className={`h-11 rounded-lg border bg-card px-3 outline-none focus:border-primary ${errors.effective_date ? 'border-red-500' : 'border-border'}`}
                />
                {errors.effective_date && <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errorText(errors.effective_date)}</span>}
              </label>
            </div>

            <div className="grid gap-1.5 text-sm">
              <span className="font-semibold">
                {t('admin.priceChange.who', 'Who does it apply to?')} <span className="text-red-600">*</span>
              </span>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {(['new', 'all'] as const).map((v) => {
                  const on = appliesTo === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setAppliesTo(v);
                        setErrors((x) => ({ ...x, applies_to: '', effective_date: '' }));
                      }}
                      className={`grid gap-2 rounded-xl border p-3 text-start ${on ? 'border-2 border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                    >
                      <AppliesPicture all={v === 'all'} />
                      <b>{v === 'new' ? t('admin.priceChange.newOnly', 'New members only') : t('admin.priceChange.everyone', 'Everyone')}</b>
                      <span className="text-[12.5px] text-muted-foreground">
                        {v === 'new'
                          ? t('admin.priceChange.newOnlyText', 'Current members keep paying {price}. People who join from the date pay the new price.').replace('{price}', target ? money(target.amount) : '')
                          : t('admin.priceChange.everyoneText', 'The {n} current members also move to the new price, from their first renewal on or after the date. Each gets an email in advance.').replace('{n}', String(target?.members ?? 0))}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.applies_to && <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errorText(errors.applies_to)}</span>}
            </div>

            {appliesTo === 'all' && (
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold">{t('admin.priceChange.notice', 'Tell members in advance')}</span>
                <select
                  value={noticeDays}
                  onChange={(e) => {
                    setNoticeDays(Number(e.target.value));
                    setErrors((x) => ({ ...x, effective_date: '' }));
                  }}
                  className="h-11 rounded-lg border border-border bg-card px-3 outline-none focus:border-primary dark:[color-scheme:dark]"
                >
                  {NOTICE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {t('admin.priceChange.daysBefore', '{n} days before').replace('{n}', String(d))}
                    </option>
                  ))}
                </select>
                <span className="text-[12.5px] text-muted-foreground">
                  {t('admin.priceChange.noticeHint', 'The email gives the new price, the date of their first charge at it, and that they can stop the membership before then.')}
                </span>
              </label>
            )}

            {n > 0 && date && appliesTo && target && (
              <p className="rounded-xl bg-primary/5 px-3.5 py-3 text-sm leading-relaxed">
                <b>{t('admin.priceChange.inShort', 'In short')}: </b>
                {appliesTo === 'all'
                  ? t(
                      'admin.priceChange.summaryAll',
                      'From {date} the price is {price}. The {n} current members get an email on {notice} and move to {price} at their next renewal after {date}. Buyers see "{old} · from {date} {price}" from now on.',
                    )
                      .replaceAll('{date}', longDate(date))
                      .replaceAll('{price}', money(n))
                      .replace('{n}', String(target.members))
                      .replace('{notice}', longDate(noticeDate({ effective_date: date, notice_days: noticeDays } as Change)))
                      .replace('{old}', money(target.amount))
                  : t('admin.priceChange.summaryNew', 'From {date} new members pay {price}. The {n} current members keep paying {old}. Buyers see "{old} · from {date} {price}" from now on.')
                      .replaceAll('{date}', longDate(date))
                      .replaceAll('{price}', money(n))
                      .replace('{n}', String(target.members))
                      .replaceAll('{old}', money(target.amount))}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setOpen(false)} disabled={busy} className={kitButton.secondary}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="button" onClick={() => void submit()} disabled={busy} className={kitButton.primary}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('admin.priceChange.schedule', 'Schedule the change')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel a scheduled change */}
      <AlertDialog open={!!cancelling} onOpenChange={(o) => !o && !busy && setCancelling(null)}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle className="[font-family:inherit]">{t('admin.priceChange.cancelTitle', 'Cancel the price change?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling?.notice_sent_at
                ? t('admin.priceChange.cancelToldText', 'Members were already told. They will get a short email that the price stays {price}.').replace('{price}', cancelling ? money(cancelling.old_amount) : '')
                : t('admin.priceChange.cancelText', 'The price stays {price}. No one was emailed yet.').replace('{price}', cancelling ? money(cancelling.old_amount) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('admin.priceChange.keep', 'Keep the change')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void cancelChange();
              }}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
              {t('admin.priceChange.cancel', 'Cancel this change')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
