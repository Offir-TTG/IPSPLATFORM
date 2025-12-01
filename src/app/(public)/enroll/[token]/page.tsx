'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, DollarSign, Book } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';

interface PaymentPlanData {
  type: 'named_plan' | 'deposit_then_plan' | 'subscription' | 'one_time' | 'free';
  name?: string;
  installments?: number;
  frequency?: string;
  interval?: string;
  deposit_type?: 'percentage' | 'fixed' | 'none';
  deposit_amount?: number;
  deposit_percentage?: number;
  installment_amount?: number;
}

interface EnrollmentData {
  id: string;
  product_name: string;
  product_type: string;
  product_description?: string;
  total_amount: number;
  currency: string;
  payment_plan_data?: PaymentPlanData | null;
  payment_model: string;
  token_expires_at: string;
  status: string;
  user_email: string;
}

export default function EnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { t, direction, language } = useLanguage();
  const isRTL = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Debug: Log language and direction
  useEffect(() => {
    console.log('Enrollment Page - Language:', language, 'Direction:', direction, 'isRTL:', isRTL);
    console.log('Book icon should be on:', isRTL ? 'RIGHT' : 'LEFT');
    console.log('Clock icon should be on:', isRTL ? 'RIGHT' : 'LEFT');
  }, [language, direction, isRTL]);

  useEffect(() => {
    fetchEnrollment();
  }, [token]);

  // Helper function to strip HTML tags from text
  const stripHtmlTags = (html: string): string => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const fetchEnrollment = async () => {
    try {
      const response = await fetch(`/api/enrollments/token/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid or expired link');
      }

      const data = await response.json();
      setEnrollment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    // Check if user is logged in first using Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/enroll/${token}`);
      return;
    }

    // Accept enrollment
    setAccepting(true);
    try {
      const response = await fetch(`/api/enrollments/token/${token}/accept`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept enrollment');
      }

      const data = await response.json();

      // Redirect based on payment requirements
      if (data.requires_payment && data.payment_url) {
        router.push(data.payment_url);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white" dir={direction}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-muted-foreground" suppressHydrationWarning>{t('enrollment.loading', 'Loading your invitation...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white" dir={direction}>
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <div className={`flex items-center gap-2 text-red-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <XCircle className="h-6 w-6" />
              <CardTitle style={{ textAlign: isRTL ? 'right' : 'left' }} suppressHydrationWarning>
                {t('enrollment.error.title', 'Invalid Link')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4" style={{ textAlign: isRTL ? 'right' : 'left' }} suppressHydrationWarning>{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
              suppressHydrationWarning
            >
              {t('enrollment.error.loginButton', 'Go to Login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  const isExpiringSoon = new Date(enrollment.token_expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Helper function to render payment plan with proper RTL support
  const renderPaymentPlanDetails = (planData: PaymentPlanData | null | undefined) => {
    if (!planData) return null;

    switch (planData.type) {
      case 'named_plan':
        return <span>{planData.name || ''}</span>;

      case 'deposit_then_plan':
        const count = planData.installments || 0;
        const frequencyKey = planData.frequency || 'monthly';
        const frequencyText = t(`enrollment.paymentPlan.frequency.${frequencyKey}`, frequencyKey);

        return (
          <div className="space-y-1">
            {/* Deposit line */}
            {(planData.deposit_type === 'fixed' || planData.deposit_type === 'percentage') && (
              <div>
                <span suppressHydrationWarning>{t('enrollment.paymentPlan.deposit', 'Deposit')}: </span>
                <span className="font-semibold" dir="ltr">
                  {planData.deposit_type === 'fixed' && planData.deposit_amount
                    ? `${enrollment?.currency} ${planData.deposit_amount.toFixed(2)}`
                    : `${planData.deposit_percentage}%`}
                </span>
              </div>
            )}

            {/* Installments line */}
            <div>
              <span suppressHydrationWarning>{count} {t('enrollment.paymentPlan.installmentsOf', 'installments of')} </span>
              <span className="font-semibold" dir="ltr">
                {planData.installment_amount && planData.installment_amount > 0
                  ? `${enrollment?.currency} ${planData.installment_amount.toFixed(2)}`
                  : ''}
              </span>
              <span suppressHydrationWarning> {frequencyText}</span>
            </div>
          </div>
        );

      case 'subscription':
        const intervalKey = planData.interval || 'monthly';
        const intervalText = t(`enrollment.paymentPlan.interval.${intervalKey}`, intervalKey);
        return (
          <span suppressHydrationWarning>
            {t('enrollment.paymentPlan.subscriptionText', 'Subscription')} {intervalText}
          </span>
        );

      case 'one_time':
        return <span suppressHydrationWarning>{t('enrollment.paymentPlan.oneTime', 'One-time payment')}</span>;

      case 'free':
        return <span suppressHydrationWarning>{t('enrollment.paymentPlan.free', 'Free')}</span>;

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 p-4"
      dir={direction}
      style={{ textAlign: isRTL ? 'right' : 'left' }}
    >
      <div className="max-w-2xl mx-auto mt-20">
        <Card className="shadow-2xl" dir={direction} style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold mb-2" suppressHydrationWarning>
              {t('enrollment.header.title', 'You\'re Invited!')}
            </CardTitle>
            <CardDescription className="text-purple-100" suppressHydrationWarning>
              {t('enrollment.header.subtitle', 'You\'ve been invited to enroll in the following:')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6" dir={direction} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* DEBUG: Visual RTL indicator */}
            <div className="text-xs text-center p-2 bg-yellow-100 border border-yellow-300 rounded">
              DEBUG: isRTL = {isRTL ? 'TRUE (Hebrew)' : 'FALSE (English)'} | Direction = {direction}
            </div>

            {/* Product Details */}
            <div className={`py-3 bg-purple-50 ${isRTL ? 'border-r-4 pr-4 rounded-l-lg' : 'border-l-4 pl-4 rounded-r-lg'} border-purple-500`}>
              <div key={`product-${direction}`} className="flex items-start gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {!isRTL && <Book key="book-ltr" className="h-6 w-6 text-purple-600 mt-1" />}
                <div className="flex-1" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                  <h3 className="font-semibold text-xl text-gray-900">{enrollment.product_name}</h3>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Badge variant="outline" className="text-xs" suppressHydrationWarning>
                      {t(`enrollment.productType.${enrollment.product_type}`, enrollment.product_type)}
                    </Badge>
                  </div>
                  {enrollment.product_description && (
                    <p className="text-sm text-muted-foreground mt-2" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                      {stripHtmlTags(enrollment.product_description)}
                    </p>
                  )}
                </div>
                {isRTL && <Book key="book-rtl" className="h-6 w-6 text-purple-600 mt-1" />}
              </div>
            </div>

            {/* Pricing Info */}
            {enrollment.total_amount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200" style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700" suppressHydrationWarning>
                      {t('enrollment.pricing.totalAmount', 'Total Amount')}:
                    </span>
                  </div>
                  <span className="font-bold text-2xl text-gray-900">
                    {enrollment.currency} {enrollment.total_amount.toFixed(2)}
                  </span>
                </div>
                {enrollment.payment_plan_data && (
                  <div className="text-sm text-muted-foreground mt-2 pt-2 border-t" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="font-medium mb-1" suppressHydrationWarning>{t('enrollment.pricing.paymentPlan', 'Payment Plan')}:</div>
                    {renderPaymentPlanDetails(enrollment.payment_plan_data)}
                  </div>
                )}
              </div>
            )}

            {enrollment.payment_model === 'free' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700 font-medium text-center" suppressHydrationWarning>
                  {t('enrollment.pricing.free', '🎉 This enrollment is completely free!')}
                </p>
              </div>
            )}

            {/* User Email Verification */}
            <div className="text-sm text-muted-foreground text-center bg-blue-50 p-3 rounded-lg">
              <span className="font-medium" suppressHydrationWarning>{t('enrollment.verification.sentTo', 'Invitation sent to:')}</span> {enrollment.user_email}
            </div>

            {/* Expiration Warning */}
            <Alert className={isExpiringSoon ? 'border-orange-500 bg-orange-50' : ''}>
              <div key={`expiry-${direction}`} className="flex items-start gap-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {!isRTL && <Clock key="clock-ltr" className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isExpiringSoon ? 'text-orange-600' : ''}`} />}
                <AlertDescription className={`flex-1 ${isExpiringSoon ? 'text-orange-800' : ''}`} style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }} suppressHydrationWarning>
                  {isExpiringSoon && <strong suppressHydrationWarning>{t('enrollment.expiry.soon', '⚠️ Expiring soon!')} </strong>}
                  {t('enrollment.expiry.expires', 'This invitation expires')} {formatDistanceToNow(new Date(enrollment.token_expires_at), { addSuffix: true, locale: language === 'he' ? he : enUS })}
                </AlertDescription>
                {isRTL && <Clock key="clock-rtl" className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isExpiringSoon ? 'text-orange-600' : ''}`} />}
              </div>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} suppressHydrationWarning>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('enrollment.action.processing', 'Processing...')}
                  </span>
                ) : (
                  <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} suppressHydrationWarning>
                    <CheckCircle2 className="h-5 w-5" />
                    {t('enrollment.action.accept', 'Accept Enrollment')}
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground" suppressHydrationWarning>
                {t('enrollment.action.terms', 'By accepting, you agree to the terms and conditions')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p suppressHydrationWarning>{t('enrollment.help.text', 'Need help? Contact support for assistance.')}</p>
        </div>
      </div>
    </div>
  );
}
