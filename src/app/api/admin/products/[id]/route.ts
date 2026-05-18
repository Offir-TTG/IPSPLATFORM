import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductFormData } from '@/types/product';

export const dynamic = 'force-dynamic';

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        program:programs!products_program_id_fkey(id, name, description, image_url),
        course:courses!products_course_id_fkey(id, title, description, image_url)
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: ProductFormData = await request.json();
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        type: body.type,
        title: body.title,
        description: body.description,
        program_id: body.program_id,
        course_id: body.course_id,
        contains_courses: body.contains_courses,
        session_count: body.session_count,
        requires_signature: body.requires_signature,
        signature_template_id: body.signature_template_id,
        completion_benefit: body.completion_benefit,
        completion_description: body.completion_description,
        access_duration: body.access_duration,
        access_description: body.access_description,
        keap_tag: body.keap_tag,
        crm_tag_slugs: Array.isArray(body.crm_tag_slugs) ? body.crm_tag_slugs : [],
        payment_model: body.payment_model,
        price: body.payment_model === 'free' ? null : body.price,
        currency: body.currency || 'USD',
        payment_plan: body.payment_plan,
        payment_start_date: body.payment_start_date || null,
        default_payment_plan_id: body.default_payment_plan_id || null,
        alternative_payment_plan_ids: body.alternative_payment_plan_ids || [],
        enrollment_invitation_template_key: body.enrollment_invitation_template_key,
        enrollment_confirmation_template_key: body.enrollment_confirmation_template_key,
        enrollment_reminder_template_key: body.enrollment_reminder_template_key,
        is_active: body.is_active ?? true,
        metadata: body.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 1: Check for active enrollments (pending or active status)
    const { data: activeEnrollments } = await supabase
      .from('enrollments')
      .select('id, status, user:users!enrollments_user_id_fkey(id, first_name, last_name, email)')
      .eq('product_id', params.id)
      .in('status', ['pending', 'active']);

    // If there are active enrollments, prevent deletion
    if (activeEnrollments && activeEnrollments.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete product: it has ${activeEnrollments.length} active enrollment(s). Please cancel all active enrollments first.`,
        error_he: `לא ניתן למחוק את המוצר: יש לו ${activeEnrollments.length} רישומים פעילים. נא לבטל את כל הרישומים הפעילים תחילה.`,
        dependencies: {
          enrollments: activeEnrollments
        }
      }, { status: 400 });
    }

    // Step 2: Delete cancelled/completed enrollments (since product_id is NOT NULL, we can't just clear it)
    const { data: deletedEnrollments, error: deleteEnrollmentsError } = await supabase
      .from('enrollments')
      .delete()
      .eq('product_id', params.id)
      .in('status', ['cancelled', 'completed'])
      .select();

    console.log('Delete enrollments result:', { deletedEnrollments, deleteEnrollmentsError });

    if (deleteEnrollmentsError) {
      console.error('Error deleting cancelled/completed enrollments:', deleteEnrollmentsError);
      return NextResponse.json({
        success: false,
        error: `Failed to delete cancelled/completed enrollments: ${deleteEnrollmentsError.message}`,
        error_he: `שגיאה במחיקת רישומים מבוטלים/שהושלמו: ${deleteEnrollmentsError.message}`
      }, { status: 500 });
    }

    console.log(`Deleted ${deletedEnrollments?.length || 0} cancelled/completed enrollments`);

    // Step 3: Now try to delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Delete product error:', deleteError);
      return NextResponse.json({
        success: false,
        error: deleteError.message,
        error_he: 'שגיאה במחיקת המוצר'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
