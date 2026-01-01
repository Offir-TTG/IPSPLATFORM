import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/deleted
 * Get deleted notifications for the current user
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Call the database function to get deleted notifications
    const { data: deletedNotifications, error } = await supabase.rpc(
      'get_user_deleted_notifications',
      {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (error) {
      console.error('[Notifications API] Error fetching deleted notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deleted notifications' },
        { status: 500 }
      );
    }

    // Get total count of deleted notifications
    const { data: deletedCount, error: countError } = await supabase.rpc(
      'get_user_deleted_count',
      { p_user_id: userId }
    );

    if (countError) {
      console.error('[Notifications API] Error fetching deleted count:', countError);
    }

    return NextResponse.json({
      notifications: deletedNotifications || [],
      total: deletedCount || 0,
      has_more: (deletedNotifications?.length || 0) >= limit,
    });
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
