'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';

/**
 * The course builder's only kind of window: a panel that slides in from the
 * side (left in Hebrew), with a pinned top, a scrolling middle and pinned
 * buttons at the bottom. The builder has no pop-up dialogs.
 */
export function SidePanel({
  open,
  onClose,
  title,
  description,
  top,
  children,
  footer,
  wide,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  /** Anything else pinned under the title (a switch, steps). */
  top?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** A wider panel, for content that sits side by side. */
  wide?: boolean;
  /** While saving, the panel can't be closed. */
  busy?: boolean;
}) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  return (
    <Sheet open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className={`flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none [&>[data-default-close]]:hidden ${wide ? 'sm:max-w-[780px]' : 'sm:max-w-[540px]'}`}
      >
        <header className="relative shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-4 pt-5">
          <SheetTitle className="pe-12 text-[22px] font-extrabold leading-tight [font-family:inherit] [overflow-wrap:anywhere]">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="mt-1 pe-12 text-sm text-muted-foreground">{description}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{typeof title === 'string' ? title : ''}</SheetDescription>
          )}
          {top && <div className="mt-3 space-y-3">{top}</div>}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('common.close', 'Close')}
            className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-card px-6 py-4">{footer}</footer>}
      </SheetContent>
    </Sheet>
  );
}

export const panelPrimary =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60';
export const panelSecondary =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold hover:bg-muted disabled:opacity-60';
export const panelDanger =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60';

/** "Delete X?" asked in place, as a red box with Yes / Cancel, instead of a pop-up. */
export function InlineConfirm({
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  text: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div role="alertdialog" className="rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-900 dark:bg-red-950/30">
      <p className="text-sm font-semibold text-red-900 dark:text-red-200">{text}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
