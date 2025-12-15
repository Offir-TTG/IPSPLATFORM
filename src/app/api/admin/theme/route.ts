import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logConfigChange, logAuditEvent } from '@/lib/audit/auditService';

export const dynamic = 'force-dynamic';

// GET - Fetch all theme configurations (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role from metadata (avoid RLS issues with users table)
    const userRole = user.user_metadata?.role || 'user';
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data: themes, error } = await supabase
      .from('theme_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    console.error('Get themes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}

// POST - Create new theme configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role from metadata (avoid RLS issues with users table)
    const userRole = user.user_metadata?.role || 'user';
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { data: theme, error } = await supabase
      .from('theme_configs')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event for theme creation
    await logAuditEvent({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'CONFIG',
      resource_type: 'theme_config',
      resource_id: theme.id,
      resource_name: theme.theme_name,
      action: 'Created new theme configuration',
      new_values: theme,
      risk_level: 'medium',
      metadata: {
        is_active: theme.is_active,
      },
    });

    return NextResponse.json({
      success: true,
      data: theme,
      message: 'Theme created successfully',
    });
  } catch (error) {
    console.error('Create theme error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create theme' },
      { status: 500 }
    );
  }
}

// PUT - Update theme configuration
export async function PUT(request: NextRequest) {
  try {
    // Use regular client for authentication
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Theme PUT] Auth check:', { user: user?.id, authError });

    if (!user) {
      console.log('[Theme PUT] No user found - returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'student';
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    // Get old values for audit trail using admin client
    const { data: oldTheme } = await adminClient
      .from('theme_configs')
      .select('*')
      .eq('id', id)
      .single();

    // Update theme using admin client (bypasses RLS)
    const { data: theme, error } = await adminClient
      .from('theme_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event for theme configuration change
    try {
      console.log('[Theme API] Logging audit event for theme update:', { userId: user.id, themeId: id });
      const auditResult = await logConfigChange(
        user.id,
        'theme_config',
        id,
        oldTheme,
        theme,
        {
          theme_name: theme.theme_name,
          is_active: theme.is_active,
          changed_fields: Object.keys(updates),
        }
      );
      console.log('[Theme API] Audit event logged:', auditResult);
    } catch (auditError) {
      console.error('[Theme API] Failed to log audit event:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: theme,
      message: 'Theme updated successfully',
    });
  } catch (error) {
    console.error('Update theme error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update theme' },
      { status: 500 }
    );
  }
}

// DELETE - Delete theme configuration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role from metadata (avoid RLS issues with users table)
    const userRole = user.user_metadata?.role || 'user';
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    // Check if it's the active theme and get theme details for audit
    const { data: theme } = await supabase
      .from('theme_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (theme?.is_active) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete active theme' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('theme_configs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event for theme deletion
    await logAuditEvent({
      user_id: user.id,
      event_type: 'DELETE',
      event_category: 'CONFIG',
      resource_type: 'theme_config',
      resource_id: id,
      resource_name: theme?.theme_name,
      action: 'Deleted theme configuration',
      old_values: theme,
      risk_level: 'high',
      metadata: {
        was_active: theme?.is_active,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Theme deleted successfully',
    });
  } catch (error) {
    console.error('Delete theme error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete theme' },
      { status: 500 }
    );
  }
}
