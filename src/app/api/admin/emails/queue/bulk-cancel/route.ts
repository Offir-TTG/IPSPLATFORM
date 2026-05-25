import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/queue/bulk-cancel
// Body: { ids: string[] }
// Cancels every selected `email_queue` row that is still `pending`,
// scoped to the caller's tenant. Already-sent / processing / failed /
// cancelled / expired rows are skipped (they can't be cancelled at
// this point). Returns the count cancelled vs. skipped so the UI
// can give an honest toast.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((x) => typeof x !== 'string')) {
    return NextResponse.json({ error: 'ids[] required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('email_queue')
    .update({
      status: 'cancelled',
      error_message: 'Cancelled by admin (bulk)',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids as string[])
    .eq('tenant_id', caller.tenant_id)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('[queue bulk-cancel] failed:', error);
    return NextResponse.json({ error: 'Failed to cancel selected emails' }, { status: 500 });
  }

  const cancelled = data?.length ?? 0;
  const skipped = ids.length - cancelled;
  return NextResponse.json({ cancelled, skipped });
}
