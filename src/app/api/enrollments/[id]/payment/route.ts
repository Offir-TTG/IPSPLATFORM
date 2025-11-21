import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEnrollmentPaymentDetails } from '@/lib/payments/enrollmentService';

// GET /api/enrollments/:id/payment - Get payment details for an enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment to verify ownership
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check authorization - user can only see their own enrollments unless admin
    if (enrollment.user_id !== user.id && !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get payment details
    const paymentDetails = await getEnrollmentPaymentDetails(params.id, userData.tenant_id);

    return NextResponse.json(paymentDetails);

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/:id/payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
