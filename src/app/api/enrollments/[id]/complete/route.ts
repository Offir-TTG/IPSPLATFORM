import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { emitPersonBecameCustomer } from '@/lib/persons/outbox';

export const dynamic = 'force-dynamic';

/**
 * POST /api/enrollments/:id/complete
 *
 * Complete the enrollment wizard and activate the enrollment
 * This should only be called after all required steps are complete:
 * - Signature (if required)
 * - Profile completion
 * - Payment (if required)
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
      .select('id, tenant_id, first_name, last_name, phone, address, city, country, person_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment with product details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        signature_status,
        tenant_id,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          payment_model,
          keap_tag
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check authorization
    if (enrollment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Validate all required steps are complete

    // 1. Check signature (if required)
    if (product.requires_signature && enrollment.signature_status !== 'completed') {
      return NextResponse.json(
        { error: 'Signature required but not completed' },
        { status: 400 }
      );
    }

    // 2. Check profile completion
    const requiredFields = ['first_name', 'last_name', 'phone', 'address', 'city', 'country'];
    const profileComplete = requiredFields.every(field => {
      const value = userData[field as keyof typeof userData];
      return value !== null && value !== undefined && value !== '';
    });

    if (!profileComplete) {
      return NextResponse.json(
        { error: 'Profile incomplete - please complete all required fields' },
        { status: 400 }
      );
    }

    // 3. Check payment (if required)
    const paymentRequired = product.payment_model !== 'free' && enrollment.total_amount > 0;
    if (paymentRequired) {
      const paymentComplete = enrollment.paid_amount >= enrollment.total_amount;
      if (!paymentComplete) {
        return NextResponse.json(
          { error: 'Payment required but not completed' },
          { status: 400 }
        );
      }
    }

    // All checks passed - activate enrollment
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: 'active',
        enrolled_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error activating enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate enrollment' },
        { status: 500 }
      );
    }

    // Clear onboarding flags
    await supabase
      .from('users')
      .update({
        onboarding_enrollment_id: null,
        onboarding_completed: true
      })
      .eq('id', userData.id);

    // Apply Keap tag if configured
    if (product.keap_tag) {
      try {
        await fetch('/api/admin/keap/tags/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userData.id,
            tag_name: product.keap_tag
          })
        });
      } catch (keapError) {
        // Log but don't fail enrollment if Keap fails
        console.error('Error applying Keap tag:', keapError);
      }
    }

    // ─── Cross-platform notify ────────────────────────────────────────
    // Any successful enrollment — free OR paid — promotes the contact
    // to "customer" on IParentingSchool. (The Stripe webhook also
    // fires this for paid checkouts; the IParentingSchool handler is
    // idempotent so two emits for the same person are a no-op.)
    // Free products would otherwise never trigger the Stripe path, so
    // this is the canonical hook point for the customer transition.
    if (userData.person_id) {
      const adminClient = createAdminClient();
      await emitPersonBecameCustomer(adminClient, {
        personId: userData.person_id,
        userId: userData.id,
        firstPurchaseAt: new Date().toISOString(),
        productSummary: {
          product_name: product.title,
          product_type: product.type ?? null,
          amount: enrollment.total_amount ?? 0,
          currency: (enrollment.currency ?? 'USD').toUpperCase(),
        },
      });
    } else {
      // person_id not yet resolved (signup-pending still in flight).
      // The drainer will deliver person.linked shortly; the contact
      // remains "contact" until then. An admin viewing the contact
      // after that point will see the lifecycle catch up the next
      // time a customer-state event fires.
      console.warn(
        '[enrollments/complete] users.person_id is null; skipping became_customer emit',
        userData.id,
      );
    }

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      status: 'active'
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/:id/complete:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
