'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLanguage, useTenant } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
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
        throw new Error(data.error || 'Failed to login');
      }

      // Verify user is logging into the correct tenant
      if (data.data.tenant.slug !== slug) {
        setError(`This account does not belong to this organization. Please use the correct login URL.`);
        setLoading(false);
        return;
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

      // Redirect based on user role
      if (data.data.user.role === 'admin') {
        router.push(`/org/${slug}/admin/dashboard`);
      } else if (data.data.user.role === 'instructor') {
        router.push(`/org/${slug}/instructor/dashboard`);
      } else {
        router.push(`/org/${slug}/student/dashboard`);
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
          <h1 className="text-3xl font-bold mb-2">{t('auth.login.title')}</h1>
          <p className="text-muted-foreground">
            {t('auth.login.welcome')}
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
                  href={`/org/${slug}/reset-password`}
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
            <Link href="/signup/organization" className="text-primary hover:underline font-medium">
              Create Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
