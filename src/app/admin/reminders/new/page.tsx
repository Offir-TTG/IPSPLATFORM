'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { ReminderWizard } from '@/components/admin/reminders/ReminderWizard';

/** A new automatic reminder, in four steps. */
export default function NewReminderPage() {
  return (
    <Suspense fallback={null}>
      <ReminderWizard id={null} />
    </Suspense>
  );
}
