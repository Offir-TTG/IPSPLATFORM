import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/enrollments - List all enrollments (with filters)
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('user_programs')
      .select(`
        id,
        enrollment_status,
        enrolled_at,
        completed_at,
        expires_at,
        created_at,
        user:users (
          id,
          first_name,
          last_name,
          email
        ),
        program:programs (
          id,
          name,
          description
        )
      `)
      .order('enrolled_at', { ascending: false });

    if (programId) query = query.eq('program_id', programId);
    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('enrollment_status', status);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error in GET /api/admin/enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrollments - Enroll user in program
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      user_id,
      program_id,
      enrollment_status = 'active',
      expires_at
    } = body;

    if (!user_id || !program_id) {
      return NextResponse.json(
        { error: 'user_id and program_id are required' },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('user_programs')
      .insert({
        user_id,
        program_id,
        enrollment_status,
        expires_at,
        created_by: user.id
      })
      .select(`
        id,
        enrollment_status,
        enrolled_at,
        expires_at,
        user:users (
          id,
          first_name,
          last_name,
          email
        ),
        program:programs (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
