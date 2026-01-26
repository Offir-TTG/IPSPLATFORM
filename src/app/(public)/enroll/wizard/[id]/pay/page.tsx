'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUserLanguage, useApp } from '@/context/AppContext';
import StripePaymentForm from '@/components/payments/StripePaymentForm';

interface PaymentInfo {
  schedule_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_number: number;
  product_name: string;
  enrollment_total: number;
  payment_plan?: {
    plan_name: string;
    plan_type: string;
    installment_count?: number;
    installment_frequency?: string;
    deposit_amount?: number;
    installment_amount?: number;
  };
}

interface StripePaymentData {
  clientSecret: string;
  payment_intent_id: string;
  publishableKey: string;
}

export default function WizardPaymentPage() {
  const { t } = useUserLanguage();
  const appContext = useApp();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [stripeData, setStripeData] = useState<StripePaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const enrollmentToken = searchParams?.get('token');
  const scheduleId = searchParams?.get('schedule');

  // Check if returning from Stripe redirect (3D Secure, etc.)
  const stripePaymentIntentId = searchParams?.get('payment_intent');
  const stripeRedirectStatus = searchParams?.get('redirect_status');

  // Translate payment type
  const translatePaymentType = (paymentType: string) => {
    const normalizedType = paymentType?.toLowerCase() || 'unknown';
    const typeLabels: Record<string, string> = {
      deposit: t('user.payments.paymentType.deposit', 'Deposit'),
      installment: t('user.payments.paymentType.installment', 'Installment'),
      subscription: t('user.payments.paymentType.subscription', 'Subscription'),
      full: t('user.payments.paymentType.full', 'Full Payment'),
      one_time: t('user.payments.paymentType.oneTime', 'One-Time Payment'),
      unknown: t('user.payments.paymentType.unknown', 'Unknown'),
    };
    return typeLabels[normalizedType] || t(`user.payments.paymentType.${normalizedType}`, paymentType);
  };

  // Handle return from Stripe redirect (3D Secure, etc.)
  useEffect(() => {
    if (stripePaymentIntentId && stripeRedirectStatus) {
      console.log('[Payment Page] Returned from Stripe redirect:', { stripePaymentIntentId, stripeRedirectStatus });

      if (stripeRedirectStatus === 'succeeded') {
        console.log('[Payment Page] Payment succeeded via redirect - redirecting to wizard');
        setSuccess(true);
        setTimeout(() => {
          router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
        }, 2000);
      } else {
        console.error('[Payment Page] Payment failed or cancelled:', stripeRedirectStatus);
        setError(`Payment ${stripeRedirectStatus}. Please try again.`);
        setLoading(false);
      }
    }
    // Only run on mount to check for Stripe return parameters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enrollmentToken) {
      setError('Invalid enrollment token');
      setLoading(false);
      return;
    }

    // Skip fetching payment info if we're handling a Stripe redirect
    if (stripePaymentIntentId && stripeRedirectStatus === 'succeeded') {
      return;
    }

    fetchPaymentInfo();
    // Only run once on mount or when token/schedule changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentToken, scheduleId]);

  const fetchPaymentInfo = async () => {
    try {
      if (!enrollmentToken) {
        throw new Error('Enrollment token is required');
      }

      // Use token-based endpoint for unauthenticated wizard payment
      const endpoint = `/api/enrollments/token/${enrollmentToken}/payment`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch payment information');
      }

      if (!data.schedules) {
        throw new Error('No payment schedules found');
      }

      // Find the specific schedule or the next pending one
      let schedule;
      if (scheduleId) {
        schedule = data.schedules.find((s: any) => s.id === scheduleId);
      } else {
        schedule = data.schedules.find((s: any) => s.status === 'pending');
      }

      if (!schedule) {
        throw new Error('No pending payment found');
      }

      setPaymentInfo({
        schedule_id: schedule.id,
        amount: schedule.amount,
        currency: schedule.currency,
        payment_type: schedule.payment_type,
        payment_number: schedule.payment_number,
        product_name: data.product.title, // Product uses 'title' field
        enrollment_total: data.enrollment.total_amount,
        payment_plan: data.payment_plan ? {
          plan_name: data.payment_plan.plan_name,
          plan_type: data.payment_plan.plan_type,
          installment_count: data.payment_plan.installment_count,
          installment_frequency: data.payment_plan.installment_frequency,
          deposit_amount: data.payment_plan.deposit_amount,
          installment_amount: data.payment_plan.installment_amount,
        } : undefined,
      });

    } catch (error: any) {
      console.error('Error fetching payment info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create Stripe payment intent when payment info is loaded
  // Use ref to prevent multiple intent creations
  const intentCreatedRef = useRef(false);
  const currentPaymentIntentRef = useRef<string | null>(null);

  useEffect(() => {
    if (paymentInfo && !stripeData && !intentCreatedRef.current) {
      intentCreatedRef.current = true; // Mark as creating
      createPaymentIntent();
    }

    // Cleanup: Cancel payment intent when component unmounts or user navigates away
    return () => {
      if (currentPaymentIntentRef.current && !success) {
        // User is leaving without completing payment - cancel the intent
        // This runs async but that's OK since we're unmounting
        fetch(`/api/enrollments/token/${enrollmentToken}/payment/cancel-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_intent_id: currentPaymentIntentRef.current,
            schedule_id: paymentInfo?.schedule_id
          }),
        }).catch(err => {
          console.error('[Payment Page] Failed to cancel intent on unmount:', err);
        });
      }
    };
    // Only run when paymentInfo becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentInfo, success]);

  const createPaymentIntent = async () => {
    try {
      const res = await fetch(`/api/enrollments/token/${enrollmentToken}/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: paymentInfo!.schedule_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      // Store payment intent ID for cleanup
      currentPaymentIntentRef.current = data.payment_intent_id;
      console.log('[Payment Page] Created payment intent:', data.payment_intent_id);

      setStripeData(data);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setError(error.message);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>{error || t('user.payments.checkout.infoNotFound', 'Payment information not found')}</AlertDescription>
        </Alert>
        {enrollmentToken && (
          <Button asChild className="mt-4">
            <Link href={`/enroll/wizard/${params.id}?token=${enrollmentToken}`}>
              <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
              {t('wizard.backToWizard', 'Back to Enrollment Wizard')}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CreditCard className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('user.payments.checkout.success', 'Payment Successful!')}</h2>
            <p className="text-muted-foreground text-center mb-4">
              {t('user.payments.checkout.successDesc', 'Your payment has been processed successfully.')}
            </p>
            <p className="text-sm text-muted-foreground">{t('user.payments.checkout.redirecting', 'Redirecting...')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/enroll/wizard/${params.id}?token=${enrollmentToken}`}>
          <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
          {t('user.payments.checkout.back', 'Back')}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Summary - First column */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle>{t('user.payments.checkout.summary', 'Payment Summary')}</CardTitle>
            <CardDescription>{t('user.payments.checkout.reviewDetails', 'Review your payment details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.course', 'Course')}</span>
              <span className="font-medium">{paymentInfo.product_name}</span>
            </div>
            {paymentInfo.payment_plan && (
              <div className="py-2 border-b space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">{t('user.payments.checkout.paymentPlan', 'Payment Plan')}</div>
                    <div className="font-medium">{paymentInfo.payment_plan.plan_name}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 shrink-0"
                  >
                    <Link href={`/enroll/wizard/${params.id}?token=${enrollmentToken}`}>
                      {t('user.payments.checkout.changePlan', 'Change Plan')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.paymentType', 'Payment Type')}</span>
              <span className="font-medium">{translatePaymentType(paymentInfo.payment_type)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.paymentNumber', 'Payment Number')}</span>
              <span className="font-medium">#{paymentInfo.payment_number}</span>
            </div>

            {/* Payment Plan Breakdown - show if this is a deposit payment */}
            {paymentInfo.payment_type === 'deposit' && paymentInfo.payment_plan && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  {t('user.payments.checkout.paymentBreakdown', 'Payment Breakdown')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">{t('user.payments.checkout.dueToday', 'Due Today (Deposit)')}</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(paymentInfo.amount, paymentInfo.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('user.payments.checkout.totalProgramCost', 'Total Program Cost')}</span>
                    <span>{formatCurrency(paymentInfo.enrollment_total, paymentInfo.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('user.payments.checkout.remainingBalance', 'Remaining Balance')}</span>
                    <span>{formatCurrency(paymentInfo.enrollment_total - paymentInfo.amount, paymentInfo.currency)}</span>
                  </div>
                  {paymentInfo.payment_plan.installment_amount && paymentInfo.payment_plan.installment_count && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t('user.payments.checkout.monthlyPayment', 'Monthly Payment')}</span>
                        <span>{formatCurrency(paymentInfo.payment_plan.installment_amount, paymentInfo.currency)}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {(() => {
                            const frequency = paymentInfo.payment_plan.installment_frequency || 'monthly';
                            const translatedFrequency = t(`user.payments.frequency.${frequency}`, frequency);
                            return appContext.t('user.payments.checkout.installmentInfo', {
                              count: paymentInfo.payment_plan.installment_count,
                              frequency: translatedFrequency
                            }, 'user');
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between py-3">
              <span className="text-lg font-semibold">{t('user.payments.checkout.amountDue', 'Amount Due Now')}</span>
              <span className="text-2xl font-bold">
                {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{t('user.payments.checkout.paymentMethod', 'Payment Method')}</CardTitle>
            <CardDescription>
              {t('user.payments.checkout.securePayment', 'Secure payment powered by Stripe')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!stripeData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">{t('user.payments.checkout.preparingPayment', 'Preparing payment...')}</span>
              </div>
            ) : (
              <StripePaymentForm
                clientSecret={stripeData.clientSecret}
                publishableKey={stripeData.publishableKey}
                amount={paymentInfo.amount}
                currency={paymentInfo.currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>{t('user.payments.checkout.securityNotice', 'Secured by Stripe • PCI-DSS Compliant')}</span>
        </div>
      </div>
    </div>
  );
}
