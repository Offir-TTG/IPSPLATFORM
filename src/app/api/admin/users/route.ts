import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/users - List users with optional role filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const emailFilter = searchParams.get('email');

    // Build query
    let query = supabase
      .from('users')
      .select('id, first_name, last_name, email, role, phone, created_at')
      .eq('tenant_id', userData.tenant_id);

    // Apply role filter if provided
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    // Apply email filter if provided (case-insensitive exact match)
    if (emailFilter) {
      // Use eq with lowercase for exact case-insensitive match
      const normalizedEmail = emailFilter.toLowerCase();
      console.log('[Email Check] Searching for email:', normalizedEmail);
      query = query.eq('email', normalizedEmail);
    } else {
      // Only sort by name if not filtering by email (for performance)
      query = query.order('first_name', { ascending: true });
    }

    const { data: users, error } = await query;

    if (emailFilter) {
      console.log('[Email Check] Results for', emailFilter, ':', users?.length || 0, 'users found');
    }

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Return with no-cache headers to prevent stale data
    return NextResponse.json(users || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
