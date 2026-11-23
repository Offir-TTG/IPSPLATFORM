'use client';

export const dynamic = 'force-dynamic';

import { PlanWizardPage } from '@/components/admin/plans/PlanWizardPage';

/** Editing one payment plan, step by step. */
export default function EditPaymentPlanPage({ params }: { params: { id: string } }) {
  return <PlanWizardPage planId={params.id} />;
}
