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
  product_id: string;
  payment_plan_id?: string;
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

interface PaymentPlanTemplate {
  id: string;
  plan_name: string;
  plan_type: 'one_time' | 'deposit' | 'recurring' | 'subscription';
  currency: string;
  deposit_type?: 'fixed' | 'percentage';
  deposit_amount?: number;
  deposit_percentage?: number;
  installment_count?: number;
  installment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;
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
  const { t, direction} = useAdminLanguage();
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [availablePaymentPlans, setAvailablePaymentPlans] = useState<PaymentPlanTemplate[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlanTemplate | null>(null);
  const [loadingSelectedPlan, setLoadingSelectedPlan] = useState(false);
  const [previewedPlan, setPreviewedPlan] = useState<PaymentPlanTemplate | null>(null);

  // Overall loading state
  const isLoading = loadingSchedules || loadingPlans || loadingSelectedPlan;

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

  // Fetch available payment plans when dialog opens
  useEffect(() => {
    const fetchAvailablePaymentPlans = async () => {
      if (!open || !enrollment?.product_id) {
        return;
      }

      setLoadingPlans(true);
      try {
        // Fetch product to get both payment_model and alternative_payment_plan_ids
        const productResponse = await fetch(`/api/admin/products/${enrollment.product_id}`);

        if (productResponse.ok) {
          const productData = await productResponse.json();
          const planIds = productData.alternative_payment_plan_ids || [];
          const paymentPlan = productData.payment_plan || {};
          const hasPaymentPlanConfig = paymentPlan && Object.keys(paymentPlan).length > 0;

          // VALIDATION: Determine if this product uses payment plan templates
          // Fetch payment plans if:
          // 1. Product has payment plan templates configured (>0)
          // 2. Product does NOT use OLD system payment_plan config
          const shouldFetchPaymentPlans =
            planIds.length > 0 &&                    // Product has payment plan templates
            !hasPaymentPlanConfig;                   // Product does NOT have OLD payment_plan config

          if (!shouldFetchPaymentPlans) {
            // This product uses old payment_plan config, don't fetch templates
            setAvailablePaymentPlans([]);
            setLoadingPlans(false);
            return;
          }

          // Only fetch if truly multi-plan
          if (planIds.length > 0) {
            // Fetch all payment plans
            const plansResponse = await fetch(`/api/admin/payments/plans`);

            if (plansResponse.ok) {
              const plansData = await plansResponse.json();

              // The API might return { plans: [...] } or just [...]
              const allPlans = Array.isArray(plansData) ? plansData : (plansData.plans || []);

              // Filter to only include plans from product's alternative_payment_plan_ids
              const filteredPlans = allPlans.filter((plan: PaymentPlanTemplate) =>
                planIds.includes(plan.id)
              );
              setAvailablePaymentPlans(filteredPlans);
            }
          }
        }
      } catch (error) {
        console.error('[PaymentPlanDialog] Error fetching available payment plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchAvailablePaymentPlans();
  }, [open, enrollment?.product_id, enrollment?.payment_plan_id]);

  // Fetch the selected payment plan template if enrollment has payment_plan_id
  useEffect(() => {
    const fetchSelectedPaymentPlan = async () => {
      if (!open || !enrollment?.payment_plan_id) {
        setSelectedPaymentPlan(null);
        setLoadingSelectedPlan(false);
        return;
      }

      setLoadingSelectedPlan(true);
      try {
        const response = await fetch(`/api/admin/payments/plans/${enrollment.payment_plan_id}`);
        if (response.ok) {
          const planData = await response.json();
          setSelectedPaymentPlan(planData);
          // Automatically set as previewed plan so schedule shows
          setPreviewedPlan(planData);
        }
      } catch (error) {
        console.error('[PaymentPlanDialog] Error fetching selected payment plan:', error);
      } finally {
        setLoadingSelectedPlan(false);
      }
    };

    fetchSelectedPaymentPlan();
  }, [open, enrollment?.payment_plan_id]);

  if (!enrollment) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0);
  };

  const formatPaymentPlanName = (): string => {
    // If enrollment has a selected payment plan template, show its name
    if (selectedPaymentPlan) {
      return selectedPaymentPlan.plan_name;
    }

    const key = enrollment.payment_plan_key;
    const data = enrollment.payment_plan_data || {};

    if (key === 'custom' && data.name) {
      return data.name;
    } else if (key === 'admin.enrollments.paymentPlan.multiplePlans') {
      return t('admin.enrollments.paymentPlan.multiplePlans', 'Multiple plans available');
    } else if (key === 'admin.enrollments.paymentPlan.defaultPlan') {
      return t('admin.enrollments.paymentPlan.defaultPlan', 'Default plan');
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

    // If enrollment has a selected payment plan template, use it to calculate schedule
    if (selectedPaymentPlan) {
      const totalAmount = enrollment.total_amount;

      if (selectedPaymentPlan.plan_type === 'one_time') {
        schedule.push({
          amount: totalAmount,
          dueDate: paymentStartDate,
          label: t('admin.enrollments.paymentPlanDetails.fullPayment', 'Full Payment')
        });
      } else if (selectedPaymentPlan.plan_type === 'deposit' && selectedPaymentPlan.installment_count) {
        // Calculate deposit
        const depositAmount = selectedPaymentPlan.deposit_type === 'percentage'
          ? (totalAmount * (selectedPaymentPlan.deposit_percentage || 0) / 100)
          : (selectedPaymentPlan.deposit_amount || 0);

        // Add deposit payment
        if (depositAmount > 0) {
          schedule.push({
            amount: depositAmount,
            dueDate: enrollmentDate,
            label: t('admin.enrollments.paymentPlanDetails.depositPayment', 'Deposit')
          });
        }

        // Calculate installments
        const remainingAmount = totalAmount - depositAmount;
        const installmentAmt = remainingAmount / selectedPaymentPlan.installment_count;
        const frequency = selectedPaymentPlan.installment_frequency || 'monthly';

        for (let i = 0; i < selectedPaymentPlan.installment_count; i++) {
          const installmentDate = new Date(paymentStartDate);
          if (frequency === 'weekly') {
            installmentDate.setDate(paymentStartDate.getDate() + (i * 7));
          } else if (frequency === 'biweekly') {
            installmentDate.setDate(paymentStartDate.getDate() + (i * 14));
          } else if (frequency === 'monthly') {
            installmentDate.setMonth(paymentStartDate.getMonth() + i);
          } else if (frequency === 'custom' && selectedPaymentPlan.custom_frequency_days) {
            installmentDate.setDate(paymentStartDate.getDate() + (i * selectedPaymentPlan.custom_frequency_days));
          }

          schedule.push({
            amount: installmentAmt,
            dueDate: installmentDate,
            label: `${t('admin.enrollments.paymentPlanDetails.installment', 'Installment')} ${i + 1}`
          });
        }
      } else if (selectedPaymentPlan.plan_type === 'recurring' && selectedPaymentPlan.installment_count) {
        const installmentAmt = totalAmount / selectedPaymentPlan.installment_count;
        const frequency = selectedPaymentPlan.installment_frequency || 'monthly';

        for (let i = 0; i < selectedPaymentPlan.installment_count; i++) {
          const installmentDate = new Date(paymentStartDate);
          if (frequency === 'weekly') {
            installmentDate.setDate(paymentStartDate.getDate() + (i * 7));
          } else if (frequency === 'biweekly') {
            installmentDate.setDate(paymentStartDate.getDate() + (i * 14));
          } else if (frequency === 'monthly') {
            installmentDate.setMonth(paymentStartDate.getMonth() + i);
          } else if (frequency === 'custom' && selectedPaymentPlan.custom_frequency_days) {
            installmentDate.setDate(paymentStartDate.getDate() + (i * selectedPaymentPlan.custom_frequency_days));
          }

          schedule.push({
            amount: installmentAmt,
            dueDate: installmentDate,
            label: `${t('admin.enrollments.paymentPlanDetails.payment', 'Payment')} ${i + 1}`
          });
        }
      }

      return schedule;
    }

    // Fall back to old payment_model logic for legacy enrollments
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

  // Calculate schedule for a specific payment plan template (for showing all options)
  const calculateScheduleForPlan = (plan: PaymentPlanTemplate): { amount: number; dueDate: Date; label: string }[] => {
    const schedule: { amount: number; dueDate: Date; label: string }[] = [];
    const totalAmount = enrollment.total_amount;
    const enrollmentDate = new Date(enrollment.enrolled_at || enrollment.created_at || new Date());

    let paymentStartDate: Date;
    if (enrollment.payment_start_date) {
      const dateOnly = enrollment.payment_start_date.split('T')[0];
      paymentStartDate = new Date(dateOnly + 'T00:00:00');
    } else {
      paymentStartDate = enrollmentDate;
    }

    if (plan.plan_type === 'one_time') {
      schedule.push({
        amount: totalAmount,
        dueDate: paymentStartDate,
        label: t('admin.enrollments.paymentPlanDetails.fullPayment', 'Full Payment')
      });
    } else if (plan.plan_type === 'deposit' && plan.installment_count) {
      const depositAmount = plan.deposit_type === 'percentage'
        ? (totalAmount * (plan.deposit_percentage || 0) / 100)
        : (plan.deposit_amount || 0);

      if (depositAmount > 0) {
        schedule.push({
          amount: depositAmount,
          dueDate: enrollmentDate,
          label: t('admin.enrollments.paymentPlanDetails.depositPayment', 'Deposit')
        });
      }

      const remainingAmount = totalAmount - depositAmount;
      const installmentAmt = remainingAmount / plan.installment_count;
      const frequency = plan.installment_frequency || 'monthly';

      for (let i = 0; i < plan.installment_count; i++) {
        const installmentDate = new Date(paymentStartDate);
        if (frequency === 'weekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 7));
        } else if (frequency === 'biweekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 14));
        } else if (frequency === 'monthly') {
          installmentDate.setMonth(paymentStartDate.getMonth() + i);
        } else if (frequency === 'custom' && plan.custom_frequency_days) {
          installmentDate.setDate(paymentStartDate.getDate() + (i * plan.custom_frequency_days));
        }

        schedule.push({
          amount: installmentAmt,
          dueDate: installmentDate,
          label: `${t('admin.enrollments.paymentPlanDetails.installment', 'Installment')} ${i + 1}`
        });
      }
    } else if (plan.plan_type === 'recurring' && plan.installment_count) {
      const installmentAmt = totalAmount / plan.installment_count;
      const frequency = plan.installment_frequency || 'monthly';

      for (let i = 0; i < plan.installment_count; i++) {
        const installmentDate = new Date(paymentStartDate);
        if (frequency === 'weekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 7));
        } else if (frequency === 'biweekly') {
          installmentDate.setDate(paymentStartDate.getDate() + (i * 14));
        } else if (frequency === 'monthly') {
          installmentDate.setMonth(paymentStartDate.getMonth() + i);
        } else if (frequency === 'custom' && plan.custom_frequency_days) {
          installmentDate.setDate(paymentStartDate.getDate() + (i * plan.custom_frequency_days));
        }

        schedule.push({
          amount: installmentAmt,
          dueDate: installmentDate,
          label: `${t('admin.enrollments.paymentPlanDetails.payment', 'Payment')} ${i + 1}`
        });
      }
    }

    return schedule;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.paymentPlanDetails.title', 'Payment Plan Details')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.paymentPlanDetails.description', 'View payment plan configuration for this enrollment')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.loading', 'Loading payment plan details...')}
              </p>
            </div>
          </div>
        ) : (
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

          {/* Available Payment Plans - Only show for NEW system with multiple plans */}
          {availablePaymentPlans.length > 1 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.availablePlans', 'Available Payment Plans')}
              </Label>

              <div className="space-y-2">
                {availablePaymentPlans.map((plan) => {
                  const isSelected = selectedPaymentPlan?.id === plan.id;
                  const isPreviewed = previewedPlan?.id === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setPreviewedPlan(plan)}
                      className={`border rounded-md bg-card p-3 cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' :
                        isPreviewed ? 'ring-2 ring-primary/50 bg-primary/5' :
                        'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{plan.plan_name}</div>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            {t('admin.enrollments.paymentPlanDetails.selected', 'Selected')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.plan_type === 'one_time' && t('admin.enrollments.paymentPlanDetails.oneTime', 'One-Time Payment')}
                        {plan.plan_type === 'deposit' && (
                          <span>
                            {plan.deposit_type === 'percentage' && `${plan.deposit_percentage}% `}
                            {plan.deposit_type === 'fixed' && `${formatCurrency(plan.deposit_amount || 0, plan.currency)} `}
                            {t('admin.enrollments.paymentPlanDetails.depositLabel', 'Deposit')}
                            {plan.installment_count && ` + ${plan.installment_count} ${t('admin.enrollments.paymentPlanDetails.installments', 'installments')}`}
                          </span>
                        )}
                        {plan.plan_type === 'recurring' && (
                          <span>
                            {plan.installment_count} {t('admin.enrollments.paymentPlanDetails.installments', 'installments')}
                            {plan.installment_frequency && ` (${t(`admin.enrollments.paymentPlan.frequency.${plan.installment_frequency}`, plan.installment_frequency)})`}
                          </span>
                        )}
                        {plan.plan_type === 'subscription' && t('admin.enrollments.paymentPlanDetails.subscription', 'Subscription')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Model - Show for both single and multi-plan */}
          {availablePaymentPlans.length > 1 && previewedPlan ? (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('admin.enrollments.paymentPlanDetails.paymentModel', 'Payment Model')}
              </Label>
              <div className="mt-1 capitalize">
                {previewedPlan.plan_type === 'one_time' && t('admin.enrollments.paymentPlanDetails.oneTime', 'One-Time Payment')}
                {previewedPlan.plan_type === 'deposit' && t('admin.enrollments.paymentPlanDetails.depositThenPlan', 'Deposit + Installments')}
                {previewedPlan.plan_type === 'recurring' && t('admin.enrollments.paymentPlanDetails.recurring', 'Recurring Payments')}
                {previewedPlan.plan_type === 'subscription' && t('admin.enrollments.paymentPlanDetails.subscription', 'Subscription')}
              </div>
            </div>
          ) : availablePaymentPlans.length <= 1 && (
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
          )}

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

          {/* Installment Details for multi-plan mode (when plan is previewed) */}
          {availablePaymentPlans.length > 1 && previewedPlan && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">{t('admin.enrollments.paymentPlanDetails.installmentDetails', 'Installment Details')}</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Deposit details (if applicable) */}
                {previewedPlan.plan_type === 'deposit' && (
                  <>
                    {previewedPlan.deposit_type && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('admin.enrollments.paymentPlanDetails.depositType', 'Deposit Type')}
                        </Label>
                        <div className="mt-1 capitalize">
                          {previewedPlan.deposit_type === 'fixed' && t('admin.enrollments.paymentPlanDetails.fixedAmount', 'Fixed Amount')}
                          {previewedPlan.deposit_type === 'percentage' && t('admin.enrollments.paymentPlanDetails.percentage', 'Percentage')}
                        </div>
                      </div>
                    )}

                    {previewedPlan.deposit_amount && previewedPlan.deposit_type === 'fixed' && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('admin.enrollments.paymentPlanDetails.depositAmount', 'Deposit Amount')}
                        </Label>
                        <div className="mt-1 text-lg font-semibold">
                          {formatCurrency(previewedPlan.deposit_amount, previewedPlan.currency)}
                        </div>
                      </div>
                    )}

                    {previewedPlan.deposit_percentage && previewedPlan.deposit_type === 'percentage' && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          {t('admin.enrollments.paymentPlanDetails.depositAmount', 'Deposit Amount')}
                        </Label>
                        <div className="mt-1 text-lg font-semibold">
                          {previewedPlan.deposit_percentage}%
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Number of installments */}
                {previewedPlan.installment_count && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.numberOfInstallments', 'Number of Installments')}
                    </Label>
                    <div className="mt-1">{previewedPlan.installment_count}</div>
                  </div>
                )}

                {/* Recurring payment amount */}
                {(previewedPlan.plan_type === 'deposit' || previewedPlan.plan_type === 'recurring') && previewedPlan.installment_count && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('admin.enrollments.paymentPlanDetails.recurringPayment', 'Recurring Payment')}
                    </Label>
                    <div className="mt-1">
                      {(() => {
                        const totalAmount = enrollment.total_amount;
                        const depositAmount = previewedPlan.plan_type === 'deposit'
                          ? (previewedPlan.deposit_type === 'percentage'
                            ? (totalAmount * (previewedPlan.deposit_percentage || 0) / 100)
                            : (previewedPlan.deposit_amount || 0))
                          : 0;
                        const remainingAmount = totalAmount - depositAmount;
                        const installmentAmount = remainingAmount / previewedPlan.installment_count;
                        const frequency = previewedPlan.installment_frequency || 'monthly';
                        const frequencyText = t(`admin.enrollments.paymentPlan.frequency.${frequency}`, frequency);

                        return (
                          <>
                            <span className="text-lg font-semibold">{formatCurrency(installmentAmount, enrollment.currency)}</span>
                            <span className="text-sm font-normal text-muted-foreground mx-2">/</span>
                            <span className="text-sm font-normal text-muted-foreground">{frequencyText}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deposit + Installments Details for single-plan mode */}
          {availablePaymentPlans.length <= 1 && paymentModel === 'deposit_then_plan' && paymentPlan && (
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
            {/* For multi-plan mode, show schedule when a plan is clicked */}
            {availablePaymentPlans.length > 1 ? (
              previewedPlan ? (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t('admin.enrollments.paymentPlanDetails.paymentSchedule', 'Payment Schedule')}
                  </h4>

                  <div className="space-y-1.5">
                    {calculateScheduleForPlan(previewedPlan).map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {t('admin.enrollments.paymentPlanDetails.clickPlanToView', 'Click on a payment plan to view its schedule')}
                  </p>
                </div>
              )
            ) : (
              /* Show single schedule for selected/legacy plan */
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('admin.enrollments.paymentPlanDetails.paymentSchedule', 'Payment Schedule')}
                </h4>

                {plannedSchedule.length > 0 ? (
                  <div className="space-y-1.5">
                    {plannedSchedule.map((payment, index) => {
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
            )}
          </div>
        </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
