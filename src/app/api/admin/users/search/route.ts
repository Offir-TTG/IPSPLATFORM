import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users/search
 *
 * Search users by email for enrollment creation
 * Supports partial matching and auto-complete functionality
 *
 * Query params:
 * - email: Email to search (minimum 3 characters)
 *
 * Returns:
 * - users: Array of matching users with basic info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Validate email parameter
    if (!email || email.length < 3) {
      return NextResponse.json({ users: [] });
    }

    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Search users by email (partial match, case-insensitive)
    // Only return users from the same tenant
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, status, role')
      .ilike('email', `%${email}%`)
      .eq('tenant_id', userData.tenant_id)
      .order('email', { ascending: true })
      .limit(10);

    if (searchError) {
      console.error('Error searching users:', searchError);
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    // Return users with status info
    return NextResponse.json({
      users: users?.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone: u.phone,
        status: u.status,
        role: u.role,
        display_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
      })) || []
    });

  } catch (error) {
    console.error('Error in user search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
