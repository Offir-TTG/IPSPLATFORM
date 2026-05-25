/**
 * GET /api/admin/payments/enrollments-by-user?user_id=...
 *
 * Lightweight helper for the "Record off-schedule payment" dialog:
 * returns enrollments for one user so the admin can optionally link
 * the payment to a specific enrollment. Scoped to the caller's tenant.
 *
 * Returns: { enrollments: [{ id, product_name, status, paid_amount,
 *                            total_amount, payment_status, currency }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    if (!user_id) {
      return NextResponse.json({ enrollments: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Embed product to display a friendly name in the picker. `products`
    // may have its own translations elsewhere; for the picker the base
    // title is sufficient.
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `id, status, paid_amount, total_amount, currency, payment_status,
         products(id, title)`,
      )
      .eq('user_id', user_id)
      .eq('tenant_id', caller.tenant_id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    const enrollments = (data ?? []).map((e: any) => ({
      id: e.id as string,
      status: e.status as string,
      paid_amount: Number(e.paid_amount ?? 0),
      total_amount: Number(e.total_amount ?? 0),
      currency: (e.currency as string) ?? 'USD',
      payment_status: e.payment_status as string | null,
      product_name: (e.products?.title as string) ?? '—',
    }));

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    console.error('Error in GET /api/admin/payments/enrollments-by-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
