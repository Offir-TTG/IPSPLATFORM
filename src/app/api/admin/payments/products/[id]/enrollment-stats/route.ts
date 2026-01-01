import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/products/[id]/enrollment-stats
// Returns count of active and pending enrollments for this product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const productId = params.id;

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

    // Count active enrollments for this product (active + pending status)
    const { count: activeCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['active', 'pending']);

    // Count draft enrollments (pending invitations not yet completed by user)
    const { count: draftCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'draft');

    return NextResponse.json({
      active_enrollments: activeCount || 0,
      pending_invitations: draftCount || 0,
      total: (activeCount || 0) + (draftCount || 0)
    });

  } catch (error) {
    console.error('Error in GET /api/admin/payments/products/[id]/enrollment-stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
