import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// GET /api/user/profile - Get user profile data
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();

      // Fetch user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Profile query error:', userError);

        // Log failed profile access
        logAuditEvent({
          userId: user.id,
          userEmail: user.email || 'unknown',
          action: 'profile.access_failed',
          details: {
            resourceType: 'profile',
            resourceId: user.id,
            error: userError.message,
          },
        }).catch((err) => console.error('Audit log failed:', err));

        return NextResponse.json(
          { success: false, error: 'Failed to fetch profile data' },
          { status: 500 }
        );
      }

      // Fetch user preferences (if we have a preferences table)
      // For now, we'll use default preferences that will be stored in user metadata or a separate table later
      const preferences = {
        notifications: {
          lesson_reminders: true,
          achievement_updates: true,
          assignment_due_dates: true,
          course_announcements: true,
        },
        regional: {
          language: 'en', // Could come from user metadata
          timezone: 'Asia/Jerusalem', // Default timezone
        },
      };

      // Fetch active sessions from audit_sessions table
      const { data: sessions, error: sessionsError } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })
        .limit(10);

      const activeSessions = sessions?.map((session) => ({
        id: session.id,
        device: session.device_type || session.browser || 'Unknown Device',
        location: session.city && session.country_code
          ? `${session.city}, ${session.country_code}`
          : session.country_code || 'Unknown',
        last_active: session.last_activity_at,
        is_current: session.session_id === request.headers.get('x-session-id'), // Compare with current session
        ip_address: session.ip_address?.toString(),
        user_agent: session.user_agent,
      })) || [];

      // Async audit logging (don't block response)
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'profile.accessed',
        details: {
          resourceType: 'profile',
          resourceId: user.id,
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json({
        success: true,
        data: {
          user: userData,
          preferences,
          security: {
            password_last_changed: userData.updated_at, // Placeholder - would need separate tracking
            two_factor_enabled: false, // Not implemented yet
            active_sessions: activeSessions,
          },
        },
      });
    } catch (error) {
      console.error('Profile error:', error);

      // Log error
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'profile.error',
        details: {
          resourceType: 'profile',
          resourceId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);

// PATCH /api/user/profile - Update user profile
export const PATCH = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const body = await request.json();
      const {
        first_name,
        last_name,
        phone,
        is_whatsapp,
        contact_email,
        bio,
        location,
        timezone,
        website,
        linkedin_url,
        facebook_url,
        instagram_url,
      } = body;

      const supabase = await createClient();

      // Fetch current user data for audit trail (before values)
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Build update object with only provided fields
      const updateData: Record<string, any> = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;
      if (is_whatsapp !== undefined) updateData.is_whatsapp = is_whatsapp;
      if (contact_email !== undefined) updateData.contact_email = contact_email;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (website !== undefined) updateData.website = website;
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
      if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
      if (instagram_url !== undefined) updateData.instagram_url = instagram_url;

      // Build change tracking object for audit
      const changes: Record<string, { before: any; after: any }> = {};
      if (currentUser) {
        Object.keys(updateData).forEach((key) => {
          if (currentUser[key] !== updateData[key]) {
            changes[key] = {
              before: currentUser[key],
              after: updateData[key],
            };
          }
        });
      }

      // Update user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);

        // Log failed update
        logAuditEvent({
          userId: user.id,
          userEmail: user.email || 'unknown',
          action: 'profile.update_failed',
          details: {
            resourceType: 'profile',
            resourceId: user.id,
            error: updateError.message,
            fields: Object.keys(updateData),
          },
        }).catch((err) => console.error('Audit log failed:', err));

        return NextResponse.json(
          { success: false, error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      // Log successful update with before/after changes
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'profile.updated',
        details: {
          resourceType: 'profile',
          resourceId: user.id,
          fields: Object.keys(updateData),
          changes: changes, // Track what actually changed
          changeCount: Object.keys(changes).length,
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Profile update error:', error);

      // Log error
      logAuditEvent({
        userId: user.id,
        userEmail: user.email || 'unknown',
        action: 'profile.update_error',
        details: {
          resourceType: 'profile',
          resourceId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch((err) => console.error('Audit log failed:', err));

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor', 'admin']
);
