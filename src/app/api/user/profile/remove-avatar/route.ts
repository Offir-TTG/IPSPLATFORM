import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/user/profile/remove-avatar - Remove user profile avatar
export const DELETE = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    console.log('Server-side avatar removal started for user:', user.email);

    const supabase = await createClient();

    // Get tenant_id for audit logging
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = tenantUser?.tenant_id;

    // Get current avatar URL to delete the file
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch user data:', fetchError);
    }

    // If user has an avatar in storage, delete it
    if (userData?.avatar_url) {
      try {
        // Extract the file path from the URL
        const url = new URL(userData.avatar_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Gets "user-id/filename.ext"

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('user-avatars')
          .remove([filePath]);

        if (deleteError) {
          console.error('Failed to delete avatar from storage:', deleteError);
          // Continue anyway - we'll still clear the URL from the database
        } else {
          console.log('Avatar deleted from storage:', filePath);
        }
      } catch (parseError) {
        console.error('Failed to parse avatar URL:', parseError);
        // Continue anyway
      }
    }

    // Update user's avatar_url to null in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user avatar_url:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove avatar from database' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      action: 'user.avatar_removed',
      details: {
        previousUrl: userData?.avatar_url || null,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Remove avatar error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove avatar'
      },
      { status: 500 }
    );
  }
}, ['student', 'instructor', 'admin']);
