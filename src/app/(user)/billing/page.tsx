import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BillingView } from '@/components/user/portal/BillingView';
import { loadBillingData } from './billingData';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const data = await loadBillingData(user.id);
  return <BillingView data={data} />;
}
