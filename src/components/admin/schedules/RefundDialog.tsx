'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { joinedBar, joinedSegment, kitButton } from '@/components/admin/notifications/kit';

export type RefundTarget = {
  /** The payment (schedule row) id: the refund route takes it. */
  id: string;
  user_name: string;
  product_name: string;
  amount: number;
  currency: string;
  /** Already refunded, if any. */
  refunded?: number;
  payment_number?: number | null;
};

/**
 * Refunding one payment (the old Transactions refund, same request): full
 * or partial, an amount up to what can still be refunded, and a reason.
 * The button says exactly how much goes back, and the dialog says it can't
 * be undone.
 */
export function RefundDialog({ target, onClose, onDone }: { target: RefundTarget | null; onClose: () => void; onDone: () => void }) {
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const [type, setType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});
  const [saving, setSaving] = useState(false);

  const max = target ? Math.max(0, Number(target.amount) - Number(target.refunded || 0)) : 0;
  useEffect(() => {
    if (!target) return;
    setType('full');
    setAmount(String(max));
    setReason('');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  if (!target) return null;
  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: target.currency || 'USD' }).format(n || 0);
    } catch {
      return `${n}`;
    }
  };
  const value = type === 'full' ? max : Number(amount);

  const submit = async () => {
    const e: typeof errors = {};
    if (type === 'partial' && (!(value > 0) || value > max))
      e.amount = t('admin.payments.refund.errAmount', 'Write an amount between 0.01 and {max}.').replace('{max}', money(max));
    if (!reason.trim()) e.reason = t('admin.payments.refund.errReason', 'Write why the money is being refunded.');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/payments/transactions/${target.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, reason: reason.trim(), is_full_refund: type === 'full' }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to process refund');
      }
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.transactions.refund.success', 'Refund processed successfully') });
      onDone();
    } catch (error: any) {
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.transactions.refund.error', 'Failed to process refund'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const field = 'h-11 w-full rounded-lg border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]';
  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent dir={direction} className="max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="[font-family:inherit]">
            {t('admin.payments.refund.title', 'Refund {name}').replace('{name}', target.user_name)}
          </DialogTitle>
          <DialogDescription>
            {target.product_name}
            {target.payment_number ? ` · ${t('admin.payments.schedules.drawer.paymentN', 'Payment {n}').replace('{n}', String(target.payment_number))}` : ''}
            {' · '}
            {t('admin.payments.refund.paid', 'paid {amount}').replace('{amount}', money(Number(target.amount)))}
            {target.refunded ? ` · ${t('admin.payments.refund.already', '{amount} already refunded').replace('{amount}', money(Number(target.refunded)))}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={joinedBar} role="radiogroup">
            {(['full', 'partial'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={type === k}
                onClick={() => {
                  setType(k);
                  setErrors({});
                }}
                className={`${joinedSegment(type === k)} px-4`}
              >
                {k === 'full' ? t('admin.payments.transactions.refund.fullRefund', 'Full Refund') : t('admin.payments.transactions.refund.partialRefund', 'Partial Refund')}
              </button>
            ))}
          </div>

          {type === 'partial' && (
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{t('admin.payments.transactions.refund.amount', 'Refund Amount')}</span>
              <input
                type="number"
                min="0.01"
                max={max}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${field} ${errors.amount ? 'border-red-500' : 'border-border'}`}
              />
              {errors.amount ? (
                <span className="mt-1 block text-[13px] font-semibold text-red-700 dark:text-red-400">{errors.amount}</span>
              ) : (
                <span className="mt-1 block text-[13px] text-muted-foreground">
                  {t('admin.payments.transactions.refund.maximum', 'Maximum')}: {money(max)}
                </span>
              )}
            </label>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">{t('common.reason', 'Reason')}</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.transactions.refund.reasonPlaceholder', 'Enter reason for refund...')}
              className={`${field} ${errors.reason ? 'border-red-500' : 'border-border'}`}
            />
            {errors.reason && <span className="mt-1 block text-[13px] font-semibold text-red-700 dark:text-red-400">{errors.reason}</span>}
          </label>

          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13.5px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('admin.payments.refund.warning', 'The money goes back to the card it was paid with, through Stripe. A refund cannot be undone.')}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={kitButton.secondary}>
            {t('admin.payments.schedules.confirm.notNow', 'Not now')}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || max <= 0}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.payments.refund.button', 'Refund {amount}').replace('{amount}', money(value > 0 ? value : 0))}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
