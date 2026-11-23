'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CreditCard, Pencil, Trash2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';
import { PLAN_TONE, usePlanFormat, type PaymentPlan } from './planFormat';

/**
 * A short look at one payment plan, in the admin template's drawer: type
 * and status, the name, three numbers (priority, enrollments using it,
 * auto-detection), the details and description, and Edit / Delete at the
 * bottom. Delete is off while enrollments use the plan, as before.
 */
export function PlanDrawer({ plan, onClose, onDelete }: { plan: PaymentPlan | null; onClose: () => void; onDelete: (plan: PaymentPlan) => void }) {
  const { t, direction } = useAdminLanguage();
  const f = usePlanFormat();
  const rtl = direction === 'rtl';
  if (!plan) return null;
  const tone = PLAN_TONE[plan.plan_type] ?? PLAN_TONE.one_time;
  const used = plan.usage_count ?? 0;
  const yes = t('admin.products.drawer.yes', 'Yes');
  const no = t('admin.products.drawer.no', 'No');

  return (
    <Sheet open={!!plan} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[480px] [&>button.absolute]:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
          <p className="inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${plan.is_active ? 'bg-green-500' : 'bg-slate-400'}`} aria-hidden />
            {f.typeLabel(plan.plan_type)} ·{' '}
            {plan.is_active ? t('admin.payments.products.active', 'Active') : t('admin.payments.plans.inactive', 'Inactive')}
            {plan.is_default && (
              <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">{t('admin.payments.plans.default', 'Default')}</span>
            )}
          </p>
          <div className="mt-1.5 flex items-center gap-3 pe-10">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone.tile}`} aria-hidden>
              <CreditCard className="h-5 w-5" />
            </span>
            <SheetTitle className="min-w-0 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
              <bdi>{plan.plan_name}</bdi>
            </SheetTitle>
          </div>
          <SheetDescription className="mt-2 text-sm text-muted-foreground">{f.details(plan)}</SheetDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label={t('admin.payments.plans.priority', 'Priority')} value={String(plan.priority ?? 0)} />
            <Stat label={t('admin.payments.plans.drawer.usedBy', 'Enrollments')} value={used.toLocaleString()} />
            <Stat label={t('admin.payments.plans.autoDetect', 'Auto-Detect')} value={plan.auto_detect_enabled ? yes : no} small />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          <Section title={t('admin.notifications.drawer.details', 'Details')}>
            <dl className="m-0 divide-y divide-border px-3.5 text-sm">
              <Row label={t('admin.payments.plans.form.planType', 'Payment Type')}>
                <span className={`inline-flex items-center gap-2 font-semibold ${tone.text}`}>
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                  {f.typeLabel(plan.plan_type)}
                </span>
              </Row>
              <Row label={t('admin.payments.plans.drawer.howCharged', 'How it charges')}>{f.details(plan)}</Row>
              <Row label={t('admin.payments.plans.form.defaultPlan', 'Default Plan')}>{plan.is_default ? yes : no}</Row>
              <Row label={t('admin.payments.plans.form.autoDetectionEnabled', 'Auto-Detection Enabled')}>{plan.auto_detect_enabled ? yes : no}</Row>
            </dl>
          </Section>
          {plan.plan_description && (
            <Section title={t('admin.payments.plans.form.planDescription', 'Description')}>
              <p className="m-0 whitespace-pre-line p-3.5 text-sm text-foreground/85 [overflow-wrap:anywhere]" dir="auto">
                {plan.plan_description}
              </p>
            </Section>
          )}
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          <Link
            href={`/admin/payments/plans/${plan.id}`}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t('admin.payments.plans.drawer.edit', 'Edit plan')}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            disabled={used > 0}
            title={used > 0 ? t('admin.payments.plans.drawer.inUse', 'Enrollments use this plan, so it can\'t be deleted. Turn it off instead.') : undefined}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-card px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('admin.products.wizard.delete', 'Delete')}
          </button>
          {used > 0 && (
            <p className="m-0 text-center text-[13px] text-muted-foreground">
              {t('admin.payments.plans.drawer.inUse', 'Enrollments use this plan, so it can\'t be deleted. Turn it off instead.')}
            </p>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-xl'}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <h3 className="bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-end font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
