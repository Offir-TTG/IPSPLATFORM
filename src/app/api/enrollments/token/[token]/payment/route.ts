import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getEnrollmentPaymentDetails } from '@/lib/payments/enrollmentService';

/**
 * GET /api/enrollments/token/:token/payment
 *
 * Get payment details for an enrollment using token (NO AUTHENTICATION REQUIRED)
 * Uses admin client to bypass RLS since users are not authenticated yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();

    // Get enrollment using token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at')
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    // Get payment details (pass admin client to bypass RLS for unauthenticated users)
    const paymentDetails = await getEnrollmentPaymentDetails(
      enrollment.id,
      enrollment.tenant_id,
      supabase // Pass admin client
    );

    return NextResponse.json(paymentDetails);

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/token/:token/payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
