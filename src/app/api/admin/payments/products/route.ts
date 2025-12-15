import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerProduct, listProducts } from '@/lib/payments/productService';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// GET /api/admin/payments/products - List all products
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const product_type = searchParams.get('product_type');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');

    const filters: any = {};
    if (product_type) filters.product_type = product_type;
    if (is_active !== null) filters.is_active = is_active === 'true';
    if (search) filters.search = search;

    const products = await listProducts(userData.tenant_id, filters);

    return NextResponse.json(products);

  } catch (error) {
    console.error('Error in GET /api/admin/payments/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments/products - Register a new product
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
      product_type,
      product_id,
      product_name,
      price,
      currency,
      auto_assign_payment_plan,
      default_payment_plan_id,
      forced_payment_plan_id,
      metadata,
    } = body;

    // Validate required fields
    if (!product_type || !product_id || !product_name || price === undefined) {
      return NextResponse.json(
        { error: 'product_type, product_id, product_name, and price are required' },
        { status: 400 }
      );
    }

    // Register product
    const product = await registerProduct({
      tenant_id: userData.tenant_id,
      product_type,
      product_id,
      product_name,
      price,
      currency,
      auto_assign_payment_plan,
      default_payment_plan_id,
      forced_payment_plan_id,
      metadata,
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'product.created',
      details: {
        productId: product.id,
        productType: product_type,
        productName: product_name,
        price: price,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(product);

  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/products:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
