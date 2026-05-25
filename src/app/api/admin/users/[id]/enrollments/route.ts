import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/enrollments
// Returns the user's enrollments with the joined product (program/course)
// title and the payment rollup we already store on the enrollment row.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('enrollments')
      .select(`
        id,
        status,
        payment_status,
        total_amount,
        paid_amount,
        enrollment_type,
        created_at,
        product:products ( id, title, type )
      `)
      .eq('user_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('enrollments query failed:', error);
      return NextResponse.json(
        { error: 'Failed to load enrollments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollments: data ?? [] });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/enrollments:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
