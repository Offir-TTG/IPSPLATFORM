import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { resolveScheduleRecipients } from '@/lib/email/scheduleRecipients';

export const dynamic = 'force-dynamic';

// POST /api/admin/emails/schedules/preview-recipients
// Returns the eligible recipient count for a candidate filter +
// explicit recipient_ids combination. Used by the schedule create/edit
// dialog so the admin can see how many users will actually receive
// the email before saving.
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json().catch(() => ({}));
    const { recipient_filter, recipient_ids } = body ?? {};

    const admin = createAdminClient();
    const recipients = await resolveScheduleRecipients(admin, caller.tenant_id, {
      filter: recipient_filter ?? null,
      recipientIds: recipient_ids ?? null,
      dryRun: false,
    });

    return NextResponse.json({
      count: recipients.length,
      // Trim the preview to a small sample so the dialog can show a
      // few example emails without dumping the whole list.
      sample: recipients.slice(0, 10).map((r) => r.email),
    });
  } catch (error) {
    console.error('preview-recipients failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
