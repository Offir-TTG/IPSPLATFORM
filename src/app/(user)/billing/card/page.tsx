import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CardUpdateView } from '@/components/user/portal/CardUpdateView';
import { loadBillingData } from '../billingData';

export const dynamic = 'force-dynamic';

/** Where a payment reminder's "update card" button leads. */
export default async function CardUpdatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await loadBillingData(user.id);
  // Payments that are late and can be paid now (the next one per enrollment).
  const due = data.due.filter((d) => d.overdue && d.state === 'pay');
  return <CardUpdateView due={due} />;
}
