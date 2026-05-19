import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

// GET /api/lms/courses/[id] - Get course details (student view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get course with instructor details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!courses_instructor_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in GET /api/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/lms/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant and role
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

    // Get request body
    const body = await request.json();

    // Update course
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (updateError || !course) {
      console.error('Error updating course:', updateError);
      return NextResponse.json({ error: 'Failed to update course' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in PATCH /api/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lms/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant and role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions (admin or super_admin only for deletions)
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if course is attached to any products
    const { data: relatedProducts, error: productsCheckError } = await supabase
      .from('products')
      .select('id, title')
      .eq('course_id', id)
      .eq('tenant_id', userData.tenant_id);

    if (productsCheckError) {
      console.error('Error checking related products:', productsCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check course dependencies'
      }, { status: 400 });
    }

    if (relatedProducts && relatedProducts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete course: it is attached to one or more products. Please remove the course from all products first.',
        error_he: 'לא ניתן למחוק את הקורס: הוא משויך למוצר אחד או יותר. נא להסיר את הקורס מכל המוצרים תחילה.',
        dependencies: {
          products: relatedProducts,
          programs: []
        }
      }, { status: 400 });
    }

    // Check if course is part of any programs
    const { data: relatedProgramCourses, error: programsCheckError } = await supabase
      .from('program_courses')
      .select('program_id, programs!inner(id, name)')
      .eq('course_id', id);

    if (programsCheckError) {
      console.error('Error checking related programs:', programsCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check course dependencies',
        error_he: 'שגיאה בבדיקת תלויות הקורס'
      }, { status: 400 });
    }

    const relatedPrograms = relatedProgramCourses?.map((pc: any) => pc.programs) || [];

    if (relatedPrograms.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete course: it is part of one or more programs. Please remove the course from all programs first.',
        error_he: 'לא ניתן למחוק את הקורס: הוא חלק מתוכנית אחת או יותר. נא להסיר את הקורס מכל התוכניות תחילה.',
        dependencies: {
          products: [],
          programs: relatedPrograms
        }
      }, { status: 400 });
    }

    // Delete course (cascading deletes will handle related records like lessons, materials, etc.)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete course'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/lms/courses/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
