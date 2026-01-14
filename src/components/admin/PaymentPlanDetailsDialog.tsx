'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminLanguage } from '@/context/AppContext';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PaymentSchedule {
  id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_date?: string;
  sequence_number: number;
}

interface Enrollment {
  id: string;
  payment_plan_key: string;
  payment_plan_data?: any;
  payment_model?: string;
  payment_plan?: any;
  total_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  status: 'draft' | 'pending' | 'active' | 'suspended' | 'cancelled' | 'completed';
  next_payment_date?: string;
  payment_start_date?: string;
  enrolled_at?: string;
  created_at?: string;
}

interface PaymentPlanDetailsDialogProps {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
}

export function PaymentPlanDetailsDialog({
  open,
  enrollment,
  onClose,
}: PaymentPlanDetailsDialogProps) {
  const { t, direction } = useAdminLanguage();
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Fetch payment schedules when dialog opens
  useEffect(() => {
    const fetchPaymentSchedules = async () => {
      if (!open || !enrollment?.id) return;

      setLoadingSchedules(true);
      try {
        const response = await fetch(`/api/admin/payment-schedules?enrollment_id=${enrollment.id}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentSchedules(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching payment schedules:', error);
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchPaymentSchedules();
  }, [open, enrollment?.id]);

  if (!enrollment) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0);
  };

  const formatPaymentPlanName = (): string => {
    const key = enrollment.payment_plan_key;
    const data = enrollment.payment_plan_data || {};

    if (key === 'custom' && data.name) {
      return data.name;
    } else if (key === 'admin.enrollments.paymentPlan.oneTime') {
      return t('admin.enrollments.paymentPlan.oneTime', 'One-Time Payment');
    } else if (key === 'admin.enrollments.paymentPlan.deposit') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyKey = `admin.enrollments.paymentPlan.frequency.${frequency}`;
      const frequencyText = t(frequencyKey, frequency);

      // Format deposit info
      let depositInfo = '';
      if (data.deposit_type === 'percentage' && data.deposit_percentage) {
        depositInfo = `${data.deposit_percentage}% ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else if (data.deposit_type === 'fixed' && data.deposit_amount) {
        depositInfo = `${enrollment.currency || 'USD'} ${data.deposit_amount} ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else {
        depositInfo = t('admin.enrollments.paymentPlan.depositLabel', 'Deposit');
      }

      return `${depositInfo} + ${count} ${frequencyText}`;
    } else if (key === 'admin.enrollments.paymentPlan.installments') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyKey = `admin.enrollments.paymentPlan.frequency.${frequency}`;
      const frequencyText = t(frequencyKey, frequency);
      return `${count} ${frequencyText}`;
    } else if (key === 'admin.enrollments.paymentPlan.subscription') {
      const interval = data.interval || 'monthly';
      const intervalKey = `admin.enrollments.paymentPlan.interval.${interval}`;
      const intervalText = t(intervalKey, interval);
      return `${intervalText} ${t('admin.enrollments.paymentPlan.subscriptionLabel', 'Subscription')}`;
    } else if (key === 'admin.enrollments.paymentPlan.free') {
      return t('admin.enrollments.paymentPlan.free', 'Free');
    }
    return t('admin.enrollments.paymentPlan.notAvailable', 'N/A');
  };

  // Extract payment plan details from enrollment
  // Check both payment_plan and payment_plan_data as amounts might be in either field
  const paymentModel = enrollment.payment_model;
  const paymentPlan = {
    ...(enrollment.payment_plan || {}),
    ...(enrollment.payment_plan_data || {}),
  };

  // Calculate installment amount if not already set
  const calculateInstallmentAmount = (): number | null => {
    if (paymentPlan.installment_amount) {
      return paymentPlan.installment_amount;
    }

    // For deposit_then_plan: (total - deposit) / installments
    if (paymentModel === 'deposit_then_plan' && paymentPlan.installments) {
      const depositAmount = paymentPlan.deposit_type === 'percentage'
        ? (enrollment.total_amount * (paymentPlan.deposit_percentage || 0) / 100)
        : (paymentPlan.deposit_amount || 0);

      const remainingAmount = enrollment.total_amount - depositAmount;
      return remainingAmount / paymentPlan.installments;
    }

    return null;
  };

  const installmentAmount = calculateInstallmentAmount();

  // Calculate payment schedule from plan configuration
  const calculatePaymentSchedule = (): { amount: number; dueDate: Date; label: string }[] => {
    const schedule: { amount: number; dueDate: Date; label: string }[] = [];
    // Use enrollment created date as base for deposit, payment_start_date for installments
    const enrollmentDate = new Date(enrollment.enrolled_at || enrollment.created_at || new Date());

    // Parse payment_start_date as local midnight to avoid timezone shifts
    let paymentStartDate: Date;
    if (enrollment.payment_start_date) {
      const dateOnly = enrollment.payment_start_date.split('T')[0];
      // Parse as local midnight (not UTC) so the date stays consistent
      paymentStartDate = new Date(dateOnly + 'T00:00:00');
    } else {
      paymentStartDate = enrollmentDate;
    }

    if (paymentModel === 'one_time') {
      schedule.push({
        amount: enrollment.total_amount,
        dueDate: paymentStartDate,
        label: t('admin.enrollments.paymentPlanDetails.fullPayment', 'Full Payment')
      });
    } else if (paymentModel === 'deposit_then_plan' && paymentPlan.installments) {
      // Calculate deposit
      const depositAmount = paymentPlan.deposit_type === 'percentage'
        ? (enrollment.total_amount * (paymentPlan.deposit_percentage || 0) / 100)
        : (paymentPlan.deposit_amount || 0);

      // Add deposit payment - due on enrollment date
      if (depositAmount > 0) {
        schedule.push({
          amount: depositAmount,
          dueDate: enrollmentDate,
          label: t('admin.enrollments.paymentPlanDetails.depositPayment', 'Deposit')
        });
      }

      // Calculate installment amount
      const remainingAmount = enrollment.total_amount - depositAmount;
      const installmentAmt = remainingAmount / paymentPlan.installments;

      // Add installment payments - starting from payment_start_date
      const frequency = paymentPlan.frequency || 'monthly';
      const customDays = paymentPlan.custom_frequency_days || 30;

      for (let i = 0; i < paymentPlan.installments; i++) {
        const installmentDate = new Date(paymentStartDate);

        // Calculate due date based on frequency using local time methods
        if (frequency === 'weekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 7));
        } else if (frequency === 'biweekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 14));
        } else if (frequency === 'monthly') {
          installmentDate.setMonth(paymentStartDate.getMonth() + i);
        } else if (frequency === 'custom') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * customDays));
        }

        schedule.push({
          amount: installmentAmt,
          dueDate: installmentDate,
          label: `${t('admin.enrollments.paymentPlanDetails.installment', 'Installment')} ${i + 1}`
        });
      }
    } else if (paymentModel === 'subscription' && paymentPlan.subscription_interval) {
      // For subscription, show first 12 payments
      const interval = paymentPlan.subscription_interval;
      const subscriptionAmount = enrollment.total_amount;

      for (let i = 0; i < 12; i++) {
        const paymentDate = new Date(paymentStartDate);

        if (interval === 'weekly') {
          paymentDate.setDate(paymentStartDate.getDate() + (i * 7));
        } else if (interval === 'monthly') {
          paymentDate.setMonth(paymentStartDate.getMonth() + i);
        } else if (interval === 'quarterly') {
          paymentDate.setMonth(paymentStartDate.getMonth() + (i * 3));
        } else if (interval === 'annually') {
          paymentDate.setFullYear(paymentStartDate.getFullYear() + i);
        }

        schedule.push({
          amount: subscriptionAmount,
          dueDate: paymentDate,
          label: `${t('admin.enrollments.paymentPlanDetails.payment', 'Payment')} ${i + 1}`
        });
      }
    }

    return schedule;
  };

  const plannedSchedule = calculatePaymentSchedule();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.paymentPlanDetails.title', 'Payment Plan Details')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.paymentPlanDetails.description', 'View payment plan configuration for this enrollment')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 flex-1 overflow-hidden">
          {/* Left Column - Payment Plan Details */}
          <div className="space-y-6 overflow-y-auto pr-2">
          {/* Plan Name */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {t('admin.enrollments.paymentPlanDetails.planName', 'Plan Name')}
            </Label>
            <div className="mt-1 text-lg font-semibold">{formatPaymentPlanName()}</div>
          </div>

          {/* Payment Model */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {t('admin.enrollments.paymentPlanDetails.paymentModel', 'Payment Model')}
            </Label>
            <div className="mt-1 capitalize">
              {paymentModel === 'one_time' && t('admin.enrollments.paymentPlanDetails.oneTime', 'One-Time Payment')}
              {paymentModel === 'deposit_then_plan' && t('admin.enrollments.paymentPlanDetails.depositThenPlan', 'Deposit + Installments')}
              {paymentModel === 'subscription' && t('admin.enrollments.paymentPlanDetails.subscription', 'Subscription')}
              {paymentModel === 'free' && t('admin.enrollments.paymentPlanDetails.free', 'Free')}
            </div>
          </div>

          {/* Total Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.totalAmount', 'Total Amount')}
              </Label>
              <div className="mt-1 text-lg font-semibold">{formatCurrency(enrollment.total_amount, enrollment.currency)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.paidAmount', 'Paid Amount')}
              </Label>
              <div className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(enrollment.paid_amount, enrollment.currency)}</div>
            </div>
          </div>

          {/* Deposit + Installments Details */}
          {paymentModel === 'deposit_then_plan' && paymentPlan && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t('admin.enrollments.paymentPlanDetails.installmentDetails', 'Installment Details')}</h4>

              <div className="grid grid-cols-2 gap-4">
                {paymentPlan.deposit_type && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.depositType', 'Deposit Type')}
                    </Label>
                    <div className="mt-1 capitalize">
                      {t(`admin.enrollments.paymentPlanDetails.depositType.${paymentPlan.deposit_type}`, paymentPlan.deposit_type)}
                    </div>
                  </div>
                )}

                {paymentPlan.deposit_percentage && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.depositPercentage', 'Deposit Percentage')}
                    </Label>
                    <div className="mt-1">{paymentPlan.deposit_percentage}%</div>
                  </div>
                )}

                {paymentPlan.deposit_amount && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.depositAmount', 'Deposit Amount')}
                    </Label>
                    <div className="mt-1 text-lg font-semibold">
                      {formatCurrency(paymentPlan.deposit_amount, enrollment.currency)}
                    </div>
                  </div>
                )}

                {paymentPlan.installments && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.numberOfInstallments', 'Number of Installments')}
                    </Label>
                    <div className="mt-1">{paymentPlan.installments}</div>
                  </div>
                )}

                {installmentAmount && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.recurringPayment', 'Recurring Payment')}
                    </Label>
                    <div className="mt-1">
                      <span className="text-lg font-semibold">{formatCurrency(installmentAmount, enrollment.currency)}</span>
                      <span className="text-sm font-normal text-muted-foreground mx-2">/</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {t(`admin.enrollments.paymentPlan.frequency.${paymentPlan.frequency || 'monthly'}`, paymentPlan.frequency || 'monthly')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscription Details */}
          {paymentModel === 'subscription' && paymentPlan && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t('admin.enrollments.paymentPlanDetails.subscriptionDetails', 'Subscription Details')}</h4>

              <div className="grid grid-cols-2 gap-4">
                {paymentPlan.subscription_interval && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.billingInterval', 'Billing Interval')}
                    </Label>
                    <div className="mt-1 capitalize">{paymentPlan.subscription_interval}</div>
                  </div>
                )}

                {paymentPlan.trial_days && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.trialDays', 'Trial Days')}
                    </Label>
                    <div className="mt-1">{paymentPlan.trial_days} days</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('admin.enrollments.paymentPlanDetails.paymentStatus', 'Payment Status')}
                </Label>
                <div className="mt-1">
                  <Badge variant={enrollment.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {t(`admin.enrollments.paymentStatus.${enrollment.payment_status}`, enrollment.payment_status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t('admin.enrollments.paymentPlanDetails.enrollmentStatus', 'Enrollment Status')}
                </Label>
                <div className="mt-1">
                  <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                    {t(`admin.enrollments.status.${enrollment.status}`, enrollment.status.replace(/_/g, ' '))}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Start Date */}
          {enrollment.payment_start_date && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.paymentStartDate', 'Payment Start Date')}
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {(() => {
                    // Extract date-only part and parse as local midnight
                    const dateOnly = enrollment.payment_start_date.split('T')[0];
                    return new Date(dateOnly + 'T00:00:00').toLocaleDateString();
                  })()}
                </span>
              </div>
            </div>
          )}
          </div>

          {/* Right Column - Payment Schedule */}
          <div className="space-y-6 overflow-y-auto pr-2">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('admin.enrollments.paymentPlanDetails.paymentSchedule', 'Payment Schedule')}
              </h4>

              {plannedSchedule.length > 0 ? (
                <div className="space-y-1.5">
                  {plannedSchedule.map((payment, index) => {
                    // Find matching actual schedule if it exists
                    const actualSchedule = paymentSchedules.find(s => s.sequence_number === index + 1);
                    const isPaid = actualSchedule?.status === 'paid';
                    const isOverdue = actualSchedule?.status === 'overdue';

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {isPaid && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                          {isOverdue && <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                          {!isPaid && !isOverdue && <Clock className="h-4 w-4 text-primary flex-shrink-0" />}

                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-sm">{payment.label}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {payment.dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm whitespace-nowrap">
                            {formatCurrency(payment.amount, enrollment.currency)}
                          </span>
                          {actualSchedule && (
                            <Badge
                              variant={
                                actualSchedule.status === 'paid' ? 'default' :
                                actualSchedule.status === 'overdue' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {t(`admin.enrollments.paymentPlanDetails.status.${actualSchedule.status}`, actualSchedule.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-md bg-muted/30">
                  {t('admin.enrollments.paymentPlanDetails.noScheduleInfo', 'Payment schedule information not available.')}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
