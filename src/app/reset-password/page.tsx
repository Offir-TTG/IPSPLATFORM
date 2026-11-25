'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import { LoadingState } from '@/components/user/LoadingState';
// The same frame as the login page: "Forgot password?" keeps the picture and
// only the form beside it changes.
import { LoginShell, LOGIN_BUTTON, LOGIN_INPUT, LOGIN_PANEL, LOGIN_TITLE } from '../login/LoginShell';

export default function ResetPasswordPage() {
  const { t, loading: translationsLoading, direction } = useUserLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRtl = direction === 'rtl';

  // Show loading state while translations are loading to prevent flash
  if (translationsLoading) {
    return <LoadingState variant="page" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Client-side validation for email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(t('auth.reset.errors.invalidEmail', 'Please enter a valid email address'));
      }

      // Call API to send password reset email with custom template
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          language: direction === 'rtl' ? 'he' : 'en', // Pass user's current language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.reset.errors.unknown', 'An error occurred while sending reset link'));
      }

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.reset.errors.unknown', 'An error occurred while sending reset link');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link href="/login" className="inline-flex min-h-[44px] items-center self-center px-2 text-sm font-semibold text-[#5b3a8e] no-underline hover:text-[#3d2466]">
      {t('auth.reset.backToLogin', 'Back to login')}
    </Link>
  );

  return (
    <LoginShell>
      {() =>
        success ? (
          <div className={LOGIN_PANEL}>
            <div className="flex flex-col gap-2">
              <h1 className={LOGIN_TITLE}>{t('auth.reset.successMessage', 'Check your email for a password reset link')}</h1>
              <p className="m-0 text-[15px] text-[#73698a] lg:text-[17px]">
                {t('auth.reset.emailSent', "We've sent an email to")}{' '}
                <bdi className="font-semibold text-[#221a2e]">{email}</bdi>{' '}
                {t('auth.reset.withInstructions', 'with instructions to reset your password')}
              </p>
            </div>
            {backToLogin}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={LOGIN_PANEL}>
            <div className="flex flex-col gap-2">
              <h1 className={LOGIN_TITLE}>{t('auth.reset.title', 'Reset your password')}</h1>
              <p className="m-0 text-[15px] text-[#73698a] lg:text-[17px]">
                {t('auth.reset.subtitle', "We'll send you an email with a link to reset your password")}
              </p>
            </div>

            {error && (
              <p role="alert" className="m-0 rounded-xl bg-[#fdecec] px-3.5 py-3 text-sm font-medium text-[#9b1c1c]">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[15px] font-semibold">
                {t('auth.reset.email', 'Email address')}
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${LOGIN_INPUT} ${isRtl ? 'text-right' : ''}`}
                placeholder="you@example.com"
              />
            </div>

            <button type="submit" disabled={loading} className={LOGIN_BUTTON}>
              {loading ? t('auth.reset.sending', 'Sending...') : t('auth.reset.sendButton', 'Send reset link')}
            </button>

            {backToLogin}
          </form>
        )
      }
    </LoginShell>
  );
}
