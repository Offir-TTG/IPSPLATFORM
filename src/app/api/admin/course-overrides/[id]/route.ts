import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/course-overrides/[id] - Remove course override
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete override
    const { error } = await supabase
      .from('user_course_overrides')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting course override:', error);
      return NextResponse.json(
        { error: 'Failed to delete override' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/course-overrides/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/course-overrides/[id] - Update course override
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { access_type, reason, expires_at } = body;

    const updates: any = {};
    if (access_type !== undefined) {
      if (!['grant', 'hide'].includes(access_type)) {
        return NextResponse.json(
          { error: 'access_type must be either "grant" or "hide"' },
          { status: 400 }
        );
      }
      updates.access_type = access_type;
    }
    if (reason !== undefined) updates.reason = reason;
    if (expires_at !== undefined) updates.expires_at = expires_at;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_course_overrides')
      .update(updates)
      .eq('id', params.id)
      .select(`
        id,
        access_type,
        reason,
        expires_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating course override:', error);
      return NextResponse.json(
        { error: 'Failed to update override' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PATCH /api/admin/course-overrides/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
