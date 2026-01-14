'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserLanguage, useTenant } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { LoadingState } from '@/components/user/LoadingState';

export default function LoginPage() {
  const router = useRouter();
  const { t, loading: translationsLoading, direction } = useUserLanguage();
  const { setTenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
        throw new Error(t('auth.errors.invalidEmailFormat', 'Please enter a valid email address'));
      }

      // Check password length
      if (password.length < 6) {
        throw new Error(t('auth.errors.passwordTooShort', 'Password must be at least 6 characters'));
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        // Translate the error message from the API
        let errorMessage = data.error || t('auth.errors.unknown', 'An error occurred during login');

        // Map common Supabase error messages to translated versions
        if (errorMessage === 'Invalid login credentials') {
          errorMessage = t('auth.errors.invalidCredentials', 'Invalid email or password');
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = t('auth.errors.emailNotConfirmed', 'Please verify your email address');
        } else if (errorMessage.includes('do not have access')) {
          errorMessage = t('auth.errors.noAccess', 'You do not have access to this organization');
        } else if (errorMessage.includes('Tenant not found')) {
          errorMessage = t('auth.errors.tenantNotFound', 'Organization not found. Please contact support.');
        } else if (errorMessage.includes('verify your email')) {
          errorMessage = t('auth.errors.verifyEmail', 'Please verify your email address before logging in');
        }

        throw new Error(errorMessage);
      }

      console.log('Login successful, setting session...');

      // Set the Supabase session on the client
      if (data.data.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.data.session.access_token,
          refresh_token: data.data.session.refresh_token,
        });

        if (sessionError) {
          console.error('Failed to set session:', sessionError);
          throw new Error('Failed to set session');
        }

        console.log('Session set successfully');
      }

      // Set tenant information in context
      if (data.data.tenant) {
        setTenant({
          id: data.data.tenant.id,
          name: data.data.tenant.name,
          slug: data.data.tenant.slug,
          role: data.data.tenant.role,
        });
        localStorage.setItem('tenant_name', data.data.tenant.name);
      }

      // Wait a bit for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user came from enrollment wizard
      const enrollmentReturnId = sessionStorage.getItem('enrollment_return_id');
      const enrollmentReturnToken = sessionStorage.getItem('enrollment_return_token');

      if (enrollmentReturnId && enrollmentReturnToken) {
        // Clear the stored values
        sessionStorage.removeItem('enrollment_return_id');
        sessionStorage.removeItem('enrollment_return_token');
        // Redirect back to enrollment wizard
        router.push(`/enroll/wizard/${enrollmentReturnId}?token=${enrollmentReturnToken}`);
        return;
      }

      // Redirect based on user role
      if (data.data.user.role === 'admin' || data.data.user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        // Students, Instructors, and Parents go to user portal
        router.push('/dashboard');
      }
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
            {t('auth.login.title', 'Welcome Back')}
          </h1>
          <p className="text-muted-foreground text-base">
            {t('auth.login.subtitle', 'Sign in to your account to continue')}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl shadow-black/5 backdrop-blur-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-foreground">
                {t('auth.login.email')}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  {t('auth.login.password')}
                </label>
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? t('common.loading') : t('auth.login.button')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('auth.login.backToHome', 'Back to Home')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
