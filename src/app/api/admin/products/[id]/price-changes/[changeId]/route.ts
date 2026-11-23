import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendPriceChangeCancelledNotices } from '@/lib/payments/priceChangeJobs';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/products/[id]/price-changes/[changeId]
 * Cancels a scheduled change before it starts. If members were already told,
 * they get a short email that their price stays as it is.
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string; changeId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const { data: me } = await admin.from('users').select('tenant_id, role').eq('id', user.id).maybeSingle();
  if (!me || !['admin', 'super_admin'].includes(me.role)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { data: change } = await admin
    .from('subscription_price_changes')
    .select('*')
    .eq('id', params.changeId)
    .eq('product_id', params.id)
    .eq('tenant_id', me.tenant_id)
    .maybeSingle();
  if (!change) return NextResponse.json({ success: false, error: 'Change not found' }, { status: 404 });
  if (change.cancelled_at) return NextResponse.json({ success: true });
  if (change.applied_at) return NextResponse.json({ success: false, error: 'already_started' }, { status: 409 });

  const { error } = await admin
    .from('subscription_price_changes')
    .update({ cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', change.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Members who got the notice are told the price stays.
  let told = 0;
  if (change.notice_sent_at) told = await sendPriceChangeCancelledNotices(change).catch(() => 0);
  return NextResponse.json({ success: true, told });
}
