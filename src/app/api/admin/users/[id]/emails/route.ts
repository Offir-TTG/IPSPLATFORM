import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { renderQueueSubject } from '@/lib/email/renderQueueSubject';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/emails?page=1&per_page=20
// Paginated list of email_queue rows addressed to this user. We match
// by `to_email` (unique-per-user, tenant-scoped, always populated by
// the send pipeline) rather than `user_id` — production rows often
// have user_id NULL even when sent to a known user. Subject is
// rendered server-side via the shared queue-subject helper so legacy
// rows that stored `{{notificationTitle}}` literally display the
// resolved text.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const admin = createAdminClient();

    const { data: targetUser } = await admin
      .from('users')
      .select('email')
      .eq('id', params.id)
      .single();
    const targetEmail = (targetUser as any)?.email as string | undefined;
    if (!targetEmail) {
      return NextResponse.json({ emails: [], total: 0, page, per_page: perPage });
    }

    const { data, error, count } = await admin
      .from('email_queue')
      .select(
        'id, subject, to_email, to_name, status, priority, trigger_type, trigger_event, language_code, scheduled_for, sent_at, failed_at, error_message, bounce_type, template_variables, created_at',
        { count: 'exact' },
      )
      .eq('tenant_id', callerRow.tenant_id)
      .eq('to_email', targetEmail)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('user emails query failed:', error);
      return NextResponse.json({ error: 'Failed to load emails' }, { status: 500 });
    }

    const rendered = (data ?? []).map((row: any) => {
      const tvars = (row.template_variables ?? {}) as Record<string, any>;
      return {
        ...row,
        subject: renderQueueSubject(row.subject || '', {
          userName: row.to_name || targetEmail,
          ...tvars,
        }),
      };
    });

    return NextResponse.json({
      emails: rendered,
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (e: any) {
    console.error(`Error in GET /api/admin/users/${params.id}/emails:`, e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
