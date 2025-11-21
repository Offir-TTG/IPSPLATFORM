import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/keap/sync/activity - Get recent Keap sync activity
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch recent Keap sync events from audit_events
    const { data: events, error } = await adminSupabase
      .from('audit_events')
      .select('*')
      .eq('resource_type', 'keap_sync')
      .order('event_timestamp', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch sync activity: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: events || []
    });
  } catch (error) {
    console.error('Error fetching sync activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sync activity'
      },
      { status: 500 }
    );
  }
}
