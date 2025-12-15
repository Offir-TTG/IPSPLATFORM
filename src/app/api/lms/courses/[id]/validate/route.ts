import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { start_date, end_date } = await request.json();
    const courseId = params.id;

    const warnings: Array<{
      type: 'warning' | 'error';
      message: string;
      details?: any;
    }> = [];

    // 1. Check lessons against course dates
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        scheduled_at,
        duration_minutes,
        modules!inner (
          course_id
        )
      `)
      .eq('modules.course_id', courseId);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
    }

    if (lessons && lessons.length > 0) {
      const courseStart = new Date(start_date);
      const courseEnd = end_date ? new Date(end_date) : null;

      const lessonsOutsideRange = lessons.filter((lesson) => {
        if (!lesson.scheduled_at) return false;
        const lessonDate = new Date(lesson.scheduled_at);

        if (lessonDate < courseStart) return true;
        if (courseEnd && lessonDate > courseEnd) return true;

        return false;
      });

      if (lessonsOutsideRange.length > 0) {
        warnings.push({
          type: 'warning',
          message: 'lms.courses.validation.lessons_outside_range',
          details: {
            count: lessonsOutsideRange.length,
            lessons: lessonsOutsideRange.map(l => ({
              id: l.id,
              title: l.title,
              scheduled_at: l.scheduled_at
            })),
            courseStart: start_date,
            courseEnd: end_date
          }
        });
      }

      // Warn if no end date
      if (!end_date) {
        warnings.push({
          type: 'warning',
          message: 'lms.courses.validation.no_end_date',
        });
      }

      // 2. Check for lesson time overlaps
      const scheduledLessons = lessons.filter(l => l.scheduled_at);
      for (let i = 0; i < scheduledLessons.length; i++) {
        for (let j = i + 1; j < scheduledLessons.length; j++) {
          const lesson1 = scheduledLessons[i];
          const lesson2 = scheduledLessons[j];

          const start1 = new Date(lesson1.scheduled_at!);
          const end1 = new Date(start1.getTime() + (lesson1.duration_minutes || 60) * 60000);

          const start2 = new Date(lesson2.scheduled_at!);
          const end2 = new Date(start2.getTime() + (lesson2.duration_minutes || 60) * 60000);

          // Check if they overlap
          if (start1 < end2 && start2 < end1) {
            warnings.push({
              type: 'error',
              message: 'lms.courses.validation.lesson_overlap',
              details: {
                lesson1: lesson1.title,
                lesson2: lesson2.title,
                time: lesson1.scheduled_at
              }
            });
          }
        }
      }
    }

    // 3. Check for course overlaps in the same program
    // Get course program_id
    const { data: course } = await supabase
      .from('courses')
      .select('program_id')
      .eq('id', courseId)
      .single();

    if (course?.program_id) {
      const { data: otherCourses } = await supabase
        .from('courses')
        .select('id, title, start_date, end_date')
        .eq('program_id', course.program_id)
        .neq('id', courseId);

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
