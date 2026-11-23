'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { BlockedNote, kitButton } from '@/components/admin/notifications/kit';

/**
 * Step-by-step editing, as in the payment plan wizard: Continue (or a jump
 * forward from the step list) stops on a step whose required fields are
 * missing or wrong, with the reason in red by each field. `check(step)`
 * returns that step's errors; `checkAll()` is for saving.
 */
export function useStepWizard<S extends string>(steps: readonly S[], check: (step: S) => Record<string, string>, initial?: string | null) {
  const { t } = useAdminLanguage();
  const [step, setStep] = useState<S>(() => (initial && (steps as readonly string[]).includes(initial) ? (initial as S) : steps[0]));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);

  const fail = (s: S, e: Record<string, string>) => {
    setStep(s);
    setErrors(e);
    setBlocked(t('admin.coaching.common.fixErrors', 'Some fields need attention. The reason is shown in red next to each one.'));
    return false;
  };

  const go = (target: S) => {
    const from = steps.indexOf(step);
    const to = steps.indexOf(target);
    if (to > from) {
      for (const s of steps.slice(from, to)) {
        const e = check(s);
        if (Object.keys(e).length) return fail(s, e);
      }
    }
    setErrors({});
    setBlocked(null);
    setStep(target);
    return true;
  };

  /** Every step's checks; on a problem, opens that step. */
  const checkAll = () => {
    for (const s of steps) {
      const e = check(s);
      if (Object.keys(e).length) return fail(s, e);
    }
    return true;
  };

  /** A field changed: its message goes away. */
  const clearError = (key: string) => {
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
    setBlocked(null);
  };

  const reset = () => {
    setErrors({});
    setBlocked(null);
  };

  return { step, go, checkAll, errors, setErrors, blocked, setBlocked, clearError, reset, fail };
}

/** The steps header, the step's content, the "fix these" note and Back / Continue. */
export function StepWizard<S extends string>({
  steps,
  step,
  labels,
  onGo,
  blocked,
  title,
  lead,
  titleAction,
  children,
}: {
  steps: readonly S[];
  step: S;
  labels: Record<S, string>;
  onGo: (s: S) => void;
  blocked: string | null;
  title: string;
  lead?: string;
  /** A button on the title's row (the end side), e.g. "Upload material". */
  titleAction?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useAdminLanguage();
  const index = Math.max(0, steps.indexOf(step));
  return (
    <>
      <header className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary">
            {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}').replace('{n}', String(index + 1)).replace('{total}', String(steps.length))}
          </span>
          <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>
          {steps.map((s, i) => (
            <i key={s} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-primary' : 'bg-primary/15'}`} />
          ))}
        </div>
        <ol className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {steps.map((s, i) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                onClick={() => onGo(s)}
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
                {labels[s]}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold [font-family:inherit]">{title}</h2>
            {lead && <p className="mt-1 text-sm text-muted-foreground">{lead}</p>}
          </div>
          {titleAction && <div className="shrink-0">{titleAction}</div>}
        </div>
        <div className="grid gap-5">{children}</div>

        <div className="mt-6">
          <BlockedNote text={blocked} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {index > 0 ? (
            <button type="button" onClick={() => onGo(steps[index - 1])} className={kitButton.back}>
              {t('admin.notifications.wizard.back', 'Back')}
            </button>
          ) : (
            <span />
          )}
          {index < steps.length - 1 && (
            <button type="button" onClick={() => onGo(steps[index + 1])} className={kitButton.primary}>
              {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', labels[steps[index + 1]])}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

/** A labelled field with its red reason under it. */
export function WizardField({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5 text-sm">
      <label htmlFor={htmlFor} className="font-semibold">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
