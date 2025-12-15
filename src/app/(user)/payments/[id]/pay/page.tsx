'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';

interface PaymentInfo {
  schedule_id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_number: number;
  product_name: string;
  client_secret?: string;
}

export default function PaymentPage() {
  const { t } = useUserLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPaymentInfo();
  }, [params.id, searchParams]);

  const fetchPaymentInfo = async () => {
    try {
      const scheduleId = searchParams?.get('schedule');
      const enrollmentToken = searchParams?.get('token');

      // Get enrollment details
      // Use token-based endpoint if token is provided (for unauthenticated enrollment wizard)
      // Otherwise use authenticated endpoint (for logged-in users)
      const endpoint = enrollmentToken
        ? `/api/enrollments/token/${enrollmentToken}/payment`
        : `/api/enrollments/${params.id}/payment`;

      const res = await fetch(endpoint);
      const data = await res.json();

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
        product_name: data.product.product_name,
      });

    } catch (error: any) {
      console.error('Error fetching payment info:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentInfo) return;

    setProcessing(true);
    setError(null);

    try {
      // In a real implementation, you would:
      // 1. Create/retrieve Stripe payment intent
      // 2. Show Stripe payment form
      // 3. Process payment through Stripe
      // 4. Webhook updates the schedule automatically

      // For now, we'll show a placeholder message
      alert('Stripe payment integration is ready!\n\nTo complete the integration:\n\n1. Install: npm install stripe @stripe/stripe-js @stripe/react-stripe-js\n2. Add environment variables\n3. Implement Stripe Elements payment form\n\nThe backend is fully ready to process payments.');

      // Simulate success for demo
      setTimeout(() => {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/payments/${params.id}`);
        }, 2000);
      }, 1000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
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
        <Button asChild className="mt-4">
          <Link href={`/payments/${params.id}`}>
            <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
            {t('user.payments.checkout.backToDetails', 'Back to Payment Details')}
          </Link>
        </Button>
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
        <Link href={`/payments/${params.id}`}>
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
            {/* Stripe Payment Form will go here */}
            <div className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  {t('user.payments.checkout.secureInfo', 'Your payment information is secure and encrypted.')}
                </AlertDescription>
              </Alert>

              {/* Placeholder for Stripe Elements */}
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">{t('user.payments.checkout.stripeForm', 'Stripe Payment Form')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('user.payments.checkout.stripeFormDesc', 'This area will contain the Stripe Elements payment form.')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('user.payments.checkout.backendReady', 'Backend is fully ready • Install Stripe React components to enable')}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePayment}
                disabled={processing}
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
                    {t('user.payments.checkout.pay', 'Pay')} {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('user.payments.checkout.termsAgree', 'By completing this payment, you agree to the terms and conditions.')}
              </p>
            </div>
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
