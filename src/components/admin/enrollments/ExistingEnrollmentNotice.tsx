'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLanguage } from '@/context/AppContext';
import { kitButton } from '@/components/admin/notifications/kit';

/** What POST /api/admin/enrollments answers (409) when the client already has this product. */
export type ExistingEnrollment = {
  code: 'open_enrollment_exists' | 'already_enrolled';
  enrollment_id: string;
  has_link?: boolean;
};

/** Reads a 409 answer of POST /api/admin/enrollments; null for any other answer. */
export function readExistingEnrollment(status: number, body: any): ExistingEnrollment | null {
  if (status !== 409 || !body?.enrollment_id) return null;
  if (body.code !== 'open_enrollment_exists' && body.code !== 'already_enrolled') return null;
  return { code: body.code, enrollment_id: body.enrollment_id, has_link: !!body.has_link };
}

/**
 * Shown instead of making a second enrollment: the client already has an
 * open one in this product (send its link, or open it), or is already
 * enrolled (open it). Uses the same send-link as the enrollment's drawer.
 */
export function ExistingEnrollmentNotice({
  existing,
  language,
  openHref,
}: {
  existing: ExistingEnrollment;
  /** The email's language for "Send the link". */
  language: string;
  /** Where "Open the enrollment" goes; the enrollments list by default. */
  openHref?: string;
}) {
  const { t } = useAdminLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const open = existing.code === 'open_enrollment_exists';
  const href = openHref ?? `/admin/enrollments?enrollment=${existing.enrollment_id}`;

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${existing.enrollment_id}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || t('admin.enrollments.existing.sendFailed', "The link wasn't sent. Please try again."));
      setSent(true);
      toast.success(t('admin.enrollments.sendLink.success', 'Enrollment link sent successfully'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="flex items-start gap-2 font-semibold">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {open
          ? t('admin.enrollments.existing.openTitle', "There's already an open enrollment for this client")
          : t('admin.enrollments.existing.activeTitle', 'This client is already enrolled in this product')}
      </p>
      <p className="mt-1 text-sm">
        {open
          ? sent
            ? t('admin.enrollments.existing.sentText', 'The link was sent to the client.')
            : t('admin.enrollments.existing.openText', 'Nothing new was made. You can send the client the link to this enrollment, or open it.')
          : t('admin.enrollments.existing.activeText', 'Nothing new was made. You can open their enrollment.')}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {open && !sent && (
          <button type="button" onClick={() => void send()} disabled={sending} className={kitButton.primary}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
            {t('admin.enrollments.existing.sendLink', 'Send the link')}
          </button>
        )}
        <Link href={href} className={kitButton.secondary}>
          {t('admin.enrollments.existing.open', 'Open the enrollment')}
        </Link>
      </div>
    </div>
  );
}
