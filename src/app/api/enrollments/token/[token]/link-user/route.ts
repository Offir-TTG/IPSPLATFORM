import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { deleteEnrollmentsWithCharges } from '@/lib/payments/deleteEnrollments';
import { enrollmentsWithMoney, isUniqueViolation, startOrContinue, type StartOrContinue } from '@/lib/payments/openEnrollment';

/**
 * POST /api/enrollments/token/:token/link-user
 *
 * Joins a guest enrollment to the logged-in client (they logged in from the
 * enrollment, or opened its link while logged in), through the one rule in
 * lib/payments/openEnrollment. The answer's `kind` says what happened:
 *
 *   linked            this enrollment is now the client's (or already was)
 *   continue          the client already had an open one in this product:
 *                     use `enrollment_id` / `wizard_url`; the empty guest
 *                     row is deleted
 *   already_enrolled  the client is already in this product (`redirect`)
 *   suspended         their membership is on hold (`redirect` to Billing)
 *   staff             a team member: nothing is joined; the wizard is a preview
 *
 * Refused (409): the enrollment belongs to someone else, or the email typed
 * in it is not the account's email (a forwarded link can't be claimed).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    const { data: enrollment, error: enrollmentError } = await adminClient
      .from('enrollments')
      .select('id, user_id, tenant_id, product_id, child_id, status, token_expires_at, wizard_profile_data')
      .eq('enrollment_token', params.token)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      console.error('[Link User] Enrollment not found:', enrollmentError);
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Same rules as every other link route: an expired link, or an
    // enrollment that's finished or cancelled, can't be claimed.
    if (!enrollment.token_expires_at || new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }
    if (!['draft', 'pending'].includes(enrollment.status)) {
      return NextResponse.json({ error: 'This enrollment is no longer open' }, { status: 409 });
    }

    if (enrollment.user_id) {
      if (enrollment.user_id === user.id) {
        return NextResponse.json({
          success: true,
          kind: 'linked',
          message: 'Enrollment already linked to your account',
          enrollment_id: enrollment.id,
        });
      }
      return NextResponse.json(
        { error: 'This enrollment is already linked to another account', code: 'other_account' },
        { status: 409 }
      );
    }

    const { data: userProfile, error: userError } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name, phone, location, role')
      .eq('id', user.id)
      .eq('tenant_id', enrollment.tenant_id)
      .maybeSingle();

    if (userError || !userProfile) {
      console.error('[Link User] User not found in tenant:', userError);
      return NextResponse.json(
        { error: 'User profile not found for this organization' },
        { status: 404 }
      );
    }

    // A team member opening a client's link never takes it over.
    if (userProfile.role === 'admin' || userProfile.role === 'super_admin') {
      return NextResponse.json({ success: true, kind: 'staff', linked: false, enrollment_id: enrollment.id });
    }

    // Only the person it was started for: no email typed yet, or the account's.
    const typedEmail = String((enrollment.wizard_profile_data as any)?.email ?? '').trim().toLowerCase();
    const accountEmails = [userProfile.email, user.email].filter(Boolean).map((e) => String(e).trim().toLowerCase());
    if (typedEmail && !accountEmails.includes(typedEmail)) {
      return NextResponse.json(
        {
          error: 'This enrollment was started with a different email address than your account.',
          code: 'email_mismatch',
        },
        { status: 409 }
      );
    }

    const decide = () =>
      startOrContinue(adminClient, {
        tenantId: enrollment.tenant_id,
        productId: enrollment.product_id,
        userId: user.id,
        childId: enrollment.child_id,
      });

    /**
     * The client already has this product. An open one: theirs is continued
     * and this guest row, when nothing was paid in it, is deleted. Already
     * enrolled: the guest row is left alone (a guest one is cleared by the
     * daily cleanup after 7 days).
     */
    const answerWithExisting = async (found: Exclude<StartOrContinue, { kind: 'start' }>) => {
      if (found.kind === 'continue') {
        const paid = await enrollmentsWithMoney(adminClient, [enrollment.id]);
        if (!paid.has(enrollment.id)) {
          const { error } = await deleteEnrollmentsWithCharges(adminClient, [enrollment.id]);
          if (error) console.error('[Link User] Could not delete the guest enrollment:', error);
        }
        const token = found.enrollment.enrollment_token;
        return NextResponse.json({
          success: true,
          kind: 'continue',
          enrollment_id: found.enrollment.id,
          enrollment_token: token,
          wizard_url: token ? `/enroll/${token}` : null,
        });
      }
      return NextResponse.json({
        success: true,
        kind: found.kind,
        enrollment_id: found.enrollment.id,
        redirect: found.kind === 'suspended' ? '/billing' : '/dashboard',
      });
    };

    const found = await decide();
    if (found.kind !== 'start') return answerWithExisting(found);

    // Join this enrollment to the client and pre-fill their details.
    const { error: updateError } = await adminClient
      .from('enrollments')
      .update({
        user_id: user.id,
        wizard_profile_data: {
          email: userProfile.email,
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
          address: userProfile.location || ''
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id)
      .is('user_id', null);

    if (updateError && isUniqueViolation(updateError)) {
      // An open one appeared for this client a moment ago: continue that one.
      const again = await decide();
      if (again.kind !== 'start') return answerWithExisting(again);
    }
    if (updateError) {
      console.error('[Link User] Failed to link user:', updateError);
      return NextResponse.json(
        { error: 'Failed to link user to enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      kind: 'linked',
      message: 'Account linked successfully',
      enrollment_id: enrollment.id,
      user_id: user.id
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/token/:token/link-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
