'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useHelp } from '@/hooks/useHelp';
import { NewEnrollmentWizard } from '@/components/admin/enrollments/NewEnrollmentWizard';

/** A new enrollment, step by step, on its own page. */
export default function NewEnrollmentPage() {
  useHelp('enrollments-overview');
  const { direction } = useAdminLanguage();
  return (
    <AdminLayout>
      <div className="max-w-6xl p-4 md:p-6" dir={direction}>
        <NewEnrollmentWizard />
      </div>
    </AdminLayout>
  );
}
