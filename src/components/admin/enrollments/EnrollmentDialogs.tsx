'use client';

/**
 * The enrollment dialogs that used to live inside the Enrollments page:
 * cancel (with reason and optional refund), record a manual payment (now
 * for a specific payment from the drawer's schedule) and reset the
 * enrollment wizard. Same fields, wording and requests as before.
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminLanguage } from '@/context/AppContext';
import type { Enrollment, ScheduleItem } from './types';

// Cancel Enrollment Dialog
export function CancelEnrollmentDialog({
  open,
  enrollment,
  onClose,
  onCancel,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onCancel: (enrollmentId: string, reason: string, refundAmount?: number) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [includeRefund, setIncludeRefund] = useState(false);

  useEffect(() => {
    if (enrollment) {
      setReason('');
      setRefundAmount(enrollment.paid_amount);
      setIncludeRefund(false);
    }
  }, [enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollment) {
      onCancel(enrollment.id, reason, includeRefund ? refundAmount : undefined);
    }
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.cancel.title', 'Cancel Enrollment')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.cancel.description', 'Cancel {user}\'s enrollment in {product}')
              .replace('{user}', enrollment.user_name)
              .replace('{product}', enrollment.product_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {t('admin.enrollments.cancel.alert', 'This action will cancel all future scheduled payments for this enrollment.')}
            </AlertDescription>
          </Alert>

          <div>
            <Label>{t('admin.enrollments.cancel.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.enrollments.cancel.reasonPlaceholder', 'e.g., User requested cancellation')}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include_refund"
              checked={includeRefund}
              onChange={(e) => setIncludeRefund(e.target.checked)}
            />
            <Label htmlFor="include_refund">{t('admin.enrollments.cancel.processRefund', 'Process refund')}</Label>
          </div>

          {includeRefund && (
            <div>
              <Label>{t('admin.enrollments.cancel.refundAmount', 'Refund Amount')}</Label>
              <Input
                type="number"
                min="0"
                max={enrollment.paid_amount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.enrollments.cancel.maximum', 'Maximum')}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: enrollment.currency }).format(enrollment.paid_amount)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="destructive">
              {t('admin.enrollments.cancel.cancelButton', 'Cancel Enrollment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Manual Payment Dialog
export function ManualPaymentDialog({
  open,
  enrollment,
  schedule,
  scheduleLabel,
  onClose,
  onRecord,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  /** The payment being recorded (from the drawer's schedule). */
  schedule: ScheduleItem | null;
  /** e.g. "Payment 5 · $224", shown in the dialog. */
  scheduleLabel?: string;
  onClose: () => void;
  onRecord: (enrollmentId: string, scheduleId: string, paymentMethod: string, reference: string, notes: string) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollment && schedule) {
      onRecord(enrollment.id, schedule.id, paymentMethod, reference, notes);
    }
  };

  if (!enrollment || !schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.manualPayment.title', 'Record Manual Payment')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.manualPayment.description', 'Record an offline payment for {user}')
              .replace('{user}', enrollment.user_name)}
            {scheduleLabel ? <span className="mt-1 block font-semibold text-foreground">{scheduleLabel}</span> : null}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('admin.enrollments.manualPayment.paymentMethod', 'Payment Method')}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} dir={direction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="bank_transfer">{t('admin.enrollments.manualPayment.bankTransfer', 'Bank Transfer')}</SelectItem>
                <SelectItem value="cash">{t('admin.enrollments.manualPayment.cash', 'Cash')}</SelectItem>
                <SelectItem value="check">{t('admin.enrollments.manualPayment.check', 'Check')}</SelectItem>
                <SelectItem value="other">{t('admin.enrollments.manualPayment.other', 'Other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('admin.enrollments.manualPayment.reference', 'Transaction Reference')}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('admin.enrollments.manualPayment.referencePlaceholder', 'e.g., TXN-12345')}
              required
            />
          </div>

          <div>
            <Label>{t('admin.enrollments.manualPayment.notes', 'Notes')}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin.enrollments.manualPayment.notesPlaceholder', 'Additional notes')}
            />
          </div>

          <Alert>
            <AlertDescription>
              {t('admin.enrollments.manualPayment.alert', 'This will mark the payment as completed without processing through Stripe.')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit">
              {t('admin.enrollments.manualPayment.recordButton', 'Record Payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Reset Enrollment Dialog
export function ResetEnrollmentDialog({
  open,
  enrollment,
  onClose,
  onReset,
  resetting,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onReset: (resetSignature: boolean, resetPayment: boolean) => void;
  resetting: boolean;
}) {
  const { t, direction } = useAdminLanguage();
  const [resetSignature, setResetSignature] = useState(true);
  const [resetPayment, setResetPayment] = useState(true);

  useEffect(() => {
    if (enrollment) {
      setResetSignature(true);
      setResetPayment(true);
    }
  }, [enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReset(resetSignature, resetPayment);
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {t('admin.enrollments.reset.title', 'Reset Enrollment Wizard')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.enrollments.reset.description', 'Reset the enrollment wizard for {user} to allow them to go through the steps again')
              .replace('{user}', enrollment.user_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertDescription suppressHydrationWarning>
              {t('admin.enrollments.reset.info', 'This will reset the enrollment status to "pending" and allow the user to restart the enrollment wizard.')}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset_signature"
                checked={resetSignature}
                onChange={(e) => setResetSignature(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="reset_signature" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetSignature', 'Reset DocuSign signature status')}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset_payment"
                checked={resetPayment}
                onChange={(e) => setResetPayment(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="reset_payment" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetPayment', 'Reset payment status (paid amount to 0)')}
              </Label>
            </div>

            <div className="flex items-center gap-2 opacity-50">
              <input
                type="checkbox"
                id="reset_profile"
                checked={true}
                disabled
                className="rounded"
              />
              <Label htmlFor="reset_profile" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetProfile', 'Reset profile onboarding flags')} ({t('admin.enrollments.reset.always', 'always enabled')})
              </Label>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertDescription suppressHydrationWarning>
              {resetPayment && t('admin.enrollments.reset.warning', 'Warning: Resetting payment will set paid_amount to 0. This cannot be undone!')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={resetting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={resetting} suppressHydrationWarning>
              {resetting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('admin.enrollments.reset.resetting', 'Resetting...')}
                </>
              ) : (
                t('admin.enrollments.reset.button', 'Reset Enrollment')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
