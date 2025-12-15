import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { start_date, end_date, program_id } = await request.json();

    const warnings: Array<{
      type: 'warning' | 'error';
      message: string;
      details?: any;
    }> = [];

    // Warn if no end date
    if (!end_date) {
      warnings.push({
        type: 'warning',
        message: 'lms.courses.validation.no_end_date',
      });
    }

    // Check for course overlaps in the same program
    if (program_id) {
      const { data: otherCourses } = await supabase
        .from('courses')
        .select('id, title, start_date, end_date')
        .eq('program_id', program_id);

      if (otherCourses && otherCourses.length > 0) {
        const courseStart = new Date(start_date);
        const courseEnd = end_date ? new Date(end_date) : null;

        const overlappingCourses = otherCourses.filter((other) => {
          const otherStart = new Date(other.start_date);
          const otherEnd = other.end_date ? new Date(other.end_date) : null;

          // If either course has no end date, check if starts overlap
          if (!courseEnd || !otherEnd) {
            return courseStart <= otherStart || otherStart <= courseStart;
          }

          // Check if date ranges overlap
          return courseStart < otherEnd && otherStart < courseEnd;
        });

        if (overlappingCourses.length > 0) {
          warnings.push({
            type: 'warning',
            message: 'lms.courses.validation.course_overlap',
            details: {
              courses: overlappingCourses.map(c => c.title).join(', ')
            }
          });
        }
      }
    }

    // Determine if save should be blocked (only if there are errors, not warnings)
    const hasErrors = warnings.some(w => w.type === 'error');

    return NextResponse.json({
      success: true,
      data: {
        valid: warnings.length === 0,
        canSave: !hasErrors,
        warnings,
      },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate course dates',
      },
      { status: 500 }
    );
  }
}
