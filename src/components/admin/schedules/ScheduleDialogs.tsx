'use client';

/**
 * The payment-schedule dialogs that used to live inside the Schedules page:
 * adjust a payment's date, restructure an enrollment's plan, record a
 * manual (offline) payment, and record an off-schedule payment. Same
 * fields, checks, wording and requests as before.
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, CheckCircle2, Clock, X, XCircle } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import type { PaymentSchedule } from './types';

export function AdjustDateDialog({
  open,
  schedule,
  onClose,
  onAdjust,
  direction,
}: {
  open: boolean;
  schedule: PaymentSchedule | null;
  onClose: () => void;
  onAdjust: (scheduleId: string, newDate: string, reason: string) => void;
  direction: 'ltr' | 'rtl';
}) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ date?: string; reason?: string }>({});

  useEffect(() => {
    if (schedule) {
      setNewDate(schedule.scheduled_date.split('T')[0]);
      setReason('');
      setErrors({});
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate date
    if (!newDate) {
      setErrors({ date: t('admin.payments.schedules.errorDateRequired', 'Please select a new date') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorDateRequired', 'Please select a new date'),
        variant: 'destructive',
      });
      return;
    }

    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrors({ date: t('admin.payments.schedules.errorDatePast', 'Date cannot be in the past') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorDatePast', 'Date cannot be in the past'),
        variant: 'destructive',
      });
      return;
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      setErrors({ reason: t('admin.payments.schedules.errorReasonRequired', 'Please provide a reason for adjustment') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorReasonRequired', 'Please provide a reason for adjustment'),
        variant: 'destructive',
      });
      return;
    }

    if (reason.trim().length < 5) {
      setErrors({ reason: t('admin.payments.schedules.errorReasonTooShortAdjust', 'Reason must be at least 5 characters') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorReasonTooShortAdjust', 'Reason must be at least 5 characters'),
        variant: 'destructive',
      });
      return;
    }

    if (schedule) {
      onAdjust(schedule.id, newDate, reason);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('admin.payments.schedules.adjustPaymentDate', 'Adjust Payment Date')}</DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.payments.schedules.changeScheduledDate', "Change the scheduled date for {name}'s payment #{number}")
              .replace('{name}', schedule.user_name)
              .replace('{number}', schedule.payment_number.toString())}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label suppressHydrationWarning>{t('admin.payments.schedules.newDate', 'New Date')}</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                if (errors.date) setErrors({ ...errors, date: undefined });
              }}
              className={errors.date ? 'border-destructive' : ''}
            />
            {errors.date && (
              <p className="text-xs text-destructive mt-1">{errors.date}</p>
            )}
          </div>
          <div>
            <Label suppressHydrationWarning>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors({ ...errors, reason: undefined });
              }}
              placeholder={t('admin.payments.schedules.reasonPlaceholder', 'e.g., User requested extension')}
              className={errors.reason ? 'border-destructive' : ''}
            />
            {errors.reason && (
              <p className="text-xs text-destructive mt-1">{errors.reason}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit">
              <span suppressHydrationWarning>{t('admin.payments.schedules.adjustDate', 'Adjust Date')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Delay Dialog Component

export function RestructurePlanDialog({
  open,
  enrollmentId,
  schedules,
  onClose,
  onRestructure,
  direction,
}: {
  open: boolean;
  enrollmentId: string | null;
  schedules: PaymentSchedule[];
  onClose: () => void;
  onRestructure: (enrollmentId: string, newInstallmentCount: number, startDate: string, reason: string) => void;
  direction: 'ltr' | 'rtl';
}) {
  const { t, language } = useAdminLanguage();
  const { toast } = useToast();
  const [newInstallmentCount, setNewInstallmentCount] = useState(12);
  const [startDate, setStartDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ installments?: string; startDate?: string; reason?: string }>({});
  const [previewData, setPreviewData] = useState<{
    currentPaid: number;
    currentPending: number;
    currentTotal: number;
    remainingBalance: number;
    newInstallmentAmount: number;
    willCreate: number;
    willCancel: number;
  } | null>(null);

  // Set default start date when dialog opens
  useEffect(() => {
    if (open && schedules.length > 0) {
      const paidSchedules = schedules.filter(s => s.status === 'paid');
      let defaultDate: Date;

      if (paidSchedules.length > 0) {
        // Start from one month after the last paid date
        const lastPaidSchedule = paidSchedules[paidSchedules.length - 1];
        defaultDate = new Date(lastPaidSchedule.scheduled_date);
        defaultDate.setMonth(defaultDate.getMonth() + 1);
      } else {
        // Start from next month
        defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        defaultDate.setDate(1); // First day of next month
      }

      setStartDate(defaultDate.toISOString().split('T')[0]);
      setErrors({});
    }
  }, [open, schedules]);

  useEffect(() => {
    if (!enrollmentId || schedules.length === 0) return;

    const paidSchedules = schedules.filter(s => s.status === 'paid');
    const pendingSchedules = schedules.filter(s => ['pending', 'overdue', 'adjusted'].includes(s.status));

    const currentPaid = paidSchedules.length;
    const currentPending = pendingSchedules.length;
    const currentTotal = schedules.length;

    // Calculate remaining balance
    const paidAmount = paidSchedules.reduce((sum, s) => sum + s.amount, 0);
    const totalAmount = schedules.reduce((sum, s) => sum + s.amount, 0);
    const remainingBalance = totalAmount - paidAmount;

    // Calculate new installment amount
    const newInstallmentAmount = remainingBalance / newInstallmentCount;

    // Determine what will happen
    const willCreate = Math.max(0, newInstallmentCount - currentPending);
    const willCancel = Math.max(0, currentPending - newInstallmentCount);

    setPreviewData({
      currentPaid,
      currentPending,
      currentTotal,
      remainingBalance,
      newInstallmentAmount,
      willCreate,
      willCancel,
    });
  }, [enrollmentId, schedules, newInstallmentCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate installment count
    if (!newInstallmentCount || newInstallmentCount < 1) {
      setErrors({ installments: t('admin.payments.schedules.errorInstallmentRequired', 'Please enter a valid number of installments') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorInstallmentRequired', 'Please enter a valid number of installments'),
        variant: 'destructive',
      });
      return;
    }

    if (newInstallmentCount > 100) {
      setErrors({ installments: t('admin.payments.schedules.errorInstallmentMax', 'Maximum 100 installments allowed') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorInstallmentMax', 'Maximum 100 installments allowed'),
        variant: 'destructive',
      });
      return;
    }

    // Validate start date
    if (!startDate) {
      setErrors({ startDate: t('admin.payments.schedules.errorStartDateRequired', 'Please select a start date') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorStartDateRequired', 'Please select a start date'),
        variant: 'destructive',
      });
      return;
    }

    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrors({ startDate: t('admin.payments.schedules.errorStartDatePast', 'Start date cannot be in the past') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorStartDatePast', 'Start date cannot be in the past'),
        variant: 'destructive',
      });
      return;
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      setErrors({ reason: t('admin.payments.schedules.errorReasonRequired', 'Please provide a reason for restructuring') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorReasonRequired', 'Please provide a reason for restructuring'),
        variant: 'destructive',
      });
      return;
    }

    if (reason.trim().length < 10) {
      setErrors({ reason: t('admin.payments.schedules.errorReasonTooShort', 'Reason must be at least 10 characters') });
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.errorReasonTooShort', 'Reason must be at least 10 characters'),
        variant: 'destructive',
      });
      return;
    }

    if (enrollmentId && previewData) {
      onRestructure(enrollmentId, newInstallmentCount, startDate, reason);
    }
  };

  if (!enrollmentId || schedules.length === 0) return null;

  const formatCurrency = (amount: number) => {
    const currency = schedules[0]?.currency || 'USD';
    return new Intl.NumberFormat(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        style: 'currency',
        currency,
      }
    ).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {t('admin.payments.schedules.restructurePaymentPlan', 'Restructure Payment Plan')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.payments.schedules.restructureDescription', 'Change the number of installments for this enrollment')}
          </DialogDescription>
        </DialogHeader>

        {previewData && (
          <div className="space-y-4">
            {/* Current Status */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-3" suppressHydrationWarning>
                {t('admin.payments.schedules.currentStatus', 'Current Status')}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {t('admin.payments.schedules.totalPayments', 'Total Payments')}:
                  </span>
                  <span className="font-semibold ml-2">{previewData.currentTotal}</span>
                </div>
                <div>
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {t('admin.payments.schedules.paidPayments', 'Paid')}:
                  </span>
                  <span className="font-semibold ml-2 text-green-600">{previewData.currentPaid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {t('admin.payments.schedules.pendingPayments', 'Pending')}:
                  </span>
                  <span className="font-semibold ml-2 text-yellow-600">{previewData.currentPending}</span>
                </div>
                <div>
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {t('admin.payments.schedules.remainingBalance', 'Remaining Balance')}:
                  </span>
                  <span className="font-semibold ml-2">{formatCurrency(previewData.remainingBalance)}</span>
                </div>
              </div>
            </div>

            {/* New Plan Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label suppressHydrationWarning>
                  {t('admin.payments.schedules.newNumberOfInstallments', 'New Number of Installments')}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newInstallmentCount}
                  onChange={(e) => {
                    setNewInstallmentCount(Number(e.target.value));
                    if (errors.installments) setErrors({ ...errors, installments: undefined });
                  }}
                  className={errors.installments ? 'border-destructive' : ''}
                />
                {errors.installments && (
                  <p className="text-xs text-destructive mt-1">{errors.installments}</p>
                )}
                {!errors.installments && (
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.payments.schedules.currentInstallments', 'Current: {count} installments').replace('{count}', previewData.currentPending.toString())}
                  </p>
                )}
              </div>

              {/* Start Date Input */}
              <div>
                <Label suppressHydrationWarning>
                  {t('admin.payments.schedules.paymentStartDate', 'Payment Start Date')}
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors({ ...errors, startDate: undefined });
                  }}
                  className={errors.startDate ? 'border-destructive' : ''}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive mt-1">{errors.startDate}</p>
                )}
                {!errors.startDate && (
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.payments.schedules.firstPaymentWillBe', 'First payment will be scheduled for this date')}
                  </p>
                )}
              </div>

              {/* Preview of Changes */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold" suppressHydrationWarning>
                      {t('admin.payments.schedules.whatWillHappen', 'What will happen:')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li suppressHydrationWarning>
                        {t('admin.payments.schedules.newInstallmentAmount', 'Each new installment: {amount}')
                          .replace('{amount}', formatCurrency(previewData.newInstallmentAmount))}
                      </li>
                      {previewData.willCancel > 0 && (
                        <li className="text-orange-600" suppressHydrationWarning>
                          {t('admin.payments.schedules.willCancelSchedules', 'Will cancel {count} pending schedule(s)')
                            .replace('{count}', previewData.willCancel.toString())}
                        </li>
                      )}
                      {previewData.willCreate > 0 && (
                        <li className="text-green-600" suppressHydrationWarning>
                          {t('admin.payments.schedules.willCreateSchedules', 'Will create {count} new schedule(s)')
                            .replace('{count}', previewData.willCreate.toString())}
                        </li>
                      )}
                      <li suppressHydrationWarning>
                        {t('admin.payments.schedules.paidPaymentsUntouched', 'Paid payments will not be affected')}
                      </li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label suppressHydrationWarning>{t('common.reason', 'Reason')}</Label>
                <Input
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) setErrors({ ...errors, reason: undefined });
                  }}
                  placeholder={t('admin.payments.schedules.restructureReasonPlaceholder', 'e.g., User requested payment plan adjustment')}
                  className={errors.reason ? 'border-destructive' : ''}
                />
                {errors.reason && (
                  <p className="text-xs text-destructive mt-1">{errors.reason}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
                </Button>
                <Button type="submit">
                  <span suppressHydrationWarning>{t('admin.payments.schedules.applyRestructure', 'Apply Restructure')}</span>
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Record Manual Payment Dialog — wires the existing recordManualPayment
// backend (POST /api/admin/payments/schedules/:id/record-payment) to a
// per-row action on the schedules page. Used when a customer paid via
// ACH / wire / cash / check — anything that didn't flow through Stripe.
// Backend already does the reconciliation (flips schedule to 'paid',
// bumps enrollment.paid_amount, updates payment_status).

export function RecordManualPaymentDialog({
  open,
  schedule,
  onClose,
  onRecord,
}: {
  open: boolean;
  schedule: PaymentSchedule | null;
  onClose: () => void;
  onRecord: (
    scheduleId: string,
    payload: { payment_method: string; transaction_reference?: string; notes?: string },
  ) => Promise<void>;
}) {
  const { t } = useAdminLanguage();
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever the dialog closes so the next open starts clean.
  useEffect(() => {
    if (!open) {
      setPaymentMethod('bank_transfer');
      setTransactionReference('');
      setNotes('');
      setSubmitting(false);
    }
  }, [open]);

  if (!schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRecord(schedule.id, {
        payment_method: paymentMethod,
        transaction_reference: transactionReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {t('admin.payments.schedules.recordManualTitle', 'Record manual payment')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t(
              'admin.payments.schedules.recordManualDescription',
              'Mark this scheduled payment as received via an offline method (ACH, wire, cash, check). The schedule will be set to paid and the enrollment balance updated.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Read-only summary */}
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.schedules.recordManualAmount', 'Amount')}
              </span>
              <span className="font-semibold tabular-nums">
                {schedule.currency} {Number(schedule.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.schedules.recordManualCustomer', 'Customer')}
              </span>
              <span>{schedule.user_name || schedule.user_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.schedules.recordManualProduct', 'Product')}
              </span>
              <span className="truncate ms-2">{schedule.product_name}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="manual-method" suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualMethod', 'Payment method')}
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="manual-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodBank', 'Bank transfer / ACH')}
                </SelectItem>
                <SelectItem value="cash" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodCash', 'Cash')}
                </SelectItem>
                <SelectItem value="check" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodCheck', 'Check')}
                </SelectItem>
                <SelectItem value="other" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodOther', 'Other')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="manual-ref" suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualRef', 'Reference (transaction / check #)')}
            </Label>
            <Input
              id="manual-ref"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder={t('admin.payments.schedules.recordManualRefPlaceholder', 'e.g. WIRE-2026-04-12-89321') as string}
            />
          </div>

          <div>
            <Label htmlFor="manual-notes" suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualNotes', 'Notes (optional)')}
            </Label>
            <Input
              id="manual-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin.payments.schedules.recordManualNotesPlaceholder', 'Internal context for this payment') as string}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit" disabled={submitting}>
              <span suppressHydrationWarning>
                {submitting
                  ? t('admin.payments.schedules.recordManualSubmitting', 'Recording…')
                  : t('admin.payments.schedules.recordManualSubmit', 'Record payment')}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Record an off-schedule (standalone) manual payment.
 *
 * Workflow:
 *   1. Admin searches a customer by email (/api/admin/users/search).
 *   2. After picking a customer, recent enrollments load via
 *      /api/admin/payments/enrollments-by-user. Picking one links the
 *      payment to that enrollment (paid_amount rolls up). Leaving the
 *      picker blank logs a contact-only payment.
 *   3. Amount / currency / method / reference / notes.
 *   4. Submit → POST /api/admin/payments/record-standalone.
 *
 * No payment_schedules row is touched.
 */

type CustomerHit = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};
type EnrollmentHit = {
  id: string;
  product_name: string;
  status: string;
  paid_amount: number;
  total_amount: number;
  currency: string;
  payment_status: string | null;
};
export function RecordStandalonePaymentDialog({
  open,
  onClose,
  onRecorded,
}: {
  open: boolean;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerHits, setCustomerHits] = useState<CustomerHit[]>([]);
  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [enrollments, setEnrollments] = useState<EnrollmentHit[]>([]);
  // Sentinel for "no enrollment" — Radix Select rejects empty-string
  // values (reserved for clearing). We translate sentinel → null at
  // submit time.
  const NO_ENROLLMENT = '__none';
  const [enrollmentId, setEnrollmentId] = useState<string>(NO_ENROLLMENT);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCustomerQuery('');
      setCustomerHits([]);
      setCustomer(null);
      setEnrollments([]);
      setEnrollmentId(NO_ENROLLMENT);
      setAmount('');
      setCurrency('USD');
      setPaymentMethod('bank_transfer');
      setTransactionReference('');
      setNotes('');
      setSubmitting(false);
    }
  }, [open]);

  // Debounced customer search — 350ms is the sweet spot for type-then-pause.
  useEffect(() => {
    if (customer || customerQuery.trim().length < 3) {
      setCustomerHits([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const res = await fetch(
          `/api/admin/users/search?email=${encodeURIComponent(customerQuery.trim())}`,
          { signal: ctrl.signal },
        );
        const j = await res.json();
        setCustomerHits((j.users as CustomerHit[]) ?? []);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setSearchingCustomer(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [customerQuery, customer]);

  useEffect(() => {
    if (!customer) {
      setEnrollments([]);
      setEnrollmentId(NO_ENROLLMENT);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEnrollments(true);
      try {
        const res = await fetch(
          `/api/admin/payments/enrollments-by-user?user_id=${encodeURIComponent(customer.id)}`,
        );
        const j = await res.json();
        if (!cancelled) setEnrollments((j.enrollments as EnrollmentHit[]) ?? []);
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoadingEnrollments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  const displayName = (u: CustomerHit) =>
    [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    const amt = parseFloat(amount);
    if (!(amt > 0)) {
      toast({
        title: t('common.error', 'Error'),
        description: t(
          'admin.payments.schedules.recordStandaloneAmountError',
          'Amount must be greater than zero.',
        ),
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payments/record-standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: customer.id,
          enrollment_id: enrollmentId === NO_ENROLLMENT ? null : enrollmentId,
          amount: amt,
          currency,
          payment_method: paymentMethod,
          transaction_reference: transactionReference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || `HTTP ${res.status}`);
      onRecorded();
    } catch (err: any) {
      toast({
        title: t('common.error', 'Error'),
        description:
          err?.message ||
          t('admin.payments.schedules.recordStandaloneError', 'Failed to record payment'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {t('admin.payments.schedules.recordStandaloneTitle', 'Record off-schedule payment')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t(
              'admin.payments.schedules.recordStandaloneDescription',
              'Log a payment that did not flow through Stripe and is not tied to a scheduled installment. Optionally link it to a specific enrollment so its paid balance updates.',
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Customer picker */}
          <div>
            <Label suppressHydrationWarning>
              {t('admin.payments.schedules.recordStandaloneCustomer', 'Customer')}
            </Label>
            {customer ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                <div>
                  <div className="text-sm font-medium">{displayName(customer)}</div>
                  <div className="text-xs text-muted-foreground">{customer.email}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCustomer(null);
                    setCustomerQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder={
                    t(
                      'admin.payments.schedules.recordStandaloneCustomerPlaceholder',
                      'Search by email (min 3 chars)…',
                    ) as string
                  }
                />
                {searchingCustomer && (
                  <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('common.searching', 'Searching…')}
                  </p>
                )}
                {!searchingCustomer && customerHits.length > 0 && (
                  <div className="mt-1 border rounded-md max-h-48 overflow-y-auto">
                    {customerHits.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => setCustomer(c)}
                      >
                        <div className="font-medium">{displayName(c)}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enrollment picker (optional) */}
          {customer && (
            <div>
              <Label suppressHydrationWarning>
                {t(
                  'admin.payments.schedules.recordStandaloneEnrollment',
                  'Apply to enrollment (optional)',
                )}
              </Label>
              <Select value={enrollmentId} onValueChange={setEnrollmentId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      t(
                        'admin.payments.schedules.recordStandaloneNoEnrollment',
                        'No enrollment (contact-level payment)',
                      ) as string
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ENROLLMENT} suppressHydrationWarning>
                    {t(
                      'admin.payments.schedules.recordStandaloneNoEnrollment',
                      'No enrollment (contact-level payment)',
                    )}
                  </SelectItem>
                  {loadingEnrollments && (
                    <SelectItem value="__loading" disabled>
                      {t('common.loading', 'Loading…')}
                    </SelectItem>
                  )}
                  {enrollments.map((e) => {
                    // payment_status is the more specific signal (paid /
                    // partial / pending / overdue). Falls back to the
                    // enrollment-level status when null. Both are raw
                    // enum values from the DB; the existing convention
                    // (getStatusBadge above) is to translate via
                    // common.<status>.
                    const statusKey = (e.payment_status ?? e.status) as string;
                    return (
                      <SelectItem key={e.id} value={e.id}>
                        {e.product_name} · {e.currency} {e.paid_amount.toFixed(2)}/
                        {e.total_amount.toFixed(2)} · {t(`common.${statusKey}`, statusKey)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!loadingEnrollments && enrollments.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                  {t(
                    'admin.payments.schedules.recordStandaloneNoEnrollments',
                    'This customer has no enrollments yet.',
                  )}
                </p>
              )}
            </div>
          )}

          {/* Amount + currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label htmlFor="standalone-amount" suppressHydrationWarning>
                {t('admin.payments.schedules.recordStandaloneAmount', 'Amount')}
              </Label>
              <Input
                id="standalone-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="standalone-currency" suppressHydrationWarning>
                {t('admin.payments.schedules.recordStandaloneCurrency', 'Currency')}
              </Label>
              <Input
                id="standalone-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <Label suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualMethod', 'Payment method')}
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodBank', 'Bank transfer / ACH')}
                </SelectItem>
                <SelectItem value="cash" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodCash', 'Cash')}
                </SelectItem>
                <SelectItem value="check" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodCheck', 'Check')}
                </SelectItem>
                <SelectItem value="other" suppressHydrationWarning>
                  {t('admin.payments.schedules.recordManualMethodOther', 'Other')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="standalone-ref" suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualRef', 'Reference (transaction / check #)')}
            </Label>
            <Input
              id="standalone-ref"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder={
                t(
                  'admin.payments.schedules.recordManualRefPlaceholder',
                  'e.g. WIRE-2026-04-12-89321',
                ) as string
              }
            />
          </div>

          <div>
            <Label htmlFor="standalone-notes" suppressHydrationWarning>
              {t('admin.payments.schedules.recordManualNotes', 'Notes (optional)')}
            </Label>
            <Input
              id="standalone-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                t(
                  'admin.payments.schedules.recordManualNotesPlaceholder',
                  'Internal context for this payment',
                ) as string
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit" disabled={submitting || !customer || !amount}>
              <span suppressHydrationWarning>
                {submitting
                  ? t('admin.payments.schedules.recordManualSubmitting', 'Recording…')
                  : t('admin.payments.schedules.recordManualSubmit', 'Record payment')}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

