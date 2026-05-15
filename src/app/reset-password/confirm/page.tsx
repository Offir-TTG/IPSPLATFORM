'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LoadingState } from '@/components/user/LoadingState';
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

  // `useUserLanguage().t` is a fresh function on every render. If we put
  // `t` in the effect's dep array, the effect re-runs on every render —
  // and `verifyOtp` consumes the token, so the second call always fails
  // and pushes the page into an "invalid link" loop. We capture the latest
  // `t` in a ref and run the effect exactly once with `[]` deps.
  const tRef = useRef(t);
  tRef.current = t;
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Debug: Log the full URL
    console.log('[Reset Password] Full URL:', window.location.href);
    console.log('[Reset Password] Search params:', window.location.search);

    // Listener is set up on every effect run (StrictMode's dev double-mount
    // re-creates it — that's fine, the prior subscription is cleaned up).
    // Don't gate the verifyOtp callback on a `mounted` local, because the
    // first effect's cleanup flips it before the promise resolves; React 18
    // makes setState-after-unmount a harmless no-op, and the state hooks
    // persist across the StrictMode remount cycle anyway.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Reset Password] Auth event:', event, 'Has session:', !!session);
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSessionReady(true);
        setError('');
      } else if (session) {
        setSessionReady(true);
        setError('');
      }
    });

    // verifyOtp consumes the token, so it must run at most once across all
    // effect runs (including StrictMode's intentional double-mount in dev).
    if (!verifyAttempted.current) {
      verifyAttempted.current = true;

      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');

      if (tokenHash && type === 'recovery') {
        console.log('[Reset Password] Verifying OTP recovery token...');
        supabase.auth
          .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
          .then(({ error: verifyError }) => {
            if (verifyError) {
              console.error('[Reset Password] verifyOtp failed:', verifyError);
              setError(
                tRef.current(
                  'auth.resetConfirm.invalidLink',
                  'Invalid or expired reset link. Please request a new one.'
                )
              );
            } else {
              console.log('[Reset Password] verifyOtp succeeded');
              setSessionReady(true);
              setError('');
            }
          });
      } else {
        // Fallback: legacy hash-token links / existing recovery session.
        supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
          if (sessionError) {
            console.error('[Reset Password] Session error:', sessionError);
          }
          if (session) {
            setSessionReady(true);
            setError('');
          } else {
            setTimeout(() => {
              setSessionReady((prev) => {
                if (prev) return prev; // session arrived after all
                setError(
                  tRef.current(
                    'auth.resetConfirm.invalidLink',
                    'Invalid or expired reset link. Please request a new one.'
                  )
                );
                return prev;
              });
            }, 5000);
          }
        });
      }
    }

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render translated copy until the language context has hydrated
  // — otherwise the SSR default (English) flashes/mismatches the client's
  // resolved locale (Hebrew) and React throws a hydration error.
  if (translationsLoading) {
    return <LoadingState variant="page" />;
  }

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
