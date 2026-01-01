import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/[id]
 * Get a single notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const notificationId = params.id;

    // Get notification (RLS will ensure user has access)
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error || !notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user has read this notification
    const { data: readStatus } = await supabase
      .from('notification_reads')
      .select('read_at')
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({
      ...notification,
      is_read: !!readStatus,
      read_at: readStatus?.read_at || null,
    });
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read or unread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const notificationId = params.id;

    // Parse request body
    const body = await request.json();
    const { is_read } = body;

    if (typeof is_read !== 'boolean') {
      return NextResponse.json(
        { error: 'is_read must be a boolean' },
        { status: 400 }
      );
    }

    // Note: We don't verify notification existence here because RLS policies will
    // handle access control. If the user can't access the notification, the
    // mark_notification_as_read RPC will simply not affect any rows (which is fine).
    // This avoids issues with RLS blocking the verification query.

    if (is_read) {
      // Mark as read using database function
      const { error: markError } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId,
        p_user_id: userId,
      });

      if (markError) {
        console.error('[Notifications API] Error marking as read:', markError);
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        );
      }
    } else {
      // Mark as unread (delete read record)
      const { error: deleteError } = await supabase
        .from('notification_reads')
        .delete()
        .eq('notification_id', notificationId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[Notifications API] Error marking as unread:', deleteError);
        return NextResponse.json(
          { error: 'Failed to mark notification as unread' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, is_read });
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 * - Users can delete notifications visible to them (creates a dismissed record)
 * - Admins can permanently delete notifications from the database
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const notificationId = params.id;

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = userData && ['admin', 'super_admin'].includes(userData.role);

    if (isAdmin) {
      // Admin: Permanently delete notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) {
        console.error('[Notifications API] Error deleting notification:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete notification' },
          { status: 500 }
        );
      }
    } else {
      // User: Soft delete - mark as deleted in notification_reads table
      // First, check if a record already exists
      const { data: existingRead } = await supabase
        .from('notification_reads')
        .select('id')
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRead) {
        // Update existing record to mark as deleted
        const { error: updateError } = await supabase
          .from('notification_reads')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('notification_id', notificationId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('[Notifications API] Error marking notification as deleted:', updateError);
          return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
          );
        }
      } else {
        // Create new record with deleted status (user never read it, just deleted it)
        const { error: insertError } = await supabase
          .from('notification_reads')
          .insert({
            notification_id: notificationId,
            user_id: userId,
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            read_at: null, // Not read, just deleted
          });

        if (insertError) {
          console.error('[Notifications API] Error creating deletion record:', insertError);
          return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
