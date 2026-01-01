import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateNotificationRequest,
  GetNotificationsRequest,
  GetNotificationsResponse,
} from '@/types/notifications';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * List notifications for the current user with filtering and pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: GetNotificationsRequest = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      category: searchParams.get('category') as any || undefined,
      priority: searchParams.get('priority') as any || undefined,
      unread_only: searchParams.get('unread_only') === 'true',
    };

    // Validate limits
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }

    // Call database function to get notifications
    const { data: notifications, error: notificationsError } = await supabase.rpc(
      'get_user_notifications',
      {
        p_user_id: userId,
        p_limit: params.limit,
        p_offset: params.offset,
        p_category: params.category || null,
        p_priority: params.priority || null,
        p_unread_only: params.unread_only || false,
      }
    );

    if (notificationsError) {
      console.error('[Notifications API] Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get total unread count
    const { data: unreadCount, error: countError } = await supabase.rpc(
      'get_user_unread_count',
      { p_user_id: userId }
    );

    if (countError) {
      console.error('[Notifications API] Error fetching unread count:', countError);
    }

    // Determine if there are more results
    const has_more = notifications && notifications.length === params.limit;

    const response: GetNotificationsResponse = {
      notifications: notifications || [],
      total: notifications?.length || 0,
      unread_count: unreadCount || 0,
      has_more: has_more || false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a new notification (Admin only)
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body: CreateNotificationRequest = await request.json();

    // Validate required fields
    if (!body.scope || !body.category || !body.priority || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: scope, category, priority, title, message' },
        { status: 400 }
      );
    }

    // Validate scope and targets - support both single and bulk
    if (body.scope === 'individual' && !body.target_user_id && (!body.target_user_ids || body.target_user_ids.length === 0)) {
      return NextResponse.json(
        { error: 'target_user_id or target_user_ids required for individual scope' },
        { status: 400 }
      );
    }
    if (body.scope === 'course' && !body.target_course_id && (!body.target_course_ids || body.target_course_ids.length === 0)) {
      return NextResponse.json(
        { error: 'target_course_id or target_course_ids required for course scope' },
        { status: 400 }
      );
    }
    if (body.scope === 'program' && !body.target_program_id && (!body.target_program_ids || body.target_program_ids.length === 0)) {
      return NextResponse.json(
        { error: 'target_program_id or target_program_ids required for program scope' },
        { status: 400 }
      );
    }

    // Get user's tenant_id
    const { data: userTenant, error: tenantError} = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (tenantError || !userTenant) {
      return NextResponse.json({ error: 'Failed to get user tenant' }, { status: 500 });
    }

    // Create service client for bypassing RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Handle bulk sending - create multiple notifications
    const notificationsToCreate = [];
    const emailLanguage = (body as any).email_language || 'he';

    // Determine which IDs to loop through
    if (body.scope === 'individual' && body.target_user_ids && body.target_user_ids.length > 0) {
      // Bulk send to multiple users
      for (const userId of body.target_user_ids) {
        notificationsToCreate.push({
          tenant_id: userTenant.tenant_id,
          scope: 'individual',
          target_user_id: userId,
          category: body.category,
          priority: body.priority,
          title: body.title,
          message: body.message,
          metadata: body.metadata || {},
          action_url: body.action_url || null,
          action_label: body.action_label || null,
          expires_at: body.expires_at || null,
        });
      }
    } else if (body.scope === 'course' && body.target_course_ids && body.target_course_ids.length > 0) {
      // Bulk send to multiple courses
      for (const courseId of body.target_course_ids) {
        notificationsToCreate.push({
          tenant_id: userTenant.tenant_id,
          scope: 'course',
          target_course_id: courseId,
          category: body.category,
          priority: body.priority,
          title: body.title,
          message: body.message,
          metadata: body.metadata || {},
          action_url: body.action_url || null,
          action_label: body.action_label || null,
          expires_at: body.expires_at || null,
        });
      }
    } else if (body.scope === 'program' && body.target_program_ids && body.target_program_ids.length > 0) {
      // Bulk send to multiple programs
      for (const programId of body.target_program_ids) {
        notificationsToCreate.push({
          tenant_id: userTenant.tenant_id,
          scope: 'program',
          target_program_id: programId,
          category: body.category,
          priority: body.priority,
          title: body.title,
          message: body.message,
          metadata: body.metadata || {},
          action_url: body.action_url || null,
          action_label: body.action_label || null,
          expires_at: body.expires_at || null,
        });
      }
    } else {
      // Single notification (original behavior)
      notificationsToCreate.push({
        tenant_id: userTenant.tenant_id,
        scope: body.scope,
        target_user_id: body.target_user_id || null,
        target_course_id: body.target_course_id || null,
        target_program_id: body.target_program_id || null,
        category: body.category,
        priority: body.priority,
        title: body.title,
        message: body.message,
        metadata: body.metadata || {},
        action_url: body.action_url || null,
        action_label: body.action_label || null,
        expires_at: body.expires_at || null,
      });
    }

    // Insert all notifications
    const { data: notifications, error: createError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToCreate)
      .select();

    if (createError) {
      console.error('[Notifications API] Error creating notifications:', JSON.stringify(createError, null, 2));
      return NextResponse.json(
        { error: 'Failed to create notifications', details: createError },
        { status: 500 }
      );
    }

    // Trigger email delivery if email channel is enabled
    if (body.channels && body.channels.includes('email')) {
      console.log('[Notifications API] Email channel enabled, triggering email delivery');

      const { sendNotificationEmailToRecipients } = await import('@/lib/notifications/emailDelivery');

      // Send emails for each notification
      for (const notification of notifications || []) {
        sendNotificationEmailToRecipients(
          notification,
          userTenant.tenant_id,
          emailLanguage as 'en' | 'he'
        ).catch(error => {
          console.error('[Notifications API] Error sending notification emails:', error);
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        notifications,
        count: notifications?.length || 0,
        message: `Successfully sent ${notifications?.length || 0} notification(s)`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Notifications API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
