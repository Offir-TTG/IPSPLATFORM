'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function OrganizationSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    message: '',
    suggestions: [],
  });

  // Auto-generate slug from organization name
  useEffect(() => {
    if (formData.organizationName && !formData.slug) {
      const autoSlug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);

      if (autoSlug.length >= 3) {
        setFormData((prev) => ({ ...prev, slug: autoSlug }));
      }
    }
  }, [formData.organizationName]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugStatus({
        checking: false,
        available: null,
        message: '',
        suggestions: [],
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSlugStatus((prev) => ({ ...prev, checking: true }));

      try {
        const response = await fetch(`/api/tenants/check-slug?slug=${encodeURIComponent(formData.slug)}`);
        const data = await response.json();

        if (data.success) {
          setSlugStatus({
            checking: false,
            available: data.available,
            message: data.message,
            suggestions: data.suggestions || [],
          });
        }
      } catch (err) {
        console.error('Error checking slug:', err);
        setSlugStatus({
          checking: false,
          available: null,
          message: 'Error checking availability',
          suggestions: [],
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (slugStatus.available !== true) {
      setError('Please choose an available organization identifier');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/auth/signup/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          slug: formData.slug,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during signup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Check Your Email!</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to <strong>{formData.email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link</li>
              <li>Log in to start your 14-day free trial</li>
            </ol>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Didn't receive the email? Check your spam folder or contact support.
          </p>

          <Button onClick={() => router.push('/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 sm:p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Create Your Organization</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Start your 14-day free trial • No credit card required
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Organization Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Harvard University"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Organization Identifier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="harvard"
                pattern="[a-z0-9][a-z0-9-]{1,61}[a-z0-9]"
                minLength={3}
                maxLength={63}
              />
              <div className="mt-2 flex items-start gap-2">
                {slugStatus.checking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking availability...</span>
                  </div>
                )}
                {!slugStatus.checking && slugStatus.available === true && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{slugStatus.message}</span>
                  </div>
                )}
                {!slugStatus.checking && slugStatus.available === false && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-2">
                      <XCircle className="h-4 w-4" />
                      <span>{slugStatus.message}</span>
                    </div>
                    {slugStatus.suggestions.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="block mb-1">Suggestions:</span>
                        <div className="flex flex-wrap gap-2">
                          {slugStatus.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setFormData({ ...formData, slug: suggestion })}
                              className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used in your organization's URL. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>

          {/* Admin Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground">Admin Account</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="admin@harvard.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Minimum 8 characters"
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-3 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Re-enter your password"
                minLength={8}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 pt-4 border-t border-border">
            <input
              type="checkbox"
              id="acceptTerms"
              required
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="acceptTerms" className="text-sm text-foreground">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={saving || slugStatus.available !== true} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Organization...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
