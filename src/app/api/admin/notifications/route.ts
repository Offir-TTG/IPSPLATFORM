import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/notifications
 * Get all notifications for the tenant (admin view)
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch all notifications for this tenant (admin can see all)
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notificationsError) {
      console.error('[Admin Notifications API] Error fetching notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // For each notification, get read count
    const notificationsWithReadStatus = await Promise.all(
      (notifications || []).map(async (notification) => {
        // Get read count
        const { count: readCount, error: readCountError } = await supabase
          .from('notification_reads')
          .select('*', { count: 'exact', head: true })
          .eq('notification_id', notification.id);

        if (readCountError) {
          console.error(`[Admin Notifications API] Error counting reads for notification ${notification.id}:`, readCountError);
        }

        console.log(`[Admin Notifications API] Notification ${notification.id}: scope=${notification.scope}, target_user_id=${notification.target_user_id}, ${readCount} reads`);

        // Calculate total potential recipients based on scope
        let totalRecipients = 0;
        let recipientDetails = '';

        if (notification.scope === 'individual') {
          // For individual notifications, total recipients is always 1
          totalRecipients = 1;
          console.log(`[Admin Notifications API] Setting totalRecipients = 1 for individual notification ${notification.id}`);
          // Get user name
          if (notification.target_user_id) {
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', notification.target_user_id)
              .single();
            if (user && !userError) {
              recipientDetails = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
            } else {
              console.log(`[Admin Notifications API] Failed to fetch user for notification ${notification.id}:`, userError);
              recipientDetails = 'User';
            }
          } else {
            console.log(`[Admin Notifications API] No target_user_id for notification ${notification.id}`);
            recipientDetails = 'Unknown User';
          }
        } else if (notification.scope === 'course' && notification.target_course_id) {
          // For course/program notifications, count all users who have seen this notification
          // This includes both those who have read it and those who have it in their inbox
          // We use readCount (already fetched above) as the "read" count
          // For total, we need to count all users who this notification is visible to

          // Since we can't easily query "who CAN see this", we use readCount as a minimum
          // In practice, if someone has read it, we know they could see it
          totalRecipients = readCount || 1; // At least 1 user can see it (otherwise why does it exist?)

          console.log(`[Admin Notifications API] Course notification ${notification.id}: using readCount as totalRecipients: ${totalRecipients}`);
          // Get course title
          const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', notification.target_course_id)
            .single();
          if (course) {
            recipientDetails = course.title;
          }
        } else if (notification.scope === 'program' && notification.target_program_id) {
          // Same logic as course notifications - use readCount as minimum
          totalRecipients = readCount || 1;
          console.log(`[Admin Notifications API] Program notification ${notification.id}: using readCount as totalRecipients: ${totalRecipients}`);
          // Get program title
          const { data: program } = await supabase
            .from('programs')
            .select('title')
            .eq('id', notification.target_program_id)
            .single();
          if (program) {
            recipientDetails = program.title;
          }
        } else if (notification.scope === 'tenant') {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', userData.tenant_id);
          totalRecipients = count || 0;
          recipientDetails = 'All Users';
        }

        const result = {
          ...notification,
          read_count: readCount || 0,
          total_recipients: totalRecipients,
          recipient_details: recipientDetails,
        };

        console.log(`[Admin Notifications API] Returning notification ${notification.id}: read_count=${result.read_count}, total_recipients=${result.total_recipients}`);

        return result;
      })
    );

    return NextResponse.json({
      notifications: notificationsWithReadStatus || [],
      total: notificationsWithReadStatus?.length || 0,
    });
  } catch (error) {
    console.error('[Admin Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
