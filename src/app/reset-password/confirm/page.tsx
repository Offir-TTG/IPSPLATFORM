'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordConfirmPage() {
  const { t, direction, loading: translationsLoading } = useUserLanguage();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const isRtl = direction === 'rtl';

  useEffect(() => {
    let mounted = true;
    let hasSession = false;

    // Debug: Log the full URL
    console.log('[Reset Password] Full URL:', window.location.href);
    console.log('[Reset Password] Search params:', window.location.search);
    console.log('[Reset Password] Hash:', window.location.hash);

    // Listen for auth state changes - Supabase will handle PKCE automatically with detectSessionInUrl
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Reset Password] Auth event:', event, 'Has session:', !!session);

      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[Reset Password] Recovery session detected');
        hasSession = true;
        setSessionReady(true);
        setError('');
      } else if (session) {
        console.log('[Reset Password] Existing session found via event');
        hasSession = true;
        setSessionReady(true);
        setError('');
      }
    });

    // Check immediately for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('[Reset Password] Session error:', error);
      }

      if (session) {
        console.log('[Reset Password] Session found immediately');
        hasSession = true;
        setSessionReady(true);
        setError('');
      } else {
        // Wait for Supabase to process the URL (PKCE or hash token)
        console.log('[Reset Password] No immediate session, waiting for Supabase to process URL...');
        setTimeout(() => {
          if (!mounted) return;
          if (!hasSession) {
            console.log('[Reset Password] No session after timeout - showing error');
            setError(t('auth.resetConfirm.invalidLink', 'Invalid or expired reset link. Please request a new one.'));
          }
        }, 5000); // Increased to 5 seconds to give PKCE more time
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.signup.passwordMismatch', 'Passwords do not match'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.signup.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    setLoading(true);

    try {
      // Update password directly with Supabase client (has the recovery session)
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            {t('auth.resetConfirm.title', 'Set New Password')}
          </h1>
          <p className="text-muted-foreground text-base">
            {t('auth.resetConfirm.subtitle', 'Enter your new password below')}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-primary" />
              </div>
              <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg font-medium">
                {t('auth.resetConfirm.successMessage', 'Password updated successfully!')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('auth.resetConfirm.redirecting', 'Redirecting to login...')}
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center space-y-4">
              {error ? (
                <>
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                  <Link href="/reset-password">
                    <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200">
                      {t('auth.reset.sendButton', 'Send reset link')}
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('common.loading', 'Loading...')}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  {t('auth.resetConfirm.newPassword', 'New Password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.signup.passwordHint', 'At least 8 characters')}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                  {t('auth.resetConfirm.confirmPassword', 'Confirm New Password')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                disabled={loading}
              >
                {loading ? t('common.loading', 'Loading...') : t('auth.resetConfirm.updateButton', 'Update Password')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
