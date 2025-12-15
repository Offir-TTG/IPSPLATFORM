'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying');
  const [message, setMessage] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setOrganizationName(data.data.organizationName);
        setSlug(data.data.slug);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  if (status === 'no-token') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-yellow-100 dark:bg-yellow-950 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">No Verification Token</h1>
            <p className="text-muted-foreground">
              The verification link appears to be incomplete. Please check your email and click the full link.
            </p>
          </div>

          <Button onClick={() => router.push('/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Verifying Your Email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Verification Failed</h1>
            <p className="text-muted-foreground mb-4">{message}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              <strong>Common issues:</strong>
            </p>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
              <li>The verification link may have expired (valid for 24 hours)</li>
              <li>The link may have already been used</li>
              <li>The link may be incomplete - check your email again</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={() => router.push('/signup/organization')} className="w-full">
              Create New Organization
            </Button>
            <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Email Verified!</h1>
          <p className="text-muted-foreground mb-4">{message}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            <strong>Your organization:</strong>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">{organizationName}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-100 dark:bg-blue-900 rounded px-2 py-1 inline-block">
            {slug}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Your 14-day free trial has started!</strong>
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            No credit card required. Explore all features during your trial.
          </p>
        </div>

        <Button onClick={() => router.push('/login')} className="w-full" size="lg">
          Log In to Your Organization
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Use the email and password you created during signup to log in.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
