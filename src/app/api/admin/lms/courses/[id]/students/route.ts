import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

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

    // Reads with the server key (identity and role checked above): the users
    // table refuses the signed-in read from API routes, which dropped every
    // client's name and left the list empty.
    const admin = createAdminClient();

    // Verify course exists (in this school)
    const { data: course, error: courseError } = await admin
      .from('courses')
      .select('id, program_id, tenant_id')
      .eq('id', params.id)
      .maybeSingle();

    if (courseError || !course || course.tenant_id !== userData.tenant_id) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // The programs this course is in: its program list entries, and its own program.
    const { data: programs, error: programsError } = await admin
      .from('program_courses')
      .select('program_id')
      .eq('course_id', params.id);
    if (programsError) console.error('Error fetching programs:', programsError);
    const programIds = [...new Set([...(programs ?? []).map((p: any) => p.program_id), course.program_id].filter(Boolean))] as string[];

    // Products that open this course: the course itself, a bundle with it, or one of those programs.
    const { data: products, error: productsError } = await admin
      .from('products')
      .select('id, course_id, program_id, contains_courses')
      .eq('tenant_id', userData.tenant_id);
    if (productsError) {
      console.error('Error fetching course products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch course products' }, { status: 500 });
    }
    const productIds = (products ?? [])
      .filter(
        (p: any) =>
          p.course_id === params.id ||
          (Array.isArray(p.contains_courses) && p.contains_courses.includes(params.id)) ||
          (p.program_id && programIds.includes(p.program_id)),
      )
      .map((p: any) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Clients enrolled through those products (not the paying-parent records).
    const { data: enrollments, error: enrollmentsError } = await admin
      .from('enrollments')
      .select(`
        user_id,
        is_parent,
        users!enrollments_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('product_id', productIds)
      .eq('tenant_id', userData.tenant_id)
      .in('status', ['active', 'completed'])
      .neq('is_parent', true);

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
