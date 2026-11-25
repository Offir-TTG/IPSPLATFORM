'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ReminderWizard } from '@/components/admin/reminders/ReminderWizard';

/** Editing an automatic reminder, in the same four steps as creating one. */
export default function EditReminderPage() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense fallback={null}>
      <ReminderWizard id={params.id} />
    </Suspense>
  );
}
