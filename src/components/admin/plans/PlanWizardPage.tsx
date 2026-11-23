'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { BlockedNote, SaveBar, joinedBar, joinedSegment, kitButton, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { PLAN_TONE, PLAN_TYPES, usePlanFormat, type PaymentPlan, type PlanType } from './planFormat';
import { TypePicture } from './TypePicture';

const STEPS = ['basics', 'charges', 'settings'] as const;
type Step = (typeof STEPS)[number];

const EMPTY: Partial<PaymentPlan> = {
  plan_name: '',
  plan_description: '',
  plan_type: 'one_time',
  auto_detect_enabled: true,
  priority: 10,
  is_active: true,
  is_default: false,
};

/**
 * Creating or editing a payment plan, step by step on its own page (it was
 * a dialog): name and type, how it charges, and settings. Every field and
 * rule of the old form is kept; Continue stops on a missing or wrong field
 * with the reason by it. Saving is in the floating bar (always there for a
 * new plan, once something changes for an existing one). Delete stays at
 * the top, off while enrollments use the plan.
 */
export function PlanWizardPage({ planId }: { planId?: string }) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const f = usePlanFormat();
  const rtl = direction === 'rtl';
  const BackArrow = rtl ? ArrowRight : ArrowLeft;

  const [data, setData] = useState<Partial<PaymentPlan>>(EMPTY);
  const [initial, setInitial] = useState<Partial<PaymentPlan>>(EMPTY);
  const [loading, setLoading] = useState(!!planId);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>('basics');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!planId) return;
    void (async () => {
      try {
        // There is no single-plan read, so the plan comes from the list.
        const res = await fetch('/api/admin/payments/plans');
        if (!res.ok) throw new Error('not found');
        const all = (await res.json()) as PaymentPlan[];
        const loaded = Array.isArray(all) ? all.find((p) => p.id === planId) : undefined;
        if (!loaded) throw new Error('not found');
        setData(loaded);
        setInitial(loaded);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [planId]);

  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  const words = saveBarText(t);
  // Leaving with unsaved changes asks first (inside the admin, and on closing the tab).
  const { dialog: leaveDialog, allowLeave } = useLeaveGuard(dirty, words.leave);

  const set = (patch: Partial<PaymentPlan>) => {
    setData((d) => ({ ...d, ...patch }));
    setErrors({});
  };
  const chooseType = (type: PlanType) =>
    set({ plan_type: type, ...(type === 'deposit' && !data.deposit_type ? { deposit_type: 'percentage' as const } : {}) });

  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    const required = t('admin.payments.plans.wizard.required', 'This field is required.');
    if (s === 'basics') {
      if (!data.plan_name?.trim()) e.plan_name = t('admin.payments.plans.wizard.errName', 'Give the plan a name.');
    }
    if (s === 'charges') {
      const count = Number(data.installment_count);
      if (data.plan_type === 'deposit') {
        if ((data.deposit_type ?? 'percentage') === 'percentage') {
          const p = Number(data.deposit_percentage);
          if (!p || p < 1 || p > 100) e.deposit_percentage = t('admin.payments.plans.wizard.errPercent', 'Write a percentage between 1 and 100.');
        } else if (!(Number(data.deposit_amount) > 0)) {
          e.deposit_amount = t('admin.payments.plans.wizard.errAmount', 'Write an amount greater than 0.');
        }
      }
      if (data.plan_type === 'deposit' || data.plan_type === 'installments') {
        if (!Number.isInteger(count) || count < 1) e.installment_count = t('admin.payments.plans.wizard.errCount', 'Write how many payments (1 or more).');
        if (!data.installment_frequency) e.installment_frequency = required;
      }
      if (data.plan_type === 'subscription') {
        if (!data.subscription_frequency) e.subscription_frequency = required;
        if (data.subscription_amount != null && !(Number(data.subscription_amount) > 0))
          e.subscription_amount = t('admin.payments.plans.wizard.errAmount', 'Write an amount greater than 0.');
      }
      // Per session: the price is the plan's, and the product total is sessions × this price.
      if (data.plan_type === 'per_session' && !(Number(data.session_amount) > 0)) {
        e.session_amount = data.session_amount == null ? required : t('admin.payments.plans.wizard.errAmount', 'Write an amount greater than 0.');
      }
    }
    if (s === 'settings' && !Number.isFinite(Number(data.priority))) e.priority = required;
    return e;
  };

  const fail = (s: Step, e: Record<string, string>) => {
    setStep(s);
    setErrors(e);
    setBlocked(t('admin.coaching.common.fixErrors', 'Some fields need attention. The reason is shown in red next to each one.'));
  };

  const go = (target: Step) => {
    const from = STEPS.indexOf(step);
    const to = STEPS.indexOf(target);
    if (to > from) {
      for (const s of STEPS.slice(from, to)) {
        const e = check(s);
        if (Object.keys(e).length) return fail(s, e);
      }
    }
    setErrors({});
    setBlocked(null);
    setStep(target);
  };

  const save = async () => {
    for (const s of STEPS) {
      const e = check(s);
      if (Object.keys(e).length) return fail(s, e);
    }
    setSaving(true);
    try {
      const response = await fetch(planId ? `/api/admin/payments/plans/${planId}` : '/api/admin/payments/plans', {
        method: planId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to ${planId ? 'update' : 'create'} plan`);
      }
      const saved = await response.json().catch(() => null);
      toast({
        title: t('common.success', 'Success'),
        description: planId
          ? t('admin.payments.plans.updateSuccess', 'Payment plan updated successfully')
          : t('admin.payments.plans.createSuccess', 'Payment plan created successfully'),
      });
      if (planId) {
        setInitial(data);
      } else {
        setInitial(data);
        allowLeave();
        router.replace(saved?.id ? `/admin/payments/plans?plan=${saved.id}` : '/admin/payments/plans');
      }
    } catch (error: any) {
      console.error('Error saving payment plan:', error);
      toast({ title: t('common.error', 'Error'), description: error.message || t('admin.payments.plans.saveError', 'Failed to save payment plan'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!planId || !confirm(t('admin.payments.plans.deleteConfirm', 'Are you sure you want to delete this payment plan?'))) return;
    try {
      const response = await fetch(`/api/admin/payments/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete plan');
      }
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.plans.deleteSuccess', 'Payment plan deleted successfully') });
      setInitial(data);
      allowLeave();
      router.push('/admin/payments/plans');
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.message || t('admin.payments.plans.deleteError', 'Failed to delete payment plan'), variant: 'destructive' });
    }
  };

  const index = STEPS.indexOf(step);
  const stepLabel = (s: Step) =>
    ({
      basics: t('admin.payments.plans.wizard.stepBasics', 'Name and type'),
      charges: t('admin.payments.plans.wizard.stepCharges', 'How it charges'),
      settings: t('admin.payments.plans.form.settings', 'Settings'),
    })[s];
  const field = 'h-11 w-full rounded-lg border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]';
  const border = (key: string) => (errors[key] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : 'border-border');
  const typeText = (type: PlanType) =>
    ({
      one_time: t('admin.payments.plans.wizard.oneTimeText', 'The whole price in one payment.'),
      deposit: t('admin.payments.plans.wizard.depositText', 'A deposit first, then equal payments.'),
      installments: t('admin.payments.plans.wizard.installmentsText', 'The price paid in equal parts.'),
      subscription: t('admin.payments.plans.wizard.subscriptionText', 'Charged again every period, until cancelled.'),
      per_session: t('admin.payments.plans.wizard.perSessionText', 'Nothing upfront: the card is saved, and each session is charged when it is held.'),
    })[type];
  const typeName = (type: PlanType) =>
    ({
      one_time: t('admin.payments.plans.form.oneTimePayment', 'One-Time Payment'),
      deposit: t('admin.payments.plans.form.depositInstallments', 'Deposit + Installments'),
      installments: t('admin.payments.plans.form.installmentsOnly', 'Installments Only'),
      subscription: t('admin.payments.plans.form.subscription', 'Subscription'),
      per_session: t('admin.payments.plans.form.perSession', 'Pay per session'),
    })[type];
  const freqOptions = (subscription: boolean) =>
    subscription
      ? [
          ['weekly', t('admin.payments.plans.form.weekly', 'Weekly')],
          ['monthly', t('admin.payments.plans.form.monthly', 'Monthly')],
          ['quarterly', t('admin.payments.plans.form.quarterly', 'Quarterly')],
          ['annually', t('admin.payments.plans.form.annually', 'Annually')],
        ]
      : [
          ['weekly', t('admin.payments.plans.form.weekly', 'Weekly')],
          ['biweekly', t('admin.payments.plans.form.biweekly', 'Bi-weekly')],
          ['monthly', t('admin.payments.plans.form.monthly', 'Monthly')],
        ];
  const used = data.usage_count ?? 0;

  const installmentFields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t('admin.payments.plans.form.numberOfInstallments', 'Number of Installments')} required error={errors.installment_count}>
        <input
          type="number"
          min={1}
          value={data.installment_count ?? ''}
          onChange={(e) => set({ installment_count: e.target.value === '' ? undefined : Number(e.target.value) })}
          placeholder={data.plan_type === 'deposit' ? '6' : '12'}
          className={`${field} ${border('installment_count')}`}
        />
      </Field>
      <Field label={t('admin.payments.plans.form.frequency', 'Frequency')} required error={errors.installment_frequency}>
        <select value={data.installment_frequency ?? ''} onChange={(e) => set({ installment_frequency: e.target.value || undefined })} className={`${field} ${border('installment_frequency')}`}>
          <option value="">{t('admin.payments.plans.form.selectFrequency', 'Select frequency')}</option>
          {freqOptions(false).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-4 p-4 pb-28 md:p-6 md:pb-28" dir={direction}>
        <Link href="/admin/payments/plans" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <BackArrow className="h-4 w-4" aria-hidden />
          {t('admin.payments.plans.wizard.back', 'Back to payment plans')}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere] sm:text-3xl">
              <bdi>{planId ? initial.plan_name || t('admin.payments.plans.form.editTitle', 'Edit Payment Plan') : t('admin.payments.plans.form.createTitle', 'Create Payment Plan')}</bdi>
            </h1>
            <p className="mt-1 text-muted-foreground">{t('admin.payments.plans.form.description', 'Configure payment plan details and settings.')}</p>
          </div>
          {planId && !notFound && !loading && (
            <button
              type="button"
              onClick={remove}
              disabled={used > 0}
              title={used > 0 ? t('admin.payments.plans.drawer.inUse', 'Enrollments use this plan, so it can\'t be deleted. Turn it off instead.') : undefined}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-200 bg-card px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('admin.products.wizard.delete', 'Delete')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : notFound ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            {t('admin.payments.plans.wizard.notFound', 'This payment plan was not found. It may have been deleted.')}
          </p>
        ) : (
          <>
            {/* Steps */}
            <header className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary">
                  {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}').replace('{n}', String(index + 1)).replace('{total}', String(STEPS.length))}
                </span>
                <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
              </div>
              <div className="mt-1.5 flex gap-[3px]" aria-hidden>
                {STEPS.map((s, i) => (
                  <i key={s} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-primary' : 'bg-primary/15'}`} />
                ))}
              </div>
              <ol className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
                {STEPS.map((s, i) => (
                  <li key={s} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => go(s)}
                      aria-current={s === step ? 'step' : undefined}
                      className={`inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold ${
                        s === step
                          ? 'border-primary bg-primary text-primary-foreground'
                          : i < index
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <span className="opacity-70">{i + 1}</span>
                      {stepLabel(s)}
                    </button>
                  </li>
                ))}
              </ol>
            </header>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              {step === 'basics' && (
                <>
                  <StepTitle title={t('admin.payments.plans.wizard.basicsTitle', 'Name and payment type')} />
                  <div className="space-y-3">
                    <Field label={t('admin.payments.plans.form.planName', 'Plan Name')} required error={errors.plan_name}>
                      <input
                        value={data.plan_name ?? ''}
                        onChange={(e) => set({ plan_name: e.target.value })}
                        placeholder={t('admin.payments.plans.form.planNamePlaceholder', 'e.g., Monthly Installments')}
                        className={`${field} ${border('plan_name')}`}
                      />
                    </Field>
                    <Field label={t('admin.payments.plans.form.planDescription', 'Description')}>
                      <textarea
                        value={data.plan_description ?? ''}
                        onChange={(e) => set({ plan_description: e.target.value })}
                        placeholder={t('admin.payments.plans.form.planDescriptionPlaceholder', 'Describe this payment plan...')}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground outline-none focus:border-primary"
                      />
                    </Field>
                  </div>
                  <p className="mb-2 mt-5 text-sm font-semibold">
                    {t('admin.payments.plans.form.planType', 'Payment Type')} <span className="text-red-600">*</span>
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup">
                    {PLAN_TYPES.map((type) => {
                      const on = data.plan_type === type;
                      const tone = PLAN_TONE[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => chooseType(type)}
                          className={`relative flex items-center gap-4 rounded-[14px] border p-3.5 text-start transition-colors ${
                            on ? 'border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <span className={`grid h-14 w-20 shrink-0 place-items-center rounded-xl ${tone.tile}`}>
                            <TypePicture type={type} />
                          </span>
                          <span className="min-w-0 flex-1 pe-6">
                            <span className="block font-bold">{typeName(type)}</span>
                            <span className="block text-[13px] text-muted-foreground">{typeText(type)}</span>
                          </span>
                          {on && (
                            <span className="absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 'charges' && (
                <>
                  <StepTitle title={typeName((data.plan_type ?? 'one_time') as PlanType)} lead={typeText((data.plan_type ?? 'one_time') as PlanType)} />
                  {data.plan_type === 'one_time' && (
                    <p className="rounded-xl bg-muted/60 p-4 text-sm">{t('admin.payments.plans.wizard.oneTimeNothing', 'Nothing more to set: the whole price is paid at once.')}</p>
                  )}
                  {data.plan_type === 'deposit' && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold">{t('admin.payments.plans.form.depositType', 'Deposit Type')}</p>
                        <div className={joinedBar} role="radiogroup">
                          {(['percentage', 'fixed'] as const).map((dt) => {
                            const on = (data.deposit_type ?? 'percentage') === dt;
                            return (
                              <button
                                key={dt}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() =>
                                  set({
                                    deposit_type: dt,
                                    // Clear the other field when switching types (as before)
                                    deposit_percentage: dt === 'percentage' ? data.deposit_percentage : undefined,
                                    deposit_amount: dt === 'fixed' ? data.deposit_amount : undefined,
                                  })
                                }
                                className={`${joinedSegment(on)} px-4`}
                              >
                                {dt === 'percentage' ? t('admin.payments.plans.form.percentage', 'Percentage') : t('admin.payments.plans.form.fixedAmount', 'Fixed Amount')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {(data.deposit_type ?? 'percentage') === 'percentage' ? (
                        <Field label={t('admin.payments.plans.form.depositPercentage', 'Deposit Percentage')} required error={errors.deposit_percentage}>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={data.deposit_percentage ?? ''}
                            onChange={(e) => set({ deposit_percentage: e.target.value === '' ? undefined : Number(e.target.value) })}
                            placeholder="30"
                            className={`${field} max-w-[12rem] ${border('deposit_percentage')}`}
                          />
                        </Field>
                      ) : (
                        <Field label={t('admin.payments.plans.form.depositAmount', 'Deposit Amount')} required error={errors.deposit_amount}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.deposit_amount ?? ''}
                            onChange={(e) => set({ deposit_amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                            placeholder="1000"
                            className={`${field} max-w-[12rem] ${border('deposit_amount')}`}
                          />
                        </Field>
                      )}
                      {installmentFields}
                    </div>
                  )}
                  {data.plan_type === 'installments' && installmentFields}
                  {data.plan_type === 'per_session' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t('admin.payments.plans.form.pricePerSession', 'Price per session')} error={errors.session_amount}>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={data.session_amount ?? ''}
                          onChange={(e) => set({ session_amount: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="120"
                          className={`${field} ${border('session_amount')}`}
                        />
                        {!errors.session_amount && (
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {t(
                              'admin.payments.plans.form.pricePerSessionTotalHelp',
                              'Charged to the saved card each time a session is marked held. A product on this plan costs its sessions × this price.',
                            )}
                          </p>
                        )}
                      </Field>
                    </div>
                  )}
                  {data.plan_type === 'subscription' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={t('admin.payments.plans.form.billingFrequency', 'Billing Frequency')} required error={errors.subscription_frequency}>
                        <select
                          value={data.subscription_frequency ?? ''}
                          onChange={(e) => set({ subscription_frequency: e.target.value || undefined })}
                          className={`${field} ${border('subscription_frequency')}`}
                        >
                          <option value="">{t('admin.payments.plans.form.selectFrequency', 'Select frequency')}</option>
                          {freqOptions(true).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t('admin.payments.plans.form.pricePerPeriod', 'Price per period')} error={errors.subscription_amount}>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={data.subscription_amount ?? ''}
                          onChange={(e) => set({ subscription_amount: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="100"
                          className={`${field} ${border('subscription_amount')}`}
                        />
                        {!errors.subscription_amount && (
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {t(
                              'admin.payments.plans.form.pricePerPeriodHelp',
                              "Charged every period, e.g. 100 monthly or 1,000 yearly. Leave empty to use the product price. A change applies from each member's next charge.",
                            )}
                          </p>
                        )}
                      </Field>
                    </div>
                  )}
                  <p className="mt-5 rounded-lg bg-primary/5 px-3.5 py-2.5 text-sm">
                    <span className="text-muted-foreground">{t('admin.payments.plans.wizard.summary', 'In short')}: </span>
                    <b>{f.details(data)}</b>
                  </p>
                </>
              )}

              {step === 'settings' && (
                <>
                  <StepTitle title={t('admin.payments.plans.form.settings', 'Settings')} lead={t('admin.payments.plans.autoDetectionDesc', 'Payment plans with auto-detection enabled will be automatically assigned to enrollments based on priority.')} />
                  <Field label={t('admin.payments.plans.priority', 'Priority')} error={errors.priority}>
                    <input
                      type="number"
                      value={data.priority ?? ''}
                      onChange={(e) => set({ priority: Number(e.target.value) })}
                      placeholder="10"
                      className={`${field} max-w-[10rem] ${border('priority')}`}
                    />
                    {!errors.priority && (
                      <p className="mt-1 text-[13px] text-muted-foreground">{t('admin.payments.plans.form.priorityDesc', 'Higher priority plans are selected first during auto-detection')}</p>
                    )}
                  </Field>
                  <div className="mt-3">
                    <ToggleRow
                      title={t('admin.payments.plans.form.autoDetectionEnabled', 'Auto-Detection Enabled')}
                      text={t('admin.payments.plans.form.autoDetectionDesc', 'Automatically assign this plan to eligible enrollments')}
                      checked={!!data.auto_detect_enabled}
                      onChange={(v) => set({ auto_detect_enabled: v })}
                    />
                    <ToggleRow
                      title={t('admin.payments.plans.form.active', 'Active')}
                      text={t('admin.payments.plans.form.activeDesc', 'Inactive plans cannot be assigned to new enrollments')}
                      checked={!!data.is_active}
                      onChange={(v) => set({ is_active: v })}
                    />
                    <ToggleRow
                      title={t('admin.payments.plans.form.defaultPlan', 'Default Plan')}
                      text={t('admin.payments.plans.form.defaultPlanDesc', 'Use this plan when no other plan matches')}
                      checked={!!data.is_default}
                      onChange={(v) => set({ is_default: v })}
                    />
                  </div>
                </>
              )}

              <div className="mt-6">
                <BlockedNote text={blocked} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                {index > 0 ? (
                  <button type="button" onClick={() => go(STEPS[index - 1])} className={kitButton.back}>
                    {t('admin.notifications.wizard.back', 'Back')}
                  </button>
                ) : (
                  <span />
                )}
                {index < STEPS.length - 1 && (
                  <button type="button" onClick={() => go(STEPS[index + 1])} className={kitButton.primary}>
                    {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', stepLabel(STEPS[index + 1]))}
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {/* The one save bar: always here */}
        {!loading && !notFound && (
          <SaveBar
            isNew={!planId}
            dirty={dirty}
            saving={saving}
            onSave={() => void save()}
            onDiscard={() => {
              setData(initial);
              setErrors({});
              setBlocked(null);
            }}
            cancelHref="/admin/payments/plans"
            saveLabel={planId ? t('admin.payments.plans.form.saveChanges', 'Save Changes') : t('admin.payments.plans.form.createPlan', 'Create Plan')}
            text={words.bar}
          />
        )}
        {leaveDialog}
      </div>
    </AdminLayout>
  );
}

function StepTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold [font-family:inherit]">{title}</h2>
      {lead && <p className="mt-1 text-sm text-muted-foreground">{lead}</p>}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </label>
  );
}

function ToggleRow({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="m-0 font-bold">{title}</p>
        <p className="m-0 mt-0.5 text-[13.5px] text-muted-foreground">{text}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} className="mt-1 shrink-0" />
    </div>
  );
}
