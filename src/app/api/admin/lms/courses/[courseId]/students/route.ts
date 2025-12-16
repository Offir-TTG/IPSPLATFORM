import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/lms/courses/[courseId]/students - List all students enrolled in a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions (admin, super_admin, or instructor)
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', params.courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get products that reference this course
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // If no products reference this course, return empty list
    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const productIds = products.map(p => p.id);

    // Get all students enrolled in these products
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        user_id,
        users!enrollments_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('product_id', productIds)
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'active');

    if (enrollmentsError) {
      console.error('Error fetching students:', enrollmentsError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Transform the data to extract user info
    const students = enrollments?.map(enrollment => ({
      id: enrollment.users.id,
      full_name: `${enrollment.users.first_name || ''} ${enrollment.users.last_name || ''}`.trim(),
      email: enrollment.users.email,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name)) || [];

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[courseId]/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
