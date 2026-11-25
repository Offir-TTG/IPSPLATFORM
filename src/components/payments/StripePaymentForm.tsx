'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

/**
 * Compact use (the enrollment payment step): the form has no button or
 * notices of its own; a button outside submits it by `formId`, and the form
 * reports when it is ready and while it is processing.
 */
export interface CompactFormOptions {
  formId: string;
  onReadyChange?: (ready: boolean) => void;
  onProcessingChange?: (processing: boolean) => void;
}

/** The portal's colors for the Stripe fields in the compact look. */
const COMPACT_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#5b3a8e',
    colorBackground: '#ffffff',
    colorText: '#221a2e',
    colorTextSecondary: '#73698a',
    colorDanger: '#b3392f',
    borderRadius: '10px',
  },
};

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  compact?: CompactFormOptions;
}

function CheckoutForm({ clientSecret, amount, currency, onSuccess, onError, compact }: CheckoutFormProps) {
  const { t } = useUserLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onReadyChange = compact?.onReadyChange;
  const onProcessingChange = compact?.onProcessingChange;
  useEffect(() => {
    onReadyChange?.(!!stripe && !!elements);
  }, [stripe, elements, onReadyChange]);
  useEffect(() => {
    onProcessingChange?.(processing);
  }, [processing, onProcessingChange]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href, // Will redirect back to same page
        },
        redirect: 'if_required', // Only redirect if required by payment method
      });

      if (error) {
        setMessage(error.message || 'An error occurred');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred');
      onError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form id={compact?.formId} onSubmit={handleSubmit} className={compact ? 'grid gap-3' : 'space-y-4'}>
      <PaymentElement />

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!compact && (
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
              {t('user.payments.checkout.processing', 'Processing...')}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('user.payments.checkout.pay', 'Pay')} {formatCurrency(amount, currency)}
            </>
          )}
        </Button>
      )}

      {!compact && (
        <p className="text-xs text-center text-muted-foreground">
          {t('user.payments.checkout.termsAgree', 'By completing this payment, you agree to the terms and conditions.')}
        </p>
      )}
    </form>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  compact?: CompactFormOptions;
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  amount,
  currency,
  onSuccess,
  onError,
  compact,
}: StripePaymentFormProps) {
  const { t, language } = useUserLanguage();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe with publishable key from database and locale
  useEffect(() => {
    if (publishableKey) {
      // Set Stripe locale based on user language
      const stripeLocale = language === 'he' ? 'he' : 'en';
      console.log('[Stripe] Loading with locale:', stripeLocale, 'User language:', language);
      setStripePromise(loadStripe(publishableKey, {
        locale: stripeLocale as any, // Stripe supports 'he' for Hebrew
      }));
    }
  }, [publishableKey, language]);

  const options = {
    clientSecret,
    appearance: compact
      ? COMPACT_APPEARANCE
      : {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorBackground: 'hsl(var(--background))',
            colorText: 'hsl(var(--foreground))',
            colorDanger: 'hsl(var(--destructive))',
            borderRadius: 'var(--radius)',
          },
        },
  };

  if (!stripePromise) {
    return (
      <div className={compact ? 'flex items-center justify-center gap-2 py-6 text-sm text-[#73698a]' : 'flex items-center justify-center py-8'}>
        <Loader2 className={compact ? 'h-5 w-5 animate-spin text-[#5b3a8e]' : 'h-8 w-8 animate-spin text-primary'} />
        <span className={compact ? '' : 'ml-3'}>{t('user.payments.checkout.loadingStripe', 'Loading payment form...')}</span>
      </div>
    );
  }

  // Compact: the test-card hint only with test keys.
  const showTestHint = !compact || publishableKey.startsWith('pk_test_');

  return (
    <div className={compact ? 'grid gap-3' : 'space-y-4'}>
      {showTestHint && (
        <Alert className={compact ? 'py-2 text-xs' : undefined}>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {t('user.payments.checkout.testMode', 'Test Mode: Use card 4242 4242 4242 4242 with any future date and CVC')}
          </AlertDescription>
        </Alert>
      )}

      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          clientSecret={clientSecret}
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onError={onError}
          compact={compact}
        />
      </Elements>
    </div>
  );
}
