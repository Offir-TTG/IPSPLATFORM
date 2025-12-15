import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/keap/sync/activity - Get recent Keap sync activity
export async function GET() {
  try {
    console.log('[SYNC ACTIVITY] Starting fetch...');
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[SYNC ACTIVITY] User:', user ? user.id : 'No user');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for admin operations
    const adminSupabase = createAdminClient();
    const { data: userData } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[SYNC ACTIVITY] User role:', userData?.role);

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch recent Keap sync events from audit_events
    console.log('[SYNC ACTIVITY] Fetching events from audit_events...');
    const { data: events, error } = await adminSupabase
      .from('audit_events')
      .select('*')
      .eq('resource_type', 'keap_sync')
      .order('event_timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[SYNC ACTIVITY] Database error:', error);
      throw new Error(`Failed to fetch sync activity: ${error.message}`);
    }

    console.log(`[SYNC ACTIVITY] Found ${events?.length || 0} events`);
    if (events && events.length > 0) {
      console.log('[SYNC ACTIVITY] Most recent event:', JSON.stringify(events[0], null, 2));
    }

    return NextResponse.json({
      success: true,
      data: events || []
    });
  } catch (error) {
    console.error('[SYNC ACTIVITY] Error fetching sync activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sync activity'
      },
      { status: 500 }
    );
  }
}
