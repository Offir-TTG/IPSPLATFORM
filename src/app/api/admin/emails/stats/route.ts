import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Auth check goes through the user-scoped client (subject to RLS).
    const userClient = await createClient();

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await userClient
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;

    // Aggregations use the service-role client. Previously these used
    // the user-scoped (RLS-gated) client and returned 0 even when 17
    // sent rows existed for the tenant — the admin's RLS policy
    // didn't grant SELECT across the queue. Service-role is safe
    // here because we already gated on role above.
    const supabase = createAdminClient();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get emails sent in last 30 days
    const { count: sentCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get pending emails
    const { count: pendingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    // Get total templates count
    const { count: templatesCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    // Pull every queue row from the last 30 days with the columns we
    // need to build the dashboard charts. One query, bucketed locally.
    const { data: queueRows } = await supabase
      .from('email_queue')
      .select('status, sent_at, failed_at, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Build the daily series. Seed every day in the 30-day window so
    // empty days render as 0 instead of contracting the x-axis.
    type DailyBucket = { sent: number; failed: number; total: number };
    const dailyMap = new Map<string, DailyBucket>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { sent: 0, failed: 0, total: 0 });
    }
    // Bucket by the most appropriate timestamp per status: sent uses
    // sent_at (so a row queued day-1 and sent day-2 shows on day-2),
    // failed uses failed_at, everything else uses created_at.
    const statusBreakdown: Record<string, number> = {
      sent: 0,
      failed: 0,
      pending: 0,
      processing: 0,
      cancelled: 0,
      expired: 0,
    };
    for (const r of (queueRows ?? []) as Array<{
      status: string;
      sent_at: string | null;
      failed_at: string | null;
      created_at: string;
    }>) {
      statusBreakdown[r.status] = (statusBreakdown[r.status] ?? 0) + 1;

      const stamp =
        r.status === 'sent'
          ? r.sent_at || r.created_at
          : r.status === 'failed'
            ? r.failed_at || r.created_at
            : r.created_at;
      const key = new Date(stamp).toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      if (r.status === 'sent') bucket.sent += 1;
      if (r.status === 'failed') bucket.failed += 1;
      bucket.total += 1;
    }

    const sentDaily = Array.from(dailyMap.entries())
      .map(([date, b]) => ({ date, sent: b.sent, failed: b.failed }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Open rate from email_analytics. Nothing currently WRITES to
    // this table (no tracking pixel injection in the send pipeline),
    // so the rate stays at 0 until that pipeline is built. The read
    // is left in place so the number lights up automatically when
    // tracking is implemented.
    let openRate = 0;
    try {
      const { data: analyticsData } = await supabase
        .from('email_analytics')
        .select('tracking_id, opened_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (analyticsData && sentCount && sentCount > 0) {
        const openedCount = analyticsData.filter(a => a.opened_at).length;
        openRate = Math.round((openedCount / sentCount) * 100);
      }
    } catch (error) {
      console.log('Email analytics not available yet');
    }

    return NextResponse.json({
      emailsSent: sentCount || 0,
      openRate,
      pending: pendingCount || 0,
      templates: templatesCount || 0,
      sentDaily,
      statusBreakdown,
    });

  } catch (error: any) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
}
