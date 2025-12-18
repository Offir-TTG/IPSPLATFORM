import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses/[id]/grade-categories - Get grade categories for a course
export const GET = withAuth(
  async (_request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const supabase = await createClient();
      const { id: courseId } = await context.params;

      // Get user's tenant
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const tenantId = userData.tenant_id;

      // Verify course exists and belongs to tenant
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('tenant_id', tenantId)
        .single();

      if (courseError || !course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Get grade categories for this course
      const { data: categories, error: categoriesError } = await supabase
        .from('grade_categories')
        .select('*')
        .eq('course_id', courseId)
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching grade categories:', categoriesError);
        return NextResponse.json({ error: 'Failed to fetch grade categories' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: categories || [],
      });
    } catch (error) {
      console.error('Error in GET /api/user/courses/[id]/grade-categories:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  ['student', 'instructor']
);
