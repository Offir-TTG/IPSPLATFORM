import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/lms/courses/[id]/students - List all students enrolled in a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      .eq('id', params.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get products that reference this course directly (standalone course)
    const { data: courseProducts, error: courseProductsError } = await supabase
      .from('products')
      .select('id')
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id);

    if (courseProductsError) {
      console.error('Error fetching course products:', courseProductsError);
      return NextResponse.json({ error: 'Failed to fetch course products' }, { status: 500 });
    }

    // Get programs that contain this course
    const { data: programs, error: programsError } = await supabase
      .from('program_courses')
      .select('program_id')
      .eq('course_id', params.id);

    if (programsError) {
      console.error('Error fetching programs:', programsError);
    }

    const programIds = programs?.map(p => p.program_id) || [];

    // Get products for those programs
    let programProducts: any[] = [];
    if (programIds.length > 0) {
      const { data, error: programProductsError } = await supabase
        .from('products')
        .select('id')
        .in('program_id', programIds)
        .eq('tenant_id', userData.tenant_id);

      if (programProductsError) {
        console.error('Error fetching program products:', programProductsError);
      } else {
        programProducts = data || [];
      }
    }

    // Combine all product IDs
    const allProducts = [...(courseProducts || []), ...programProducts];

    // If no products reference this course, return empty list
    if (allProducts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const productIds = allProducts.map(p => p.id);

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

    // Transform the data to extract user info and remove duplicates
    const uniqueStudents = new Map();

    enrollments?.forEach(enrollment => {
      // Handle both single object and array responses from Supabase
      const user = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;

      if (user && !uniqueStudents.has(user.id)) {
        uniqueStudents.set(user.id, {
          id: user.id,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
        });
      }
    });

    const students = Array.from(uniqueStudents.values())
      .sort((a, b) => a.full_name.localeCompare(b.full_name));

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[id]/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
