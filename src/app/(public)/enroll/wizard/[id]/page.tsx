'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, FileText, User, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';

type WizardStep = 'signature' | 'profile' | 'payment' | 'complete';

interface EnrollmentWizardData {
  id: string;
  product_name: string;
  product_type: string;
  total_amount: number;
  currency: string;
  requires_signature: boolean;
  signature_template_id?: string;
  signature_status?: string;
  docusign_envelope_id?: string;
  user_profile_complete: boolean;
  payment_required: boolean;
}

export default function EnrollmentWizardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentId = params.id as string;
  const enrollmentToken = searchParams.get('token');
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentWizardData | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>('signature');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (enrollmentToken) {
      fetchEnrollmentData();

      // Check if returning from DocuSign
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('docusign') === 'complete') {
        // Refresh enrollment data to get updated signature status
        setTimeout(() => {
          fetchEnrollmentData();
        }, 1000); // Give webhook time to process
      }
    } else {
      setError('Missing enrollment token. Please use the invitation link.');
      setLoading(false);
    }
  }, [enrollmentId, enrollmentToken]);

  useEffect(() => {
    if (enrollment) {
      determineCurrentStep();
    }
  }, [enrollment]);

  const fetchEnrollmentData = async () => {
    try {
      // Use token-based endpoint for unauthenticated access
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/wizard-status`);

      if (!response.ok) {
        if (response.status === 410) {
          throw new Error('Enrollment invitation has expired. Please contact support.');
        }
        throw new Error('Failed to fetch enrollment data');
      }

      const data = await response.json();
      setEnrollment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const determineCurrentStep = () => {
    if (!enrollment) return;

    // Step 1: Signature (if required)
    if (enrollment.requires_signature && enrollment.signature_status !== 'completed') {
      setCurrentStep('signature');
      return;
    }

    // Step 2: Profile completion
    if (!enrollment.user_profile_complete) {
      setCurrentStep('profile');
      return;
    }

    // Step 3: Payment (if required)
    if (enrollment.payment_required && enrollment.total_amount > 0) {
      setCurrentStep('payment');
      return;
    }

    // All steps complete
    setCurrentStep('complete');
  };

  const handleSignatureStep = async () => {
    setProcessing(true);
    try {
      // Use token-based endpoint
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/send-contract`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to send contract');
      }

      const data = await response.json();

      // Redirect to DocuSign signing URL
      if (data.signing_url) {
        window.location.href = data.signing_url;
      }
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleProfileStep = () => {
    // Redirect to profile completion page with return URL and token
    router.push(`/profile?enrollment=${enrollmentId}&token=${enrollmentToken}&return=/enroll/wizard/${enrollmentId}?token=${enrollmentToken}`);
  };

  const handlePaymentStep = () => {
    // Redirect to payment page with token
    router.push(`/payments/${enrollmentId}/pay?token=${enrollmentToken}`);
  };

  const handleComplete = async () => {
    setProcessing(true);
    try {
      // Prompt user to set password before completing
      const password = prompt('Create a password for your account (minimum 8 characters):');

      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters long');
        setProcessing(false);
        return;
      }

      // Use token-based endpoint with password to create account
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete enrollment');
      }

      const data = await response.json();

      // Auto-login with the new session
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      // Redirect to dashboard
      router.push('/dashboard?enrollment=complete');
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const getStepProgress = (): number => {
    const steps: WizardStep[] = [];

    if (enrollment?.requires_signature) steps.push('signature');
    steps.push('profile');
    if (enrollment?.payment_required && enrollment?.total_amount > 0) steps.push('payment');
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStepIcon = (step: WizardStep) => {
    const iconClass = "h-5 w-5";
    switch (step) {
      case 'signature':
        return <FileText className={iconClass} />;
      case 'profile':
        return <User className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'complete':
        return <CheckCircle2 className={iconClass} />;
    }
  };

  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case 'signature':
        return t('enrollment.wizard.signature.title', 'Sign Agreement');
      case 'profile':
        return t('enrollment.wizard.profile.title', 'Complete Profile');
      case 'payment':
        return t('enrollment.wizard.payment.title', 'Payment');
      case 'complete':
        return t('enrollment.wizard.complete.title', 'Complete!');
    }
  };

  const getStepDescription = (step: WizardStep): string => {
    switch (step) {
      case 'signature':
        return t('enrollment.wizard.signature.description', 'Please sign the enrollment agreement to continue');
      case 'profile':
        return t('enrollment.wizard.profile.description', 'Complete your profile information');
      case 'payment':
        return t('enrollment.wizard.payment.description', 'Complete payment to activate your enrollment');
      case 'complete':
        return t('enrollment.wizard.complete.description', 'Your enrollment is complete!');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'signature':
        return (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription suppressHydrationWarning>
                {t('enrollment.wizard.signature.info', 'You need to sign the enrollment agreement before proceeding.')}
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSignatureStep}
              disabled={processing}
              suppressHydrationWarning
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  {t('enrollment.wizard.signature.sending', 'Opening signature...')}
                </>
              ) : (
                <>
                  {t('enrollment.wizard.signature.button', 'Sign Agreement')}
                  <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                </>
              )}
            </Button>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription suppressHydrationWarning>
                {t('enrollment.wizard.profile.info', 'Please complete your profile to continue with enrollment.')}
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={handleProfileStep}
              suppressHydrationWarning
            >
              {t('enrollment.wizard.profile.button', 'Complete Profile')}
              <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
            </Button>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription suppressHydrationWarning>
                {t('enrollment.wizard.payment.info', 'Complete payment to activate your enrollment.')}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('enrollment.wizard.payment.total', 'Total Amount')}:
                </span>
                <span className="text-lg font-bold" dir="ltr">
                  {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handlePaymentStep}
              suppressHydrationWarning
            >
              {t('enrollment.wizard.payment.button', 'Proceed to Payment')}
              <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-center" suppressHydrationWarning>
                {t('enrollment.wizard.complete.success', 'Your enrollment is complete! You can now access your content.')}
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={handleComplete}
              disabled={processing}
              suppressHydrationWarning
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  {t('enrollment.wizard.complete.finishing', 'Finishing...')}
                </>
              ) : (
                t('enrollment.wizard.complete.button', 'Go to Dashboard')
              )}
            </Button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white" dir={direction}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('enrollment.wizard.loading', 'Loading enrollment...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-white" dir={direction}>
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500" suppressHydrationWarning>
              {t('enrollment.wizard.error.title', 'Error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4" suppressHydrationWarning>{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
              suppressHydrationWarning
            >
              {t('enrollment.wizard.error.dashboard', 'Go to Dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4" dir={direction}>
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl mb-2" suppressHydrationWarning>
              {t('enrollment.wizard.header.title', 'Complete Your Enrollment')}
            </CardTitle>
            <CardDescription className="text-purple-100" suppressHydrationWarning>
              {enrollment.product_name}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span suppressHydrationWarning>{t('enrollment.wizard.progress', 'Progress')}</span>
                <span suppressHydrationWarning>{Math.round(getStepProgress())}%</span>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </div>

            {/* Current Step */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  {getStepIcon(currentStep)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg" suppressHydrationWarning>
                    {getStepTitle(currentStep)}
                  </h3>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {getStepDescription(currentStep)}
                  </p>
                </div>
              </div>

              {renderStepContent()}
            </div>

            {/* Step Indicators */}
            <div className="pt-6 border-t">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-center gap-2`}>
                {enrollment.requires_signature && (
                  <Badge variant={currentStep === 'signature' ? 'default' : enrollment.signature_status === 'completed' ? 'outline' : 'secondary'}>
                    <FileText className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                    <span suppressHydrationWarning>{t('enrollment.wizard.steps.signature', 'Signature')}</span>
                  </Badge>
                )}
                <Badge variant={currentStep === 'profile' ? 'default' : enrollment.user_profile_complete ? 'outline' : 'secondary'}>
                  <User className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                  <span suppressHydrationWarning>{t('enrollment.wizard.steps.profile', 'Profile')}</span>
                </Badge>
                {enrollment.payment_required && enrollment.total_amount > 0 && (
                  <Badge variant={currentStep === 'payment' ? 'default' : 'secondary'}>
                    <CreditCard className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                    <span suppressHydrationWarning>{t('enrollment.wizard.steps.payment', 'Payment')}</span>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
