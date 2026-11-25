'use client';


import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Lock, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import StripeSetupForm from '@/components/payments/StripeSetupForm';
import { isOwed, nextChargeable } from '@/lib/payments/dueSchedules';

interface PaymentInfo {
  schedule_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_number: number;
  product_name: string;
  /** products.type (course, program, lecture, bundle, ...), for the summary label. */
  product_type?: string;
  /** More than one plan to pick from (same rule as the wizard's plan step). */
  can_change_plan?: boolean;
  enrollment_total: number;
  /** How many payments the plan has in all (cancelled ones not counted). */
  total_count: number;
  /** Payments still owed after the one paid now (charged later to the card). */
  later_count: number;
  /** When the first of those later payments is due. */
  later_first_date: string | null;
  payment_plan?: {
    plan_name: string;
    plan_type: string;
    installment_count?: number;
    installment_frequency?: string;
    custom_frequency_days?: number;
    subscription_frequency?: string;
    deposit_amount?: number;
    installment_amount?: number;
    /** Pay as you go: what each held session costs, when set. */
    session_amount?: number | null;
  };
}

/**
 * What the summary calls the thing being bought: a monthly membership is a
 * club; otherwise it follows the product type. Unknown types say "Product".
 */
const ITEM_LABELS: Record<string, [string, string]> = {
  course: ['user.payments.checkout.course', 'Course'],
  program: ['user.payments.checkout.item.program', 'Program'],
  lecture: ['user.payments.checkout.item.lecture', 'Lecture'],
  workshop: ['user.payments.checkout.item.workshop', 'Workshop'],
  webinar: ['user.payments.checkout.item.webinar', 'Webinar'],
  session: ['user.payments.checkout.item.session', 'Session'],
  session_pack: ['user.payments.checkout.item.session_pack', 'Personal guidance'],
  bundle: ['user.payments.checkout.item.bundle', 'Course bundle'],
};
function itemLabel(info: PaymentInfo, t: (key: string, fallback?: string) => string) {
  if (info.payment_plan?.plan_type === 'subscription') return t('user.payments.checkout.item.club', 'Club');
  const [key, fallback] = ITEM_LABELS[info.product_type ?? ''] ?? ['user.payments.checkout.item.product', 'Product'];
  return t(key, fallback);
}

/**
 * The plan's name. A real plan keeps its own name; a plan the server builds
 * from the product's payment setting (no id) has an English placeholder
 * name, so it is named by its kind in the page language instead.
 */
function planLabel(plan: any, t: (key: string, fallback?: string) => string): string {
  if (plan?.id) return plan.plan_name;
  if (plan?.plan_name === 'Free') return t('user.payments.checkout.planType.free', 'Free');
  switch (plan?.plan_type) {
    case 'subscription':
      return t('user.payments.checkout.planType.subscription', 'Subscription');
    case 'deposit':
      return t('user.payments.checkout.planType.deposit', 'Deposit and installments');
    case 'one_time':
      return t('user.payments.checkout.planType.one_time', 'One-time payment');
    default:
      return plan?.plan_name ?? '';
  }
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

export interface EnrollmentPaymentProps {
  enrollmentId: string;
  token: string | null;
  /** Shown in place inside the wizard on a portal page (not as its own page). */
  embedded?: boolean;
  /** Paid (or card saved): back to the wizard. Without it, the page navigates. */
  onDone?: () => void;
  /** Back to the wizard without paying. */
  onBack?: () => void;
}

/** The Stripe form's id, so the step's own button can submit it. */
const CARD_FORM_ID = 'enroll-card-form';

/** Short brand mark for a saved card's badge. */
function brandMark(brand: string | undefined): string {
  const b = (brand || '').toLowerCase();
  if (b === 'visa') return 'VISA';
  if (b === 'mastercard') return 'MC';
  if (b === 'amex' || b === 'american_express') return 'AMEX';
  return (brand || 'CARD').slice(0, 4).toUpperCase();
}

/** The enrollment payment step. Used by the pay page and inside the embedded wizard. */
export default function EnrollmentPayment({ enrollmentId, token, embedded = false, onDone, onBack }: EnrollmentPaymentProps) {
  // Compact look when shown inside the portal's child page (framed).
  useLayoutEffect(() => {
    try {
      if (window.self !== window.top) document.documentElement.classList.add('ips-embedded');
    } catch {
      document.documentElement.classList.add('ips-embedded');
    }
  }, []);
  const { t, language, direction } = useUserLanguage();
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

  // The Stripe form (new card): ready to submit, and submitting.
  const [cardFormReady, setCardFormReady] = useState(false);
  const [cardFormProcessing, setCardFormProcessing] = useState(false);

  // Parent enrollment state
  const [isParentEnrollment, setIsParentEnrollment] = useState(false);

  // Standalone page: the product's picture for the summary row.
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);

  const enrollmentToken = token;
  // Stripe's return after a 3-D Secure redirect arrives in the address.
  const searchParams = useSearchParams();
  // Finished: back to the wizard (in place when embedded, else by address).
  const finish = () => (onDone ? onDone() : router.push(`/enroll/wizard/${enrollmentId}?token=${enrollmentToken}&payment=complete`));
  const scheduleId = searchParams?.get('schedule');

  // Check if returning from Stripe redirect (3D Secure, etc.)
  const stripePaymentIntentId = searchParams?.get('payment_intent');
  const stripeRedirectStatus = searchParams?.get('redirect_status');

  // Handle return from Stripe redirect (3D Secure, etc.)
  useEffect(() => {
    if (stripePaymentIntentId && stripeRedirectStatus) {
      console.log('[Payment Page] Returned from Stripe redirect:', { stripePaymentIntentId, stripeRedirectStatus });

      if (stripeRedirectStatus === 'succeeded') {
        console.log('[Payment Page] Payment succeeded via redirect - redirecting to wizard');
        setSuccess(true);
        setTimeout(() => {
          finish();
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

  // The product picture for the standalone page's summary row (embedded,
  // the portal card names the product).
  useEffect(() => {
    if (embedded || !enrollmentToken) return;
    let cancelled = false;
    fetch(`/api/enrollments/token/${enrollmentToken}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.product_image_url === 'string' && data.product_image_url) {
          setProductImageUrl(data.product_image_url);
        }
      })
      .catch(() => {
        // The summary just shows the colored tile.
      });
    return () => {
      cancelled = true;
    };
  }, [embedded, enrollmentToken]);

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
      // The earliest payment that's due now. Future installments are charged
      // later to the saved card, so they're never offered here.
      const pendingSchedule = hasPendingSchedules
        ? (scheduleId
            ? data.schedules.find((s: any) => s.id === scheduleId && nextChargeable(data.schedules)?.id === s.id)
            : nextChargeable(data.schedules))
        : null;

      const canChangePlan = (data.product?.alternative_payment_plan_ids?.filter(Boolean).length ?? 0) > 1;

      // For the summary and the "charged later" line: how many payments the
      // plan has, and which are still owed after today's.
      const schedules: any[] = data.schedules || [];
      const chargeNow = !!pendingSchedule && !data.enrollment?.is_parent;
      const later = schedules
        .filter((s) => isOwed(s) && !(chargeNow && s.id === pendingSchedule.id))
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      const counts = {
        total_count: schedules.filter((s) => s.status !== 'cancelled').length,
        later_count: later.length,
        later_first_date: later[0]?.scheduled_date ?? null,
      };
      const plan = data.payment_plan ? {
        plan_name: planLabel(data.payment_plan, t),
        plan_type: data.payment_plan.plan_type,
        installment_count: data.payment_plan.installment_count,
        installment_frequency: data.payment_plan.installment_frequency,
        custom_frequency_days: data.payment_plan.custom_frequency_days,
        subscription_frequency: data.payment_plan.subscription_frequency,
        deposit_amount: data.payment_plan.deposit_amount,
        installment_amount: data.payment_plan.installment_amount,
        session_amount: Number(data.payment_plan.session_amount) || null,
      } : undefined;

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
          product_type: data.product.type,
          can_change_plan: canChangePlan,
          enrollment_total: data.enrollment.total_amount,
          ...counts,
          payment_plan: plan,
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
          product_type: data.product.type,
          can_change_plan: canChangePlan,
          enrollment_total: data.enrollment.total_amount,
          ...counts,
          payment_plan: plan,
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
      finish();
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSetupSuccess = () => {
    console.log('[Payment Page] Setup Intent succeeded - card saved');
    setSuccess(true);
    setTimeout(() => {
      finish();
    }, 2000);
  };

  const handleSetupError = (errorMessage: string) => {
    console.error('[Payment Page] Setup Intent failed:', errorMessage);
    setError(errorMessage);
  };

  /**
   * Pay with (or keep) a saved card: a parent enrollment just continues, a
   * card-only step confirms the card for later charges, otherwise the card is
   * charged now.
   */
  const payWithSavedCard = async (paymentMethodId: string | null) => {
    console.log('[Payment Page] Using saved card:', paymentMethodId);

    if (isParentEnrollment) {
      // Parent enrollments: Just redirect to completion (no charge)
      console.log('[Payment Page] Parent enrollment - completing without charge');
      finish();
    } else if (isSetupMode) {
      // Nothing due now (e.g. pay per session): confirm this card for later charges, no charge.
      setLoading(true);
      try {
        const response = await fetch(`/api/enrollments/token/${enrollmentToken}/payment/use-saved-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method_id: paymentMethodId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not use this card');
        setSuccess(true);
        setTimeout(() => finish(), 1500);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
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
              payment_method_id: paymentMethodId,
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
          finish();
        }, 1500);

      } catch (error: any) {
        console.error('[Payment Page] ❌ Error charging saved card:', error);
        setError(error.message);
        setLoading(false);
      }
    }
  };

  /** Choose one of the saved cards. */
  const chooseSavedCard = (method: any) => {
    setSelectedPaymentMethodId(method.id);
    setSavedCard(method);
    setShowNewCardForm(false);
  };

  /** Choose "another card": the Stripe form opens in place. */
  const chooseNewCard = () => {
    if (showNewCardForm) return;
    console.log('[Payment Page] Switching to new card form');
    intentCreatedRef.current = false;
    setStripeData(null);
    setStripeSetupData(null);
    setCardFormReady(false);
    setShowNewCardForm(true);
  };

  /** Money in the payment's currency (from the business settings). */
  const money = (amount: number, currency?: string) => {
    const value = Math.round((Number(amount) || 0) * 100) / 100;
    const code = (currency || paymentInfo?.currency || '').toUpperCase();
    const digits = Number.isInteger(value) ? 0 : 2;
    try {
      return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: digits,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${code} ${value.toFixed(digits)}`.trim();
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const backHref = `/enroll/wizard/${enrollmentId}?token=${enrollmentToken}`;
  const onBackClick = (e: React.MouseEvent) => {
    if (onBack) {
      e.preventDefault();
      onBack();
    }
  };

  const ui = {
    root: embedded ? 'pay-root grid gap-3 text-[#221a2e]' : 'pay-root min-h-screen bg-[#f6f3fa] px-4 py-4 sm:py-8 text-[#221a2e]',
    inner: embedded ? 'grid min-w-0 gap-3' : 'mx-auto grid w-full min-w-0 max-w-[640px] gap-3',
    card: embedded
      ? 'pay-card grid min-w-0 gap-3'
      : 'pay-card grid min-w-0 gap-3 rounded-2xl border border-[#e9e3f1] bg-white p-4',
    title: 'm-0 text-lg font-semibold',
    primary: 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#5b3a8e] px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-[#4b2f77] disabled:cursor-not-allowed disabled:opacity-60',
    back: 'inline-flex items-center gap-1 px-1 py-2 text-sm font-semibold text-[#73698a] hover:text-[#221a2e]',
    fine: 'm-0 text-xs text-[#73698a]',
  };

  const backLink = (
    <Link href={backHref} onClick={onBackClick} className={ui.back}>
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      {t('enrollment.wizard.back', 'Back')}
    </Link>
  );

  const styles = (
    <style>{`
      html.ips-embedded, html.ips-embedded body { min-height: 0 !important; height: auto !important; background: transparent; }
      html.ips-embedded body > div, html.ips-embedded main { min-height: 0 !important; }
      html.ips-embedded .pay-root { min-height: 0; max-width: none; margin: 0; padding: 14px; background: transparent; }
    `}</style>
  );

  /** A short state screen (loading, error, success) in the step's card. */
  const stateScreen = (content: React.ReactNode) => (
    <div className={ui.root} dir={direction}>
      {styles}
      <div className={ui.inner}>
        <section className={ui.card}>{content}</section>
      </div>
    </div>
  );

  if (loading) {
    return stateScreen(
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#73698a]" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-[#5b3a8e]" />
        <span>
          {isParentEnrollment
            ? t('user.payments.checkout.processingParentEnrollment', 'Processing enrollment...')
            : t('user.payments.checkout.loading', 'Loading payment information...')}
        </span>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return stateScreen(
      <>
        <p className="m-0 rounded-xl border border-[#f1c9c4] bg-[#fff6f5] px-3 py-2 text-sm font-semibold text-[#b3392f]" role="alert">
          {error || t('user.payments.checkout.infoNotFound', 'Payment information not found')}
        </p>
        {enrollmentToken && (
          <div>
            <Link href={backHref} onClick={onBackClick} className={ui.back}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t('wizard.backToWizard', 'Back to Enrollment Wizard')}
            </Link>
          </div>
        )}
      </>
    );
  }

  if (success) {
    return stateScreen(
      <div className="grid justify-items-center gap-2 py-4 text-center" role="status">
        <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#e6f4ec] text-[#1f7a4a]" aria-hidden="true">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h2 className="m-0 text-lg font-semibold">
          {isSetupMode
            ? t('user.payments.checkout.cardSaved', 'Card Saved Successfully!')
            : t('user.payments.checkout.success', 'Payment Successful!')}
        </h2>
        <p className="m-0 text-[13.5px] text-[#73698a]">
          {isSetupMode
            ? t('user.payments.checkout.cardSavedDesc', 'Your payment method has been saved for future payments.')
            : t('user.payments.checkout.successDesc', 'Your payment has been processed successfully.')}
        </p>
        <p className="m-0 text-xs text-[#73698a]">{t('user.payments.checkout.redirecting', 'Redirecting...')}</p>
      </div>
    );
  }

  // ----- What the summary row and the explanation line say -----
  const plan = paymentInfo.payment_plan;
  const planType = plan?.plan_type || '';
  const freq = plan?.installment_frequency || '';
  const isPerSession = planType === 'per_session';
  const isDeposit = !isSetupMode && paymentInfo.payment_type === 'deposit';

  const countText = (count: number) => {
    const c = String(count);
    if (freq === 'weekly') return t('enrollment.wizard.compact.plan.weekly', '{count} weekly payments').replace('{count}', c);
    if (freq === 'biweekly') return t('enrollment.wizard.compact.plan.biweekly', '{count} payments every two weeks').replace('{count}', c);
    if (freq === 'monthly') return t('enrollment.wizard.compact.plan.monthly', '{count} monthly payments').replace('{count}', c);
    if (plan?.custom_frequency_days) {
      return t('enrollment.wizard.compact.plan.custom', '{count} payments, every {days} days')
        .replace('{count}', c)
        .replace('{days}', String(plan.custom_frequency_days));
    }
    return '';
  };
  /** "once a week" etc., or '' when the plan's rhythm isn't known. */
  const whenText = (f: string) => {
    if (f === 'weekly') return t('enrollment.wizard.compact.pay.when.weekly', 'once a week');
    if (f === 'biweekly') return t('enrollment.wizard.compact.pay.when.biweekly', 'every two weeks');
    if (f === 'monthly') return t('enrollment.wizard.compact.pay.when.monthly', 'once a month');
    if (f === 'yearly') return t('enrollment.wizard.compact.pay.when.yearly', 'once a year');
    return '';
  };

  // The plan line.
  let planLine = plan?.plan_name || '';
  const installments = plan?.installment_count || 0;
  if (isPerSession) {
    planLine = t('enrollment.wizard.compact.pay.perSession', 'Pay per session');
  } else if (planType === 'one_time' && plan?.plan_name !== t('user.payments.checkout.planType.free', 'Free')) {
    planLine = t('enrollment.wizard.compact.plan.oneTime', 'One payment');
  } else if (planType === 'deposit' && installments > 0 && countText(installments)) {
    planLine = t('enrollment.wizard.compact.pay.depositPlan', 'Deposit + {payments}').replace('{payments}', countText(installments));
  } else if ((planType === 'installments' || planType === 'recurring') && installments > 0 && countText(installments)) {
    planLine = countText(installments);
  } else if (planType === 'subscription') {
    const sf = plan?.subscription_frequency || 'monthly';
    planLine = sf === 'weekly'
      ? t('enrollment.wizard.compact.pay.subWeekly', 'Weekly membership')
      : sf === 'yearly'
        ? t('enrollment.wizard.compact.pay.subYearly', 'Yearly membership')
        : t('enrollment.wizard.compact.pay.subMonthly', 'Monthly membership');
  }

  // The muted line under it.
  const subParts: string[] = [embedded ? itemLabel(paymentInfo, t) : ''];
  if (isPerSession) {
    subParts.push(t('enrollment.wizard.compact.pay.perSessionSub', 'Each session is charged only after it is held'));
  } else if (isDeposit) {
    subParts.push(
      t('enrollment.wizard.compact.pay.depositSub', 'Deposit · balance {remaining} of {total}')
        .replace('{remaining}', money(paymentInfo.enrollment_total - paymentInfo.amount))
        .replace('{total}', money(paymentInfo.enrollment_total))
    );
  } else if (isSetupMode) {
    if (isParentEnrollment) {
      subParts.push(`${t('enrollment.wizard.compact.payment.total', 'Total')} ${money(paymentInfo.enrollment_total)}`);
    } else if (paymentInfo.later_first_date) {
      subParts.push(t('enrollment.wizard.compact.pay.firstOn', 'First payment on {date}').replace('{date}', formatDate(paymentInfo.later_first_date)));
    }
  } else if (paymentInfo.total_count > 1 && paymentInfo.payment_number > 0) {
    subParts.push(
      t('enrollment.wizard.compact.pay.paymentOf', 'Payment {n} of {total}')
        .replace('{n}', String(paymentInfo.payment_number))
        .replace('{total}', String(paymentInfo.total_count))
    );
  }
  const subLine = subParts.filter(Boolean).join(' · ');

  const usingSavedCard = !!savedCard && !showNewCardForm;

  // The one line about what is charged later.
  let laterLine = '';
  if (isParentEnrollment) {
    laterLine = t('user.payments.checkout.noChargeNow', 'No charge will be made now. Your card will be saved for future scheduled payments.');
  } else if (isSetupMode) {
    if (isPerSession) {
      laterLine = plan?.session_amount
        ? t('enrollment.wizard.compact.pay.setupPerSessionAmount', 'Nothing is charged now. After each session, {amount} will be charged to this card.').replace('{amount}', money(plan.session_amount))
        : t('enrollment.wizard.compact.pay.setupPerSession', 'Nothing is charged now. Each session is charged to this card after it is held.');
    } else if (paymentInfo.later_first_date) {
      laterLine = t('enrollment.wizard.compact.pay.setupLater', 'Nothing is charged now. The first payment will be charged to this card on {date}.').replace('{date}', formatDate(paymentInfo.later_first_date));
    } else {
      laterLine = t('enrollment.wizard.compact.pay.setupGeneric', 'Nothing is charged now. The payments will be charged to this card on their payment dates.');
    }
  } else if (planType === 'subscription' && paymentInfo.later_count === 0) {
    const when = whenText(plan?.subscription_frequency || 'monthly');
    laterLine = t('enrollment.wizard.compact.pay.subRenews', 'The membership renews automatically from this card, {when}.').replace('{when}', when);
  } else if (paymentInfo.later_count === 0) {
    laterLine = t('enrollment.wizard.compact.pay.nothingLater', 'Nothing else will be charged later.');
  } else if (paymentInfo.later_count === 1 && paymentInfo.later_first_date) {
    laterLine = t('enrollment.wizard.compact.pay.laterOne', 'The next payment will be charged automatically to this card on {date}.').replace('{date}', formatDate(paymentInfo.later_first_date));
  } else if (whenText(freq)) {
    laterLine = (usingSavedCard
      ? t('enrollment.wizard.compact.pay.laterMany', 'The next {count} payments will be charged automatically to the card you chose, {when}.')
      : t('enrollment.wizard.compact.pay.laterManyNew', 'The card will be saved, and the next {count} payments will be charged to it automatically {when}.'))
      .replace('{count}', String(paymentInfo.later_count))
      .replace('{when}', whenText(freq));
  } else {
    laterLine = t('enrollment.wizard.compact.pay.laterGeneric', 'The remaining payments will be charged automatically to this card on their payment dates.');
  }

  // The step's one button: pay with the chosen saved card, or submit the Stripe form.
  const cardFormShown = !usingSavedCard && !checkingSavedCard && (isSetupMode ? !!stripeSetupData : !!stripeData);
  const buttonLabel = isSetupMode
    ? t('enrollment.wizard.compact.pay.saveButton', 'Save the card')
    : t('enrollment.wizard.compact.pay.payButton', 'Pay {amount}').replace('{amount}', money(paymentInfo.amount));
  const buttonDisabled = usingSavedCard ? false : !cardFormShown || !cardFormReady || cardFormProcessing;

  const cardOption = (selected: boolean, onSelect: () => void, badge: React.ReactNode, name: React.ReactNode, detail: string, key: string) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors ${
        selected ? 'border-[#5b3a8e] bg-[#fbf9fe] shadow-[inset_0_0_0_1px_#5b3a8e]' : 'border-[#e9e3f1] bg-white hover:border-[#c7b9de]'
      }`}
    >
      <span
        className={`h-[18px] w-[18px] flex-none rounded-full border-2 ${selected ? 'border-[#5b3a8e] bg-[#5b3a8e] shadow-[inset_0_0_0_3px_#fff]' : 'border-[#c7b9de]'}`}
        aria-hidden="true"
      />
      {badge}
      <span className="min-w-0">
        <span className="block font-bold">{name}</span>
        <span className="block text-[12.5px] text-[#73698a]">{detail}</span>
      </span>
    </button>
  );

  const cardMethods = allPaymentMethods.length > 0 ? allPaymentMethods : savedCard ? [savedCard] : [];

  return (
    <div className={ui.root} dir={direction}>
      {styles}
      <div className={ui.inner}>
        {/* Standalone page: what is being paid for (embedded, the portal card names it) */}
        {!embedded && (
          <div className="flex items-center gap-3 rounded-[14px] border border-[#e9e3f1] bg-white px-3 py-2.5">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImageUrl} alt="" className="h-[46px] w-[46px] flex-none rounded-[10px] object-cover" />
            ) : (
              <span className="h-[46px] w-[46px] flex-none rounded-[10px] bg-gradient-to-br from-[#8d6cc7] to-[#5b3a8e]" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="m-0 truncate text-base font-semibold">{paymentInfo.product_name}</h1>
              <div className="text-[13px] text-[#73698a]">{itemLabel(paymentInfo, t)}</div>
            </div>
            {paymentInfo.enrollment_total > 0 && (
              <div className="flex-none whitespace-nowrap text-end text-base font-bold">{money(paymentInfo.enrollment_total)}</div>
            )}
          </div>
        )}

        <section className={ui.card}>
          {!embedded && (
            <h2 className={ui.title}>
              {isSetupMode
                ? t('enrollment.wizard.compact.pay.titleSetup', 'Save card')
                : t('enrollment.wizard.compact.pay.title', 'Payment')}
            </h2>
          )}

          {/* One summary row: the plan, and what is charged today */}
          <div className="flex items-center justify-between gap-2.5 rounded-xl bg-[#f6f3fa] px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-[15px] font-bold">
                {planLine}
                {paymentInfo.can_change_plan && (
                  <Link href={backHref} onClick={onBackClick} className="ms-1.5 text-[13px] font-semibold text-[#5b3a8e] hover:underline">
                    {t('enrollment.wizard.compact.pay.change', 'Change')}
                  </Link>
                )}
              </div>
              {subLine && <div className="text-[12.5px] text-[#73698a]">{subLine}</div>}
            </div>
            <div className="flex-none whitespace-nowrap text-end text-xl font-bold">
              {money(isSetupMode ? 0 : paymentInfo.amount)}
              <small className="block text-xs font-normal text-[#73698a]">{t('enrollment.wizard.compact.pay.today', 'today')}</small>
            </div>
          </div>

          {/* How to pay: saved cards and "another card" */}
          {cardMethods.length > 0 && (
            <>
              <div className="-mb-1 text-[13.5px] font-semibold">{t('enrollment.wizard.compact.pay.howToPay', 'How to pay')}</div>
              <div className="grid gap-2" role="radiogroup" aria-label={t('enrollment.wizard.compact.pay.howToPay', 'How to pay')}>
                {cardMethods.map((method: any) =>
                  cardOption(
                    usingSavedCard && selectedPaymentMethodId === method.id,
                    () => chooseSavedCard(method),
                    <span className="h-[26px] w-10 flex-none rounded-md bg-[#1a1f71] text-center text-[10px] font-bold leading-[26px] tracking-wide text-white" aria-hidden="true">
                      {brandMark(method.brand)}
                    </span>,
                    <span dir="ltr" className="block text-start rtl:text-right">•••• {method.last4}</span>,
                    t('enrollment.wizard.compact.pay.cardMeta', 'Expires {date} · Saved in your account')
                      .replace('{date}', `${String(method.exp_month ?? '').padStart(2, '0')}/${method.exp_year ?? ''}`),
                    method.id
                  )
                )}
                {cardOption(
                  !usingSavedCard,
                  chooseNewCard,
                  <span className="grid h-[26px] w-10 flex-none place-items-center rounded-md bg-[#f1ebf8] text-[#5b3a8e]" aria-hidden="true">
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </span>,
                  t('enrollment.wizard.compact.pay.otherCard', 'Another card'),
                  t('enrollment.wizard.compact.pay.otherCardSub', 'The new card will be saved for the next payments'),
                  'new-card'
                )}
              </div>
            </>
          )}

          {/* The Stripe card form, in place (no saved card, or "another card") */}
          {!usingSavedCard && (
            checkingSavedCard ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#73698a]">
                <Loader2 className="h-5 w-5 animate-spin text-[#5b3a8e]" />
                <span>{t('user.payments.checkout.checkingCard', 'Checking payment method...')}</span>
              </div>
            ) : isSetupMode ? (
              // Setup Intent mode - save card without charging
              !stripeSetupData ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#73698a]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5b3a8e]" />
                  <span>{t('user.payments.checkout.preparingForm', 'Preparing form...')}</span>
                </div>
              ) : (
                <StripeSetupForm
                  clientSecret={stripeSetupData.clientSecret}
                  publishableKey={stripeSetupData.publishableKey}
                  onSuccess={handleSetupSuccess}
                  onError={handleSetupError}
                  compact={{ formId: CARD_FORM_ID, onReadyChange: setCardFormReady, onProcessingChange: setCardFormProcessing }}
                />
              )
            ) : (
              // Payment Intent mode - charge now
              !stripeData ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#73698a]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5b3a8e]" />
                  <span>{t('user.payments.checkout.preparingPayment', 'Preparing payment...')}</span>
                </div>
              ) : (
                <StripePaymentForm
                  clientSecret={stripeData.clientSecret}
                  publishableKey={stripeData.publishableKey}
                  amount={paymentInfo.amount}
                  currency={paymentInfo.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  compact={{ formId: CARD_FORM_ID, onReadyChange: setCardFormReady, onProcessingChange: setCardFormProcessing }}
                />
              )
            )
          )}

          {laterLine && <p className={ui.fine}>{laterLine}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {backLink}
            {usingSavedCard ? (
              <button type="button" className={ui.primary} onClick={() => payWithSavedCard(selectedPaymentMethodId)}>
                {buttonLabel}
              </button>
            ) : (
              <button type="submit" form={CARD_FORM_ID} className={ui.primary} disabled={buttonDisabled}>
                {cardFormProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSetupMode
                      ? t('payments.setup.processing', 'Saving card...')
                      : t('user.payments.checkout.processing', 'Processing...')}
                  </>
                ) : (
                  buttonLabel
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-[#73698a]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('enrollment.wizard.compact.pay.secure', 'Secure payment with Stripe')}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
