'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Info } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

interface SetupFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function SetupForm({ clientSecret, onSuccess, onError }: SetupFormProps) {
  const { t } = useUserLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // Use confirmSetup for Setup Intent (no charge)
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href, // Will redirect back to same page
        },
        redirect: 'if_required', // Only redirect if required by payment method
      });

      if (error) {
        setMessage(error.message || 'An error occurred');
        onError(error.message || 'Card setup failed');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred');
      onError(err.message || 'Card setup failed');
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
            {t('payments.setup.processing', 'Saving card...')}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('payments.setup.saveCard', 'Save Card & Continue')}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t('payments.setup.noChargeNotice', 'Your card will not be charged now. It will be saved for future scheduled payments.')}
      </p>
    </form>
  );
}

interface StripeSetupFormProps {
  clientSecret: string;
  publishableKey: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripeSetupForm({
  clientSecret,
  publishableKey,
  onSuccess,
  onError,
}: StripeSetupFormProps) {
  const { t, language } = useUserLanguage();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Load Stripe with publishable key from database and locale
  useEffect(() => {
    if (publishableKey) {
      // Set Stripe locale based on user language
      const stripeLocale = language === 'he' ? 'he' : 'en';
      console.log('[Stripe Setup] Loading with locale:', stripeLocale, 'User language:', language);
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
        <span className="ml-3">{t('payments.setup.loadingForm', 'Loading payment form...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('payments.setup.saveCardNotice', 'Save your payment method for future automatic payments. No charge will be made now.')}
        </AlertDescription>
      </Alert>

      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          {t('payments.setup.testMode', 'Test Mode: Use card 4242 4242 4242 4242 with any future date and CVC')}
        </AlertDescription>
      </Alert>

      <Elements stripe={stripePromise} options={options}>
        <SetupForm
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
