'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Mail, UserPlus, Calendar, CreditCard, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/AppContext';

interface PaymentPlanData {
  type: 'named_plan' | 'deposit_then_plan' | 'subscription' | 'one_time' | 'free' | 'multiple_plans';
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
  product_id: string;
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
  enrollment_type?: string; // 'admin_invited' | 'self_enrolled'
  has_multiple_plans?: boolean;
  alternative_payment_plan_ids?: string[];
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

  // Helper function to sanitize HTML - allow only safe formatting tags
  const sanitizeHtml = (html: string): string => {
    if (typeof window === 'undefined') return html;

    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Remove all dangerous elements and attributes
    const removeElements = tmp.querySelectorAll('script, style, iframe, object, embed');
    removeElements.forEach(el => el.remove());

    // Convert block elements to line breaks while preserving inline formatting
    const blockElements = tmp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
    blockElements.forEach(element => {
      const br = document.createElement('br');
      element.before(br);

      // Move children out of block element
      while (element.firstChild) {
        element.before(element.firstChild);
      }

      element.remove();
    });

    // Keep only safe inline formatting tags
    const allowedTags = ['strong', 'b', 'em', 'i', 'u', 'br'];
    const allElements = tmp.querySelectorAll('*');
    allElements.forEach(element => {
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        // Replace with text content
        const textNode = document.createTextNode(element.textContent || '');
        element.replaceWith(textNode);
      } else {
        // Remove all attributes for safety
        while (element.attributes.length > 0) {
          element.removeAttribute(element.attributes[0].name);
        }
      }
    });

    return tmp.innerHTML.trim();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          {mounted && (
            <p className="mt-4 text-muted-foreground text-lg">{t('enrollment.loading', 'Loading your invitation...')}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4" dir={direction}>
        <Card className="max-w-md w-full border-destructive/20 shadow-xl">
          <CardHeader className="bg-destructive/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive text-xl" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('enrollment.error.title', 'Invalid Link')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription style={{ textAlign: isRTL ? 'right' : 'left' }}>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
              size="lg"
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

      case 'multiple_plans':
        return <span>{t('enrollment.paymentPlan.multiplePlans', 'Multiple payment plans available')}</span>;

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-8 px-4"
      dir={direction}
      style={{ textAlign: isRTL ? 'right' : 'left' }}
    >
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-card/95" dir={direction} style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground px-6 sm:px-8 py-8 sm:py-10">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            <div className="relative text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <UserPlus className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                {enrollment.enrollment_type === 'self_enrolled'
                  ? t('enrollment.header.title.selfEnrolled', 'Complete Your Enrollment')
                  : t('enrollment.header.title', 'You\'re Invited!')
                }
              </CardTitle>
              <CardDescription className="text-white/90 text-sm sm:text-base">
                {enrollment.enrollment_type === 'self_enrolled'
                  ? t('enrollment.header.subtitle.selfEnrolled', 'You\'re enrolling in the following:')
                  : t('enrollment.header.subtitle', 'You\'ve been invited to enroll in the following:')
                }
              </CardDescription>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 sm:p-8" dir={direction} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Product Details */}
            <div className={`p-4 bg-primary/5 ${isRTL ? 'border-r-4 rounded-l-lg' : 'border-l-4 rounded-r-lg'} border-primary shadow-sm`}>
              <div className="space-y-3">
                <h3 className="font-bold text-xl text-foreground">{enrollment.product_name}</h3>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Badge variant="secondary" className="text-xs">
                    {t(`enrollment.productType.${enrollment.product_type}`, enrollment.product_type)}
                  </Badge>
                </div>
                {enrollment.product_description && (
                  <div
                    className="text-sm text-muted-foreground leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(enrollment.product_description) }}
                  />
                )}
              </div>
            </div>

            {/* Pricing Info */}
            {enrollment.total_amount > 0 && (
              <div className="bg-muted/50 p-5 rounded-lg border border-muted shadow-sm" style={{ direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div className="font-semibold text-foreground">
                    {t('enrollment.pricing.totalAmount', 'Total Amount')}
                  </div>
                </div>
                <div className={`font-bold text-2xl text-foreground ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
                  {enrollment.currency} {enrollment.total_amount.toFixed(2)}
                </div>
                {enrollment.payment_plan_data && (
                  <div className="text-sm text-muted-foreground mt-3 pt-3 border-t border-muted-foreground/20" style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
                    <div className="font-medium mb-2">{t('enrollment.pricing.paymentPlan', 'Payment Plan')}:</div>
                    {renderPaymentPlanDetails(enrollment.payment_plan_data)}
                  </div>
                )}
              </div>
            )}

            {enrollment.payment_model === 'free' && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 font-medium">
                  {t('enrollment.pricing.free', '🎉 This enrollment is completely free!')}
                </AlertDescription>
              </Alert>
            )}

            {/* User Email Verification - Only show for admin-invited enrollments */}
            {enrollment.enrollment_type === 'admin_invited' && (
              <Alert className="border-primary/20 bg-primary/5">
                <Mail className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  <span className="font-medium">{t('enrollment.verification.sentTo', 'Invitation sent to:')}</span>{' '}
                  <span className="font-semibold">{enrollment.user_email}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Expiration Warning - Only show for admin-invited enrollments */}
            {enrollment.enrollment_type === 'admin_invited' && (
              <Alert className={isExpiringSoon ? 'border-orange-500 bg-orange-50' : 'border-muted bg-muted/30'}>
                <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <AlertDescription className={isExpiringSoon ? 'text-orange-800 font-medium' : 'text-muted-foreground'}>
                  {isExpiringSoon && <strong>{t('enrollment.expiry.soon', '⚠️ Expiring soon!')} </strong>}
                  {t('enrollment.expiry.expires', 'This invitation expires')} {formatDistanceToNow(new Date(enrollment.token_expires_at), { addSuffix: true, locale: language === 'he' ? he : enUS })}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('enrollment.action.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    {t('enrollment.action.accept', 'Accept Enrollment')}
                  </>
                )}
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
