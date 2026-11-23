import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { loadIntegration } from '@/lib/integrations/store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/enrollments/token/:token/payment/use-saved-card  { payment_method_id }
 *
 * When nothing is due now (pay per session, or a plan that starts later), a
 * client who already has a saved card picks it instead of typing a new one.
 * The card is confirmed for this enrollment's future charges, with no charge:
 * a Setup Intent confirmed with that card, stored on the enrollment, which is
 * what finishing the enrollment checks. NO AUTHENTICATION: the enrollment
 * token is the key.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { payment_method_id } = await request.json().catch(() => ({}));
    if (typeof payment_method_id !== 'string' || !payment_method_id) {
      return NextResponse.json({ error: 'Choose a card' }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at, user_id, stripe_customer_id, product_id')
      .eq('enrollment_token', params.token)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    if (enrollment.token_expires_at && new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    const { data: integration } = await loadIntegration(enrollment.tenant_id, 'stripe');
    if (!integration?.credentials?.secret_key) {
      return NextResponse.json({ error: 'Payment processing not configured. Please contact support.' }, { status: 500 });
    }
    const stripe = new Stripe(integration.credentials.secret_key, { apiVersion: '2023-10-16' });

    // The card must belong to this client's Stripe customer.
    let customerId = enrollment.stripe_customer_id as string | null;
    if (!customerId && enrollment.user_id) {
      const { data: u } = await supabase.from('users').select('stripe_customer_id').eq('id', enrollment.user_id).maybeSingle();
      customerId = u?.stripe_customer_id ?? null;
    }
    const pm = await stripe.paymentMethods.retrieve(payment_method_id).catch(() => null);
    const owner = pm ? (typeof pm.customer === 'string' ? pm.customer : pm.customer?.id) : null;
    if (!pm || !owner || (customerId && owner !== customerId)) {
      return NextResponse.json({ error: 'This card is not saved for this account' }, { status: 400 });
    }

    const { data: product } = await supabase.from('products').select('title').eq('id', enrollment.product_id).maybeSingle();
    const setupIntent = await stripe.setupIntents.create({
      customer: owner,
      payment_method: payment_method_id,
      payment_method_types: ['card'],
      usage: 'off_session',
      confirm: true,
      metadata: { enrollment_id: enrollment.id, tenant_id: enrollment.tenant_id, purpose: 'saved_card_for_enrollment' },
      description: `Saved card for ${product?.title || 'Product'} - Enrollment ${enrollment.id}`,
    });

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'This card needs to be confirmed again. Please add it as a new card.', status: setupIntent.status },
        { status: 402 },
      );
    }

    await supabase
      .from('enrollments')
      .update({ stripe_setup_intent_id: setupIntent.id, stripe_customer_id: owner })
      .eq('id', enrollment.id);
    return NextResponse.json({ ok: true, setup_intent_id: setupIntent.id });
  } catch (error: any) {
    console.error('[Use Saved Card]', error);
    return NextResponse.json({ error: error?.message || 'Could not use this card' }, { status: 500 });
  }
}
