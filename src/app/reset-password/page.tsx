'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const { t, loading: translationsLoading } = useUserLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show loading state while translations are loading to prevent flash
  if (translationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call Supabase directly from client to store PKCE verifier
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <LanguageSwitcher context="user" />
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{t('platform.name', 'Parenting School')}</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('auth.reset.title', 'Reset your password')}</h1>
          <p className="text-muted-foreground">
            {t('auth.reset.subtitle', 'We\'ll send you an email with a link to reset your password')}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-primary/10 text-primary px-4 py-3 rounded-md">
                {t('auth.reset.successMessage', 'Check your email for a password reset link')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('auth.reset.emailSent', 'We\'ve sent an email to')}{' '}
                <strong>{email}</strong>{' '}
                {t('auth.reset.withInstructions', 'with instructions to reset your password')}
              </p>
              <Link href="/login" className="inline-flex items-center text-primary hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.reset.backToLogin', 'Back to login')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('auth.reset.email', 'Email address')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.reset.sending', 'Sending...') : t('auth.reset.sendButton', 'Send reset link')}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
