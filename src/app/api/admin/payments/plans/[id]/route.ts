import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

// PUT /api/admin/payments/plans/[id] - Update a payment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // If setting as default, unset other default plans
    if (is_default) {
      await supabase
        .from('payment_plans')
        .update({ is_default: false })
        .eq('tenant_id', userData.tenant_id)
        .eq('is_default', true)
        .neq('id', params.id);
    }

    // Build update object based on plan_type
    const updateData: any = {
      plan_name,
      plan_description,
      plan_type,
      auto_detect_enabled,
      priority,
      is_active,
      is_default,
      // Clear all type-specific fields first
      deposit_type: null,
      deposit_amount: null,
      deposit_percentage: null,
      installment_count: null,
      installment_frequency: null,
      subscription_frequency: null,
    };

    // Add type-specific fields
    if (plan_type === 'deposit' || plan_type === 'installments') {
      if (deposit_percentage) {
        updateData.deposit_type = 'percentage';
        updateData.deposit_percentage = deposit_percentage;
      } else if (deposit_amount) {
        updateData.deposit_type = 'fixed';
        updateData.deposit_amount = deposit_amount;
      }
      if (installment_count) updateData.installment_count = installment_count;
      if (installment_frequency) updateData.installment_frequency = installment_frequency;
    }

    if (plan_type === 'subscription') {
      if (subscription_frequency) updateData.subscription_frequency = subscription_frequency;
    }

    // Update payment plan
    const { data, error } = await supabase
      .from('payment_plans')
      .update(updateData)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment plan:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update payment plan' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Payment plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PUT /api/admin/payments/plans/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payments/plans/[id] - Delete a payment plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if plan is in use (has enrollments)
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('payment_plan_id', params.id);

    if (enrollmentCount && enrollmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment plan that is in use' },
        { status: 400 }
      );
    }

    // Get plan details for audit log
    const { data: plan } = await supabase
      .from('payment_plans')
      .select('plan_name, plan_type')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    // Delete payment plan
    const { error } = await supabase
      .from('payment_plans')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (error) {
      console.error('Error deleting payment plan:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete payment plan' },
        { status: 500 }
      );
    }

    // Log audit event
    if (plan) {}

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/payments/plans/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
