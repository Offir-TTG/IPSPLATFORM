import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Product, ProductFormData } from '@/types/product';

export const dynamic = 'force-dynamic';

// GET all products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const payment_model = searchParams.get('payment_model');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');

    const supabase = await createClient();

    // Get tenant_id from authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can access products
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Build query with joins for content references
    // Use explicit foreign key names to avoid ambiguity
    let query = supabase
      .from('products')
      .select(`
        *,
        program:programs!products_program_id_fkey(id, name, description, image_url),
        course:courses!products_course_id_fkey(id, title, description, image_url)
      `)
      .eq('tenant_id', userData.tenant_id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (payment_model) {
      query = query.eq('payment_model', payment_model);
    }
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('Get products error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body: ProductFormData = await request.json();

    const supabase = await createClient();

    // Get tenant_id from authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can create products
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Validate required fields based on product type
    if (body.type === 'program' && !body.program_id) {
      return NextResponse.json(
        { success: false, error: 'program_id is required for program type' },
        { status: 400 }
      );
    }
    if (body.type === 'course' && !body.course_id) {
      return NextResponse.json(
        { success: false, error: 'course_id is required for course type' },
        { status: 400 }
      );
    }
    if (body.type === 'bundle' && (!body.contains_courses || body.contains_courses.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'contains_courses is required for bundle type' },
        { status: 400 }
      );
    }
    if (body.type === 'session_pack' && (!body.session_count || body.session_count <= 0)) {
      return NextResponse.json(
        { success: false, error: 'session_count is required for session_pack type' },
        { status: 400 }
      );
    }

    // Validate signature requirements
    if (body.requires_signature && !body.signature_template_id) {
      return NextResponse.json(
        { success: false, error: 'signature_template_id is required when requires_signature is true' },
        { status: 400 }
      );
    }

    // Validate price based on payment model
    if (body.payment_model !== 'free' && (!body.price || body.price <= 0)) {
      return NextResponse.json(
        { success: false, error: 'price is required for paid products' },
        { status: 400 }
      );
    }
    if (body.payment_model === 'free' && body.price) {
      return NextResponse.json(
        { success: false, error: 'price must be null for free products' },
        { status: 400 }
      );
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        tenant_id: userData.tenant_id,
        type: body.type,
        title: body.title,
        description: body.description,
        program_id: body.program_id,
        course_id: body.course_id,
        contains_courses: body.contains_courses,
        session_count: body.session_count,
        requires_signature: body.requires_signature,
        signature_template_id: body.signature_template_id,
        keap_tag: body.keap_tag,
        payment_model: body.payment_model,
        price: body.payment_model === 'free' ? null : body.price,
        currency: body.currency || 'USD',
        payment_plan: body.payment_plan,
        payment_start_date: body.payment_start_date || null,
        enrollment_invitation_template_key: body.enrollment_invitation_template_key,
        enrollment_confirmation_template_key: body.enrollment_confirmation_template_key,
        enrollment_reminder_template_key: body.enrollment_reminder_template_key,
        is_active: body.is_active ?? true,
        metadata: body.metadata,
      })
      .select(`
        *,
        program:programs!products_program_id_fkey(id, name, description, image_url),
        course:courses!products_course_id_fkey(id, title, description, image_url)
      `)
      .single();

    if (error) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Update program or course with product_id back-reference
    if (body.program_id) {
      await supabase
        .from('programs')
        .update({ product_id: product.id })
        .eq('id', body.program_id);
    }
    if (body.course_id) {
      await supabase
        .from('courses')
        .update({ product_id: product.id })
        .eq('id', body.course_id);
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
