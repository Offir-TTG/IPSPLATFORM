import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

// GET /api/admin/payments/plans - List all payment plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Get all payment plans for this tenant
    const { data: plans, error } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching payment plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment plans' },
        { status: 500 }
      );
    }

    return NextResponse.json(plans || []);

  } catch (error) {
    console.error('Error in GET /api/admin/payments/plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments/plans - Create a new payment plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const {
      plan_name,
      plan_description,
      plan_type,
      deposit_percentage,
      deposit_amount,
      installment_count,
      installment_frequency,
      subscription_frequency,
      auto_detect_enabled,
      priority,
      is_active,
      is_default,
    } = body;

    if (!plan_name || !plan_type) {
      return NextResponse.json(
        { error: 'plan_name and plan_type are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other default plans
    if (is_default) {
      await supabase
        .from('payment_plans')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id)
        .eq('is_default', true);
    }

    // Build insert object based on plan_type
    const insertData: any = {
      tenant_id: userData.tenant_id,
      plan_name,
      plan_description,
      plan_type,
      auto_detect_enabled: auto_detect_enabled ?? true,
      priority: priority ?? 10,
      is_active: is_active ?? true,
      is_default: is_default ?? false,
    };

    // Add type-specific fields
    if (plan_type === 'deposit' || plan_type === 'installments') {
      if (deposit_percentage) {
        insertData.deposit_type = 'percentage';
        insertData.deposit_percentage = deposit_percentage;
      } else if (deposit_amount) {
        insertData.deposit_type = 'fixed';
        insertData.deposit_amount = deposit_amount;
      }
      if (installment_count) insertData.installment_count = installment_count;
      if (installment_frequency) insertData.installment_frequency = installment_frequency;
    }

    if (plan_type === 'subscription') {
      if (subscription_frequency) insertData.subscription_frequency = subscription_frequency;
    }

    // Create payment plan
    const { data, error } = await supabase
      .from('payment_plans')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment plan:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create payment plan' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in POST /api/admin/payments/plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
