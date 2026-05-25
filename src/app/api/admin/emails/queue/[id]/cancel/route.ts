import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/queue/[id]/cancel
// Cancel a single pending email_queue row (typo'd recipient, decided
// against sending, etc). Only allowed for `pending` rows — once a row
// is processing/sent/failed it's beyond our control.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from('email_queue')
    .select('id, status')
    .eq('id', params.id)
    .eq('tenant_id', caller.tenant_id)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Queue row not found' }, { status: 404 });
  }

  if (row.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot cancel a ${row.status} email`, code: 'NOT_CANCELLABLE' },
      { status: 400 },
    );
  }

  const { error: updErr } = await admin
    .from('email_queue')
    .update({
      status: 'cancelled',
      error_message: 'Cancelled by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (updErr) {
    console.error('[queue cancel] update failed:', updErr);
    return NextResponse.json({ error: 'Failed to cancel email' }, { status: 500 });
  }
  return NextResponse.json({ cancelled: true });
}
