'use client';

import { useParams, useSearchParams } from 'next/navigation';
import EnrollmentWizard from '@/components/enroll/EnrollmentWizard';

/** The enrollment wizard as its own page (the link emailed to the client). */
export default function EnrollmentWizardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  return <EnrollmentWizard enrollmentId={params.id as string} token={searchParams.get('token')} />;
}
