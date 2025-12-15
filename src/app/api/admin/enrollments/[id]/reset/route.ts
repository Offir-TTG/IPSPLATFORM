import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/enrollments/:id/reset
 *
 * Reset an enrollment to allow the user to go through the wizard again
 * Admin only endpoint
 *
 * Query parameters:
 * - reset_signature: boolean - Reset DocuSign signature status
 * - reset_payment: boolean - Reset payment status
 * - reset_profile: boolean - Clear onboarding flags
 */
export async function POST(
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
      .select('id, role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin permission
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const resetSignature = url.searchParams.get('reset_signature') === 'true';
    const resetPayment = url.searchParams.get('reset_payment') === 'true';
    const resetProfile = url.searchParams.get('reset_profile') === 'true';

    // Get enrollment with token
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, user_id, tenant_id, status, enrollment_token')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Build update object
    // Set to 'draft' status so admin can edit the enrollment before user starts wizard
    const updates: any = {
      status: 'draft',
      payment_status: 'pending',
      paid_amount: 0,
      next_payment_date: null,
      // Note: enrolled_at has NOT NULL constraint, so we keep the original value
      completed_at: null,
      cancelled_at: null,
      signature_status: null,
      docusign_envelope_id: null,
      updated_at: new Date().toISOString()
    };

    // Optional: Keep payment data if admin doesn't want to reset it
    if (!resetPayment) {
      // Keep payment_status as-is if not resetting payment
      const { data: currentData } = await supabase
        .from('enrollments')
        .select('payment_status, paid_amount')
        .eq('id', enrollment.id)
        .single();

      if (currentData) {
        updates.payment_status = currentData.payment_status;
        updates.paid_amount = currentData.paid_amount || 0;
      }
    }

    // Optional: Keep signature data if admin doesn't want to reset it
    if (!resetSignature) {
      const { data: currentData } = await supabase
        .from('enrollments')
        .select('signature_status, docusign_envelope_id')
        .eq('id', enrollment.id)
        .single();

      if (currentData) {
        updates.signature_status = currentData.signature_status;
        updates.docusign_envelope_id = currentData.docusign_envelope_id;
      }
    }

    // Update enrollment
    const { error: updateError } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error resetting enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset enrollment' },
        { status: 500 }
      );
    }

    // Reset user onboarding if requested
    if (resetProfile) {
      await supabase
        .from('users')
        .update({
          onboarding_enrollment_id: enrollment.id,
          onboarding_completed: false
        })
        .eq('id', enrollment.user_id);
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      tenant_id: enrollment.tenant_id,
      user_id: userData.id,
      action: 'enrollment_reset',
      resource_type: 'enrollment',
      resource_id: enrollment.id,
      details: {
        reset_signature: resetSignature,
        reset_payment: resetPayment,
        reset_profile: resetProfile,
        previous_status: enrollment.status
      },
      created_at: new Date().toISOString()
    });

    // Build enrollment URL with token (public access, no login required)
    const enrollmentUrl = enrollment.enrollment_token
      ? `/enroll/${enrollment.enrollment_token}`
      : `/enroll/wizard/${enrollment.id}`; // Fallback to ID-based (requires user login)

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      wizard_url: enrollmentUrl,
      reset_details: {
        signature: resetSignature,
        payment: resetPayment,
        profile: resetProfile
      }
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/enrollments/:id/reset:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
