'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import StripePaymentForm from '@/components/payments/StripePaymentForm';

interface PaymentInfo {
  schedule_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_number: number;
  product_name: string;
}

interface StripePaymentData {
  clientSecret: string;
  payment_intent_id: string;
  publishableKey: string;
}

export default function WizardPaymentPage() {
  const { t } = useUserLanguage();
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

  useEffect(() => {
    if (!enrollmentToken) {
      setError('Invalid enrollment token');
      setLoading(false);
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

  useEffect(() => {
    if (paymentInfo && !stripeData && !intentCreatedRef.current) {
      intentCreatedRef.current = true; // Mark as creating
      createPaymentIntent();
    }
    // Only run when paymentInfo becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentInfo]);

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
    <div className="container mx-auto py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/enroll/wizard/${params.id}?token=${enrollmentToken}`}>
          <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
          {t('user.payments.checkout.back', 'Back')}
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('user.payments.checkout.summary', 'Payment Summary')}</CardTitle>
            <CardDescription>{t('user.payments.checkout.reviewDetails', 'Review your payment details')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.course', 'Course')}</span>
              <span className="font-medium">{paymentInfo.product_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.paymentType', 'Payment Type')}</span>
              <span className="font-medium capitalize">{paymentInfo.payment_type}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('user.payments.checkout.paymentNumber', 'Payment Number')}</span>
              <span className="font-medium">#{paymentInfo.payment_number}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-lg font-semibold">{t('user.payments.checkout.totalAmount', 'Total Amount')}</span>
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
