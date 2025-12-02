'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/AppContext';

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
  const [mounted, setMounted] = useState(false);

  // Ensure client-side rendering for translations
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchEnrollment();
    }
  }, [token, mounted]);

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
    // NO AUTHENTICATION REQUIRED - token-based enrollment flow
    // User account will be created at the end of the wizard
    // This prevents "ghost accounts" from abandoned enrollments

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

      // Redirect to enrollment wizard with token
      if (data.wizard_url) {
        router.push(data.wizard_url);
      } else {
        // Fallback if wizard_url is not provided
        router.push(`/enroll/wizard/${data.enrollment_id}?token=${token}`);
      }
    } catch (err: any) {
      setError(err.message);
      setAccepting(false);
    }
  };

  // Show loading only when fetching data, not when mounting
  // This ensures the page always renders even after refresh
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white" dir={direction}>
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {t('enrollment.error.title', 'Invalid Link')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
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
                <span>{t('enrollment.paymentPlan.deposit', 'Deposit')}: </span>
                <span className="font-semibold" dir="ltr">
                  {planData.deposit_type === 'fixed' && planData.deposit_amount
                    ? `${enrollment?.currency} ${planData.deposit_amount.toFixed(2)}`
                    : `${planData.deposit_percentage}%`}
                </span>
              </div>
            )}

            {/* Installments line */}
            <div>
              <span>{count} {t('enrollment.paymentPlan.installmentsOf', 'installments of')} </span>
              <span className="font-semibold" dir="ltr">
                {planData.installment_amount && planData.installment_amount > 0
                  ? `${enrollment?.currency} ${planData.installment_amount.toFixed(2)}`
                  : ''}
              </span>
              <span> {frequencyText}</span>
            </div>
          </div>
        );

      case 'subscription':
        const intervalKey = planData.interval || 'monthly';
        const intervalText = t(`enrollment.paymentPlan.interval.${intervalKey}`, intervalKey);
        return (
          <span>
            {t('enrollment.paymentPlan.subscriptionText', 'Subscription')} {intervalText}
          </span>
        );

      case 'one_time':
        return <span>{t('enrollment.paymentPlan.oneTime', 'One-time payment')}</span>;

      case 'free':
        return <span>{t('enrollment.paymentPlan.free', 'Free')}</span>;

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
            <CardTitle className="text-3xl font-bold mb-2">
              {t('enrollment.header.title', 'You\'re Invited!')}
            </CardTitle>
            <CardDescription className="text-purple-100">
              {t('enrollment.header.subtitle', 'You\'ve been invited to enroll in the following:')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6" dir={direction} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Product Details */}
            <div className={`py-3 bg-purple-50 ${isRTL ? 'border-r-4 pr-4 rounded-l-lg' : 'border-l-4 pl-4 rounded-r-lg'} border-purple-500`}>
              <div style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                <h3 className="font-semibold text-xl text-gray-900">{enrollment.product_name}</h3>
                <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Badge variant="outline" className="text-xs">
                    {t(`enrollment.productType.${enrollment.product_type}`, enrollment.product_type)}
                  </Badge>
                </div>
                {enrollment.product_description && (
                  <p className="text-sm text-muted-foreground mt-2" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                    {stripHtmlTags(enrollment.product_description)}
                  </p>
                )}
              </div>
            </div>

            {/* Pricing Info */}
            {enrollment.total_amount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200" style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                <div className="mb-2 space-y-1">
                  <div className="font-medium text-gray-700">
                    {t('enrollment.pricing.totalAmount', 'Total Amount')}:
                  </div>
                  <div className={`font-bold text-xl text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
                    {enrollment.currency} {enrollment.total_amount.toFixed(2)}
                  </div>
                </div>
                {enrollment.payment_plan_data && (
                  <div className="text-sm text-muted-foreground mt-2 pt-2 border-t" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="font-medium mb-1">{t('enrollment.pricing.paymentPlan', 'Payment Plan')}:</div>
                    {renderPaymentPlanDetails(enrollment.payment_plan_data)}
                  </div>
                )}
              </div>
            )}

            {enrollment.payment_model === 'free' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700 font-medium text-center">
                  {t('enrollment.pricing.free', '🎉 This enrollment is completely free!')}
                </p>
              </div>
            )}

            {/* User Email Verification */}
            <div className="text-sm text-muted-foreground text-center bg-blue-50 p-3 rounded-lg">
              <span className="font-medium">{t('enrollment.verification.sentTo', 'Invitation sent to:')}</span> {enrollment.user_email}
            </div>

            {/* Expiration Warning */}
            <Alert className={isExpiringSoon ? 'border-orange-500 bg-orange-50' : ''}>
              <AlertDescription className={`text-center ${isExpiringSoon ? 'text-orange-800' : ''}`}>
                {isExpiringSoon && <strong>{t('enrollment.expiry.soon', '⚠️ Expiring soon!')} </strong>}
                {t('enrollment.expiry.expires', 'This invitation expires')} {formatDistanceToNow(new Date(enrollment.token_expires_at), { addSuffix: true, locale: language === 'he' ? he : enUS })}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting
                  ? t('enrollment.action.processing', 'Processing...')
                  : t('enrollment.action.accept', 'Accept Enrollment')
                }
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t('enrollment.action.terms', 'By accepting, you agree to the terms and conditions')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('enrollment.help.text', 'Need help? Contact support for assistance.')}</p>
        </div>
      </div>
    </div>
  );
}
