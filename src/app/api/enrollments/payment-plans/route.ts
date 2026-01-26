import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/enrollments/payment-plans?ids=id1,id2,id3&product_id=xxx
 *
 * Public endpoint to fetch payment plan templates for enrollment wizard
 * Validates that the requested plans belong to the specified product
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');
    const productId = searchParams.get('product_id');

    if (!idsParam || !productId) {
      return NextResponse.json(
        { error: 'Missing required parameters: ids and product_id' },
        { status: 400 }
      );
    }

    const planIds = idsParam.split(',').filter(id => id.trim());

    console.log('[Payment Plans API] Request:', { planIds, productId });

    if (planIds.length === 0) {
      return NextResponse.json(
        { error: 'No plan IDs provided' },
        { status: 400 }
      );
    }

    // Use admin client since this is a public endpoint
    const supabase = createAdminClient();

    // First, verify the product exists and has these plan IDs
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, alternative_payment_plan_ids')
      .eq('id', productId)
      .single();

    console.log('[Payment Plans API] Product lookup:', { product, productError });

    if (productError || !product) {
      console.error('[Payment Plans API] Product not found:', productError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verify all requested plan IDs are in the product's alternative_payment_plan_ids
    const productPlanIds = product.alternative_payment_plan_ids || [];
    const invalidPlanIds = planIds.filter(id => !productPlanIds.includes(id));

    console.log('[Payment Plans API] Validation:', { productPlanIds, invalidPlanIds });

    if (invalidPlanIds.length > 0) {
      console.error('[Payment Plans API] Invalid plan IDs:', invalidPlanIds);
      return NextResponse.json(
        { error: 'Some plan IDs do not belong to this product', invalidPlanIds },
        { status: 403 }
      );
    }

    // Fetch the payment plans
    const { data: plans, error: plansError } = await supabase
      .from('payment_plans')
      .select(`
        id,
        plan_name,
        plan_type,
        deposit_type,
        deposit_amount,
        deposit_percentage,
        installment_count,
        installment_frequency,
        custom_frequency_days,
        subscription_frequency,
        subscription_trial_days,
        plan_description
      `)
      .in('id', planIds)
      .eq('is_active', true);

    console.log('[Payment Plans API] Plans query result:', { plans, plansError, count: plans?.length });

    if (plansError) {
      console.error('[Payment Plans API] Error fetching payment plans:', plansError);
      return NextResponse.json(
        { error: 'Failed to fetch payment plans' },
        { status: 500 }
      );
    }

    console.log('[Payment Plans API] Returning plans:', plans);
    return NextResponse.json({ plans: plans || [] });

  } catch (error) {
    console.error('Error in GET /api/enrollments/payment-plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
