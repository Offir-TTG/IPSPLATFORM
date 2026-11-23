import { createAdminClient } from '@/lib/supabase/server';

/**
 * The business currency (Organization settings, tenants.currency). Every
 * product, plan, enrollment and charge is priced in it; nothing picks its
 * own currency. 'USD' only if a business somehow has none set.
 */
export async function getBusinessCurrency(tenantId: string): Promise<string> {
  const { data } = await createAdminClient().from('tenants').select('currency').eq('id', tenantId).maybeSingle();
  const code = typeof data?.currency === 'string' ? data.currency.trim().toUpperCase() : '';
  return /^[A-Z]{3}$/.test(code) ? code : 'USD';
}
