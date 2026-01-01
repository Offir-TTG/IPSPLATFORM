import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get total notifications sent
    const { count: totalSent } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', userData.tenant_id);

    // Get notifications sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todaySent } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', userData.tenant_id)
      .gte('created_at', today.toISOString());

    // Get total unread count across all users
    // We need to count notifications that don't have a read record
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('id')
      .eq('tenant_id', userData.tenant_id);

    const { data: readNotifications } = await supabase
      .from('notification_reads')
      .select('notification_id');

    const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
    const unreadTotal = (allNotifications?.length || 0) - readIds.size;

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
