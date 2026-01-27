import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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
