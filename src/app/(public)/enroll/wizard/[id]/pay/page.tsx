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
import StripeSetupForm from '@/components/payments/StripeSetupForm';
import SavedCardDisplay from '@/components/payments/SavedCardDisplay';
import PaymentMethodSelector from '@/components/payments/PaymentMethodSelector';

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

interface StripeSetupData {
  clientSecret: string;
  setup_intent_id: string;
  publishableKey: string;
  requires_payment_method: boolean;
}

export default function WizardPaymentPage() {
  const { t } = useUserLanguage();
  const appContext = useApp();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [stripeData, setStripeData] = useState<StripePaymentData | null>(null);
  const [stripeSetupData, setStripeSetupData] = useState<StripeSetupData | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false); // Setup Intent mode (card save only)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Saved card state
  const [savedCard, setSavedCard] = useState<any>(null);
  const [allPaymentMethods, setAllPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [checkingSavedCard, setCheckingSavedCard] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  // Parent enrollment state
  const [isParentEnrollment, setIsParentEnrollment] = useState(false);

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

      // Check if this is a parent enrollment
      if (data.enrollment?.is_parent) {
        setIsParentEnrollment(true);
        console.log('[Payment Page] This is a parent enrollment - card save only, no payment');
        // Parent enrollments can save/use cards but won't be charged
        // Continue to show payment page for card management
      }

      // Check if there are any pending schedules (deposit or one-time payment)
      const hasPendingSchedules = data.schedules && data.schedules.length > 0;
      const pendingSchedule = hasPendingSchedules
        ? (scheduleId
            ? data.schedules.find((s: any) => s.id === scheduleId)
            : data.schedules.find((s: any) => s.status === 'pending'))
        : null;

      // Determine mode: Payment Intent (charge now) vs Setup Intent (save card only)
      // CRITICAL: Parent enrollments ALWAYS use Setup Intent (card save only, no charge)
      if (pendingSchedule && !data.enrollment?.is_parent) {
        // Payment Intent mode - there's a deposit or full payment to charge now
        console.log('[Payment Page] Using Payment Intent mode - charging', pendingSchedule.amount);
        setIsSetupMode(false);
        setPaymentInfo({
          schedule_id: pendingSchedule.id,
          amount: pendingSchedule.amount,
          currency: pendingSchedule.currency,
          payment_type: pendingSchedule.payment_type,
          payment_number: pendingSchedule.payment_number,
          product_name: data.product.title,
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
      } else {
        // Setup Intent mode - no immediate charge, just save card for future payments
        console.log('[Payment Page] Using Setup Intent mode - saving card only (no charge)');
        setIsSetupMode(true);
        // Set minimal payment info for UI display
        setPaymentInfo({
          schedule_id: '', // No schedule yet
          amount: 0, // No charge now
          currency: data.enrollment.currency || 'USD',
          payment_type: 'installment',
          payment_number: 0,
          product_name: data.product.title,
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
      }

      // After fetching payment info, check for saved card
      await checkSavedCard();

    } catch (error: any) {
      console.error('Error fetching payment info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a saved payment method
  const checkSavedCard = async () => {
    if (!enrollmentToken) return;

    setCheckingSavedCard(true);
    try {
      console.log('[Payment Page] Checking for saved cards...');
      const response = await fetch(
        `/api/enrollments/token/${enrollmentToken}/payment/check-saved-card`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[Payment Page] Check saved card failed:', response.status, errorData);
        setSavedCard(null);
        setShowNewCardForm(true);
        return;
      }

      const data = await response.json();
      console.log('[Payment Page] Check saved card response:', data);

      if (data.has_saved_card && data.default_payment_method) {
        console.log('[Payment Page] ✓ Found', data.payment_methods?.length || 1, 'saved card(s)');
        console.log('[Payment Page] ✓ Using default card:', data.default_payment_method.brand, '****', data.default_payment_method.last4);

        // Store all payment methods
        setAllPaymentMethods(data.payment_methods || [data.default_payment_method]);

        // Set default as selected and saved card
        setSavedCard(data.default_payment_method);
        setSelectedPaymentMethodId(data.default_payment_method.id);
        setShowNewCardForm(false);
      } else {
        console.log('[Payment Page] No saved card found in response');
        setSavedCard(null);
        setAllPaymentMethods([]);
        setSelectedPaymentMethodId(null);
        setShowNewCardForm(true);
      }
    } catch (error) {
      console.error('[Payment Page] ❌ Error checking saved card:', error);
      setSavedCard(null);
      setShowNewCardForm(true);
    } finally {
      setCheckingSavedCard(false);
    }
  };

  // Create Stripe intent (Payment or Setup) when payment info is loaded
  // Use ref to prevent multiple intent creations
  const intentCreatedRef = useRef(false);
  const currentPaymentIntentRef = useRef<string | null>(null);

  // Reset intent creation flag when switching to new card form
  useEffect(() => {
    if (showNewCardForm && savedCard) {
      console.log('[Payment Page] Switching to new card form - resetting intent flag');
      intentCreatedRef.current = false;
      // Clear existing stripe data to trigger new intent creation
      setStripeData(null);
      setStripeSetupData(null);
    }
  }, [showNewCardForm, savedCard]);

  useEffect(() => {
    // Skip if using saved card - no need for new intent
    if (savedCard && !showNewCardForm) {
      console.log('[Payment Page] Using saved card - skipping intent creation');
      return;
    }

    // For parent enrollments, ONLY allow Setup Intent (never Payment Intent)
    if (isParentEnrollment && !isSetupMode) {
      console.log('[Payment Page] Parent enrollment - forcing Setup Intent mode (no charge)');
      setIsSetupMode(true);
      return;
    }

    if (paymentInfo && !stripeData && !stripeSetupData && !intentCreatedRef.current) {
      intentCreatedRef.current = true; // Mark as creating
      if (isSetupMode) {
        createSetupIntent();
      } else {
        // Parent enrollments should never reach here due to check above
        if (!isParentEnrollment) {
          createPaymentIntent();
        }
      }
    }

    // Cleanup: Cancel payment intent when component unmounts or user navigates away
    return () => {
      if (currentPaymentIntentRef.current && !success && !isSetupMode) {
        // User is leaving without completing payment - cancel the payment intent
        // (Setup intents don't need cancellation as they don't hold funds)
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
  }, [paymentInfo, success, isParentEnrollment, savedCard, showNewCardForm]);

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

      // Validate response data
      if (!data.publishableKey) {
        throw new Error('Stripe publishable key not configured. Please contact support.');
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

  const createSetupIntent = async () => {
    try {
      console.log('[Payment Page] Creating Setup Intent for card save...');
      const res = await fetch(`/api/enrollments/token/${enrollmentToken}/payment/create-setup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create setup intent');
      }

      // Validate response data
      if (!data.publishableKey) {
        throw new Error('Stripe publishable key not configured. Please contact support.');
      }

      console.log('[Payment Page] Created setup intent:', data.setup_intent_id);
      setStripeSetupData(data);
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
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

  const handleSetupSuccess = () => {
    console.log('[Payment Page] Setup Intent succeeded - card saved');
    setSuccess(true);
    setTimeout(() => {
      router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
    }, 2000);
  };

  const handleSetupError = (errorMessage: string) => {
    console.error('[Payment Page] Setup Intent failed:', errorMessage);
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
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">
              {isParentEnrollment
                ? t('user.payments.checkout.processingParentEnrollment', 'Processing enrollment...')
                : t('user.payments.checkout.loading', 'Loading payment information...')}
            </p>
          </CardContent>
        </Card>
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
            <h2 className="text-2xl font-bold mb-2">
              {isSetupMode
                ? t('user.payments.checkout.cardSaved', 'Card Saved Successfully!')
                : t('user.payments.checkout.success', 'Payment Successful!')}
            </h2>
            <p className="text-muted-foreground text-center mb-4">
              {isSetupMode
                ? t('user.payments.checkout.cardSavedDesc', 'Your payment method has been saved for future payments.')
                : t('user.payments.checkout.successDesc', 'Your payment has been processed successfully.')}
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
            <CardTitle>
              {isSetupMode
                ? t('user.payments.checkout.saveCard', 'Save Payment Method')
                : t('user.payments.checkout.summary', 'Payment Summary')}
            </CardTitle>
            <CardDescription>
              {isSetupMode
                ? t('user.payments.checkout.saveCardDescription', 'Save your payment method for future automatic payments')
                : t('user.payments.checkout.reviewDetails', 'Review your payment details')}
            </CardDescription>
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

            {/* Simplified summary for parent enrollments */}
            {isParentEnrollment ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
                  {t('user.payments.checkout.parentSummary', 'Payment Information')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 dark:text-amber-300">{t('user.payments.checkout.totalAmount', 'Total Amount')}</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-100">{formatCurrency(paymentInfo.enrollment_total, paymentInfo.currency)}</span>
                  </div>
                  {paymentInfo.payment_plan && paymentInfo.payment_plan.installment_count && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-300">
                      <span>{t('user.payments.checkout.numberOfPayments', 'Number of Payments')}</span>
                      <span className="font-semibold">{paymentInfo.payment_plan.installment_count}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {!isSetupMode && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t('user.payments.checkout.paymentType', 'Payment Type')}</span>
                      <span className="font-medium">{translatePaymentType(paymentInfo.payment_type)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t('user.payments.checkout.paymentNumber', 'Payment Number')}</span>
                      <span className="font-medium">#{paymentInfo.payment_number}</span>
                    </div>
                  </>
                )}

                {/* Payment Plan Breakdown - show if this is a deposit payment and NOT setup mode */}
                {!isSetupMode && paymentInfo.payment_type === 'deposit' && paymentInfo.payment_plan && (
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
              </>
            )}

            {isSetupMode || isParentEnrollment ? (
              <Alert className="mt-4">
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  {t('user.payments.checkout.noChargeNow', 'No charge will be made now. Your card will be saved for future scheduled payments.')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex justify-between py-3">
                <span className="text-lg font-semibold">{t('user.payments.checkout.amountDue', 'Amount Due Now')}</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment/Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isSetupMode
                ? t('user.payments.checkout.cardDetails', 'Card Details')
                : t('user.payments.checkout.paymentMethod', 'Payment Method')}
            </CardTitle>
            <CardDescription>
              {t('user.payments.checkout.securePayment', 'Secure payment powered by Stripe')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show saved card if exists and user hasn't chosen to add new card */}
            {savedCard && !showNewCardForm ? (
              // Show selector if multiple cards, otherwise show single card display
              allPaymentMethods.length > 1 ? (
                <PaymentMethodSelector
                  paymentMethods={allPaymentMethods}
                  selectedMethodId={selectedPaymentMethodId}
                  onSelectMethod={(methodId) => {
                    console.log('[Payment Page] Selected payment method:', methodId);
                    setSelectedPaymentMethodId(methodId);
                    const selected = allPaymentMethods.find(m => m.id === methodId);
                    if (selected) {
                      setSavedCard(selected);
                    }
                  }}
                  onAddNewCard={() => {
                    console.log('[Payment Page] Switching to new card form');
                    intentCreatedRef.current = false;
                    setStripeData(null);
                    setStripeSetupData(null);
                    setShowNewCardForm(true);
                  }}
                  onConfirm={async () => {
                    // Handle selected card usage differently for parent vs regular enrollments
                    console.log('[Payment Page] Using selected card:', selectedPaymentMethodId);

                    if (isParentEnrollment) {
                      // Parent enrollments: Just redirect to completion (no charge)
                      console.log('[Payment Page] Parent enrollment - completing without charge');
                      router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
                    } else {
                      // Regular enrollments: Charge the saved card first
                      setLoading(true);
                      try {
                        console.log('[Payment Page] Charging selected card...');

                        const response = await fetch(
                          `/api/enrollments/token/${enrollmentToken}/payment/charge-saved-card`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              schedule_id: paymentInfo?.schedule_id,
                              payment_method_id: selectedPaymentMethodId,
                            }),
                          }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to charge card');
                        }

                        console.log('[Payment Page] ✓ Card charged successfully');
                        setSuccess(true);

                        // Redirect to completion after short delay
                        setTimeout(() => {
                          router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
                        }, 1500);

                      } catch (error: any) {
                        console.error('[Payment Page] ❌ Error charging selected card:', error);
                        setError(error.message);
                        setLoading(false);
                      }
                    }
                  }}
                />
              ) : (
                <SavedCardDisplay
                  paymentMethod={savedCard}
                  onUseCard={async () => {
                    // Handle saved card usage differently for parent vs regular enrollments
                    console.log('[Payment Page] Using saved card');

                    if (isParentEnrollment) {
                      // Parent enrollments: Just redirect to completion (no charge)
                      console.log('[Payment Page] Parent enrollment - completing without charge');
                      router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
                    } else {
                      // Regular enrollments: Charge the saved card first
                      setLoading(true);
                      try {
                        console.log('[Payment Page] Charging saved card...');

                        const response = await fetch(
                          `/api/enrollments/token/${enrollmentToken}/payment/charge-saved-card`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              schedule_id: paymentInfo?.schedule_id,
                              payment_method_id: savedCard.id,
                            }),
                          }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to charge card');
                        }

                        console.log('[Payment Page] ✓ Card charged successfully');
                        setSuccess(true);

                        // Redirect to completion after short delay
                        setTimeout(() => {
                          router.push(`/enroll/wizard/${params.id}?token=${enrollmentToken}&payment=complete`);
                        }, 1500);

                      } catch (error: any) {
                        console.error('[Payment Page] ❌ Error charging saved card:', error);
                        setError(error.message);
                        setLoading(false);
                      }
                    }
                  }}
                  onUpdateCard={() => {
                    // Show new card form and reset intent creation
                    console.log('[Payment Page] Switching to new card form');
                    intentCreatedRef.current = false;
                    setStripeData(null);
                    setStripeSetupData(null);
                    setShowNewCardForm(true);
                  }}
                />
              )
            ) : checkingSavedCard ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">{t('user.payments.checkout.checkingCard', 'Checking payment method...')}</span>
              </div>
            ) : isSetupMode ? (
              // Setup Intent mode - save card without charging
              !stripeSetupData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3">{t('user.payments.checkout.preparingForm', 'Preparing form...')}</span>
                </div>
              ) : (
                <StripeSetupForm
                  clientSecret={stripeSetupData.clientSecret}
                  publishableKey={stripeSetupData.publishableKey}
                  onSuccess={handleSetupSuccess}
                  onError={handleSetupError}
                />
              )
            ) : (
              // Payment Intent mode - charge now
              !stripeData ? (
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
              )
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
