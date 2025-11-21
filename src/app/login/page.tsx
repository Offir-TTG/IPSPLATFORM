'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage, useTenant } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { t, loading: translationsLoading } = useUserLanguage();
  const { setTenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        throw new Error(data.error || 'Failed to login');
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
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 left-4">
          <LanguageSwitcher context="user" />
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{t('nav.home')}</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('auth.login.title', 'Welcome Back')}</h1>
          <p className="text-muted-foreground">
            {t('auth.login.subtitle', 'Sign in to your account to continue')}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auth.login.email')}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  {t('auth.login.password')}
                </label>
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:underline"
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
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login.button')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.login.noAccount')} </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              {t('auth.login.signupLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
