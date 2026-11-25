'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserLanguage, useTenant } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import { LoadingState } from '@/components/user/LoadingState';
import { LoginShell, LOGIN_BUTTON, LOGIN_INPUT, LOGIN_PANEL, LOGIN_TITLE } from './LoginShell';

export default function LoginPage() {
  const router = useRouter();
  const { t, loading: translationsLoading, direction, language } = useUserLanguage();
  const { setTenant } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isRtl = direction === 'rtl';

  // From an enrollment ("Already have an account? Log in"): the email the
  // client typed there is filled in, a line names the product that continues
  // after logging in, and "No account?" goes back to that enrollment.
  const [enrolling, setEnrolling] = useState<{ name: string; imageUrl: string | null; backHref: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromEnroll = params.get('email');
    if (fromEnroll) setEmail((current) => current || fromEnroll);

    const token = params.get('enroll');
    if (!token || !/^[A-Za-z0-9_-]{6,}$/.test(token)) return;
    const returnId = sessionStorage.getItem('enrollment_return_id');
    const backHref = returnId ? `/enroll/wizard/${returnId}?token=${token}` : `/enroll/${token}`;
    fetch(`/api/enrollments/token/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.product_name && setEnrolling({ name: d.product_name, imageUrl: d.product_image_url ?? null, backHref }))
      .catch(() => undefined);
  }, []);

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
        // Translate the error message from the API. We prefer the
        // structured `code` (returned by our own login route) over
        // the free-form `error` string, because string-matching
        // breaks on Hebrew/Spanish API responses. String-matching
        // remains as a fallback for legacy Supabase-Auth errors.
        let errorMessage = data.error || t('auth.errors.unknown', 'An error occurred during login');

        switch (data.code as string | undefined) {
          case 'account_suspended':
            errorMessage = t(
              'auth.errors.accountSuspended',
              'Your account has been suspended. Contact your administrator to restore access.',
            );
            break;
          case 'account_inactive':
            errorMessage = t(
              'auth.errors.accountInactive',
              'Your account is inactive. Contact your administrator to reactivate it.',
            );
            break;
          case 'account_invited':
            errorMessage = t(
              'auth.errors.accountInvited',
              'Please complete your invitation before signing in. Check your email for the invitation link.',
            );
            break;
          case 'no_tenant_access':
            errorMessage = t(
              'auth.errors.noAccess',
              'You do not have access to this organization',
            );
            break;
          case 'profile_missing':
            errorMessage = t(
              'auth.errors.profileMissing',
              'User profile not found.',
            );
            break;
          case 'status_check_failed':
            errorMessage = t(
              'auth.errors.statusCheckFailed',
              'Unable to verify account status. Please try again.',
            );
            break;
          default:
            // Legacy string-matching fallback for Supabase Auth errors
            // and any other response that doesn't carry a `code`.
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

      // Came from an enrollment ("Already have an account? Log in"): the
      // token is in the address (?enroll=), or in this tab's storage.
      const isStaff = data.data.user.role === 'admin' || data.data.user.role === 'super_admin';
      const enrollmentReturnId = sessionStorage.getItem('enrollment_return_id');
      const enrollToken = [new URLSearchParams(window.location.search).get('enroll'), sessionStorage.getItem('enrollment_return_token')].find(
        (v): v is string => !!v && /^[A-Za-z0-9_-]{6,}$/.test(v),
      );
      sessionStorage.removeItem('enrollment_return_id');
      sessionStorage.removeItem('enrollment_return_token');

      if (enrollToken) {
        if (!isStaff) {
          // A client: the enrollment joins their account and continues in
          // their portal, opened in "להשלמה" on the home page. Details they
          // already gave us are not asked again.
          const linkRes = await fetch(`/api/enrollments/token/${enrollToken}/link-user`, { method: 'POST' }).catch(() => null);
          const linked = linkRes ? await linkRes.json().catch(() => null) : null;
          // Already in this product (or on hold): straight to the portal / Billing.
          if (linkRes?.ok && linked?.redirect) {
            router.push(linked.redirect);
            return;
          }
          // Joined, or their own open enrollment in this product continues.
          if (linkRes?.ok && linked?.enrollment_id) {
            router.push(`/dashboard?open=${encodeURIComponent(linked.enrollment_id)}`);
            return;
          }
        }
        // Staff, or the enrollment couldn't be linked: back to the wizard as before.
        router.push(enrollmentReturnId ? `/enroll/wizard/${enrollmentReturnId}?token=${enrollToken}` : `/enroll/${enrollToken}`);
        return;
      }

      // Redirect based on user role
      if (isStaff) {
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

  // The enrollment line, with the product's name in bold.
  const [enrollBefore, enrollAfter] = t(
    'auth.login.continueEnrollment',
    'After you log in, your enrollment in {product} continues in your portal.',
  ).split('{product}');

  return (
    <LoginShell>
      {(page, siteLink) => {
        // Words the admin wrote show on the Hebrew page; empty ones, and the
        // English page, use the built-in wording.
        const own = (value: string | undefined, key: string, fallback: string) =>
          language === 'he' && value ? value : t(key, fallback);
        const badge = own(page?.badge, 'auth.login.badge', 'Your personal area');
        const title = own(page?.title, 'auth.login.homeTitle', 'Welcome home');
        const subtitle = own(page?.subtitle, 'auth.login.homeSubtitle', 'Your programs, sessions and club are waiting for you here.');
        return (
          <form
            onSubmit={handleSubmit}
            noValidate
            className={LOGIN_PANEL}
          >
            <span className="hidden self-start rounded-full bg-[#fbefd6] px-3 py-1.5 text-[13px] font-bold text-[#7a4f00] lg:inline-block">
              {badge}
            </span>
            <div className="flex flex-col gap-2">
              <h1 className={LOGIN_TITLE}>{title}</h1>
              <p className="m-0 text-[15px] text-[#73698a] lg:text-[17px]">{subtitle}</p>
            </div>

            {enrolling && (
              <div className="flex items-center gap-3 rounded-xl border border-[#f4dfab] bg-[#fff8e8] px-3.5 py-2.5 text-[15px] text-[#5c4208]">
                {enrolling.imageUrl ? (
                  <img src={enrolling.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#8d6cc7] to-[#5b3a8e]" aria-hidden />
                )}
                <span>
                  {enrollBefore}
                  <b>{enrolling.name}</b>
                  {enrollAfter}
                </span>
              </div>
            )}

            {error && (
              <p role="alert" className="m-0 rounded-xl bg-[#fdecec] px-3.5 py-3 text-sm font-medium text-[#9b1c1c]">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[15px] font-semibold">
                {t('auth.login.email')}
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

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="text-[15px] font-semibold">
                  {t('auth.login.password')}
                </label>
                <Link href="/reset-password" className="text-sm font-semibold text-[#5b3a8e] no-underline hover:text-[#3d2466]">
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={LOGIN_INPUT}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={LOGIN_BUTTON}
            >
              {loading ? t('auth.login.signingIn', 'Signing in…') : t('auth.login.button')}
            </button>

            {enrolling && (
              <p className="m-0 text-center text-[15px] text-[#73698a]">
                {t('auth.login.noAccountYet', "Don't have an account?")}{' '}
                <a href={enrolling.backHref} className="font-semibold text-[#5b3a8e] no-underline hover:text-[#3d2466]">
                  {t('auth.login.backToEnrollment', 'Back to the enrollment')}
                </a>
              </p>
            )}

            {siteLink && <div className="self-center lg:hidden">{siteLink}</div>}
          </form>
        );
      }}
    </LoginShell>
  );
}
