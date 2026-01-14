'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

export type WizardStep = 'profile' | 'signature' | 'payment' | 'password' | 'complete';

interface StepConfig {
  key: WizardStep;
  labelKey: string;
  shortLabelKey: string;
  order: number;
}

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
  showSignature: boolean;
  showPayment: boolean;
  showPassword: boolean;
}

const ALL_STEPS: StepConfig[] = [
  { key: 'profile', labelKey: 'enrollment.wizard.steps.profile.long', shortLabelKey: 'enrollment.wizard.steps.profile', order: 1 },
  { key: 'signature', labelKey: 'enrollment.wizard.steps.signature.long', shortLabelKey: 'enrollment.wizard.steps.signature', order: 2 },
  { key: 'payment', labelKey: 'enrollment.wizard.steps.payment.long', shortLabelKey: 'enrollment.wizard.steps.payment', order: 3 },
  { key: 'password', labelKey: 'enrollment.wizard.steps.password.long', shortLabelKey: 'enrollment.wizard.steps.password', order: 4 },
  { key: 'complete', labelKey: 'enrollment.wizard.steps.complete.long', shortLabelKey: 'enrollment.wizard.steps.complete', order: 5 },
];

export default function WizardStepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
  showSignature,
  showPayment,
  showPassword,
}: WizardStepIndicatorProps) {
  const { t } = useLanguage();

  // Filter steps based on what's required
  const visibleSteps = ALL_STEPS.filter(step => {
    if (step.key === 'signature' && !showSignature) return false;
    if (step.key === 'payment' && !showPayment) return false;
    if (step.key === 'password' && !showPassword) return false;
    return true;
  });

  const getStepState = (step: WizardStep): 'completed' | 'current' | 'pending' => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const isClickable = (step: WizardStep): boolean => {
    // Can only click on completed steps (to go back and edit)
    return completedSteps.includes(step) && step !== currentStep;
  };

  // Helper function to get translated labels
  const getStepLabel = (step: StepConfig): string => {
    const fallbacks: Record<WizardStep, string> = {
      profile: 'Contact Information',
      signature: 'Sign Agreement',
      payment: 'Payment',
      password: 'Create Account',
      complete: 'Welcome'
    };
    return t(step.labelKey, fallbacks[step.key]);
  };

  const getStepShortLabel = (step: StepConfig): string => {
    const fallbacks: Record<WizardStep, string> = {
      profile: 'Contact',
      signature: 'Sign',
      payment: 'Payment',
      password: 'Account',
      complete: 'Welcome'
    };
    return t(step.shortLabelKey, fallbacks[step.key]);
  };

  return (
    <div className="w-full py-6 px-2 sm:px-4">
      {/* Mobile: Vertical Steps */}
      <div className="sm:hidden space-y-4">
        {visibleSteps.map((step, index) => {
          const state = getStepState(step.key);
          const clickable = isClickable(step.key);

          return (
            <div key={step.key} className="flex items-center gap-3">
              <button
                onClick={() => clickable && onStepClick?.(step.key)}
                disabled={!clickable}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0
                  transition-all duration-300 shadow-sm
                  ${state === 'completed'
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                    : state === 'current'
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-4 ring-primary/20 scale-110'
                    : 'bg-muted text-muted-foreground'
                  }
                  ${clickable ? 'hover:scale-105 cursor-pointer' : ''}
                  ${!clickable && state !== 'current' ? 'cursor-not-allowed opacity-60' : ''}
                `}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {state === 'completed' ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </button>
              <div className="flex-1">
                <div
                  className={`
                    text-sm font-semibold transition-colors
                    ${state === 'current' ? 'text-primary' : state === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'}
                  `}
                >
                  {getStepLabel(step)}
                </div>
                {state === 'current' && (
                  <div className="text-xs text-muted-foreground mt-0.5">{t('enrollment.wizard.steps.current', 'Current step')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Steps */}
      <div className="hidden sm:flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const state = getStepState(step.key);
          const clickable = isClickable(step.key);

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  onClick={() => clickable && onStepClick?.(step.key)}
                  disabled={!clickable}
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center font-bold text-base
                    transition-all duration-300 shadow-lg
                    ${state === 'completed'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl'
                      : state === 'current'
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-4 ring-primary/20 shadow-2xl scale-110'
                      : 'bg-muted text-muted-foreground shadow-md'
                    }
                    ${clickable ? 'hover:scale-105 cursor-pointer' : ''}
                    ${!clickable && state !== 'current' ? 'cursor-not-allowed opacity-60' : ''}
                  `}
                  aria-current={state === 'current' ? 'step' : undefined}
                  aria-label={`${getStepLabel(step)}${state === 'completed' ? ' - Completed' : state === 'current' ? ' - Current step' : ' - Not started'}`}
                >
                  {state === 'completed' ? (
                    <Check className="w-7 h-7" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-3 text-center px-2">
                  <div
                    className={`
                      text-sm font-semibold transition-colors whitespace-nowrap
                      ${state === 'current' ? 'text-primary' : state === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'}
                    `}
                  >
                    {getStepShortLabel(step)}
                  </div>
                  {state === 'current' && (
                    <div className="text-xs text-muted-foreground mt-1">{t('enrollment.wizard.steps.current.short', 'Current')}</div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < visibleSteps.length - 1 && (
                <div className="flex-1 h-1 mx-3 -mt-16 min-w-[40px] max-w-[120px]">
                  <div
                    className={`
                      h-full rounded-full transition-all duration-500
                      ${completedSteps.includes(step.key)
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : 'bg-muted'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
