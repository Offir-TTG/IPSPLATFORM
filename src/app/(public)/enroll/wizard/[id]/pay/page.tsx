'use client';

export const dynamic = 'force-dynamic';

import { useParams, useSearchParams } from 'next/navigation';
import EnrollmentPayment from '@/components/enroll/EnrollmentPayment';

/** The enrollment payment step as its own page (from the wizard page). */
export default function WizardPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  return <EnrollmentPayment enrollmentId={params.id as string} token={searchParams?.get('token') ?? null} />;
}
