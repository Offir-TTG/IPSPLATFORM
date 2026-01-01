import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export async function POST() {
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

    // Call database function to mark all as read
    const { data: markedCount, error } = await supabase.rpc(
      'mark_all_notifications_as_read',
      { p_user_id: userId }
    );

    if (error) {
      console.error('[Notifications API] Error marking all as read:', error);
      console.error('[Notifications API] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Notifications API] Marked notifications count:', markedCount);

    return NextResponse.json({
      success: true,
      marked_count: markedCount || 0,
    });
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
