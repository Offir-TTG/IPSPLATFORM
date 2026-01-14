'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ clientSecret, amount, currency, onSuccess, onError }: CheckoutFormProps) {
  const { t } = useUserLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

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

      <p className="text-xs text-center text-muted-foreground">
        {t('user.payments.checkout.termsAgree', 'By completing this payment, you agree to the terms and conditions.')}
      </p>
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
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  amount,
  currency,
  onSuccess,
  onError,
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
    appearance: {
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">{t('user.payments.checkout.loadingStripe', 'Loading payment form...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          {t('user.payments.checkout.testMode', 'Test Mode: Use card 4242 4242 4242 4242 with any future date and CVC')}
        </AlertDescription>
      </Alert>

      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          clientSecret={clientSecret}
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
