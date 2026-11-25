'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

/**
 * A product's enrollment link: /enroll/product/<product id>.
 *
 * One link for everyone, for every product type (program, course, lecture,
 * club, book…). Each visit starts that visitor's own enrollment and goes
 * straight into the enrollment wizard — no product page, no "Accept" screen.
 * When they finish, the product is in their portal.
 *
 * Signed-in clients who already have it go to their portal; one whose
 * membership is on hold goes to Billing; an unfinished signup continues.
 * (All decided by /api/public/enroll.)
 */
export default function ProductEnrollPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  // The texts arrive in the browser (the server has only the English
  // fallbacks), so words show once they're loaded, as on the login pages.
  const { t, direction, loading: translationsLoading } = useLanguage();

  const [error, setError] = useState<string | null>(null);
  // React runs effects twice in development; one visit = one enrollment.
  const started = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/public/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.redirect) {
        router.replace(data.redirect);
        return;
      }
      if (res.status === 404 || res.status === 400) {
        setError(t('enroll.direct.notFound', 'This product is not open for enrollment.'));
        return;
      }
      if (!res.ok || !data.enrollment_token) throw new Error(data.error || 'enroll failed');

      // A signed-in client continues in their portal: the enrollment opens
      // in "להשלמה" on the home page, without asking their details again.
      if (data.client_in_portal && data.enrollment_id) {
        router.replace(`/dashboard?open=${encodeURIComponent(data.enrollment_id)}`);
        return;
      }

      // Open the enrollment and go straight into the wizard.
      const token = data.enrollment_token as string;
      const acc = await fetch(`/api/enrollments/token/${token}/accept`, { method: 'POST' });
      const accData = await acc.json().catch(() => ({}));
      if (acc.ok) {
        router.replace(accData.wizard_url || `/enroll/wizard/${accData.enrollment_id}?token=${token}`);
        return;
      }
      if (accData.already_enrolled) {
        router.replace('/dashboard');
        return;
      }
      // Anything else: the enrollment page shows what's wrong.
      router.replace(`/enroll/${token}`);
    } catch {
      setError(t('enroll.direct.failed', "We couldn't open the enrollment. Please try again."));
    }
  }, [productId, router, t]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4" dir={direction}>
      {error && !translationsLoading ? (
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-lg">{error}</p>
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('enroll.direct.retry', 'Try again')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          {!translationsLoading && <p>{t('enroll.direct.opening', 'Opening the enrollment…')}</p>}
        </div>
      )}
    </div>
  );
}
