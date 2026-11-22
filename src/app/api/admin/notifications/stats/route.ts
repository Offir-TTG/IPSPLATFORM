import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { readCounts, recipientTotals, sendKey } from '@/lib/notifications/audience';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/notifications/stats
 * Get notification statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Sends, not rows: choosing several students saves one row each, and
    // that counts as one send (same rule as the list). Unread: for each row,
    // the people it went to who haven't read it yet.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalSent = 0;
    let todaySent = 0;
    let unreadTotal = 0;
    try {
      const db = createAdminClient();
      const { data: allNotifications, error } = await db.from('notifications').select('*').eq('tenant_id', userData.tenant_id);
      if (error) throw error;
      const rows = allNotifications ?? [];
      const sends = new Set<string>();
      const sendsToday = new Set<string>();
      for (const n of rows) {
        const key = sendKey(n);
        sends.add(key);
        if (new Date(n.created_at) >= today) sendsToday.add(key);
      }
      totalSent = sends.size;
      todaySent = sendsToday.size;
      const [totals, reads] = await Promise.all([
        recipientTotals(db, userData.tenant_id, rows),
        readCounts(db, rows.map((n) => n.id)),
      ]);
      for (const n of rows) unreadTotal += Math.max(0, (totals.get(n.id) ?? 0) - (reads.get(n.id) ?? 0));
    } catch (error) {
      console.error('[Admin Notifications API] Could not count notifications:', error);
    }

    // Get total deleted notifications count
    const { count: totalDeleted } = await supabase
      .from('notification_reads')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', true);

    return NextResponse.json({
      totalSent: totalSent || 0,
      todaySent: todaySent || 0,
      unreadTotal: Math.max(0, unreadTotal),
      totalDeleted: totalDeleted || 0,
    });
  } catch (error) {
    console.error('[Admin Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
