'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LoadingState } from '@/components/user/LoadingState';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-8" dir={direction}>
      <div className="w-full max-w-md">
        <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'}`}>
          <LanguageSwitcher context="user" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('auth.reset.title', 'Reset your password')}
          </h1>
          <p className="text-muted-foreground text-base">
            {t('auth.reset.subtitle', "We'll send you an email with a link to reset your password")}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
          {success ? (
            <div className="text-center space-y-6">
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm font-medium">
                {t('auth.reset.successMessage', 'Check your email for a password reset link')}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('auth.reset.emailSent', "We've sent an email to")}
                </p>
                <p className="text-base font-semibold text-foreground">{email}</p>
                <p className="text-sm text-muted-foreground">
                  {t('auth.reset.withInstructions', 'with instructions to reset your password')}
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {t('auth.reset.backToLogin', 'Back to login')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  {t('auth.reset.email', 'Email address')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                disabled={loading}
              >
                {loading ? t('auth.reset.sending', 'Sending...') : t('auth.reset.sendButton', 'Send reset link')}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('auth.reset.backToLogin', 'Back to login')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
