import { NextRequest, NextResponse } from 'next/server';
import { bridgeService } from '@/lib/lms/bridgeService.server';

/**
 * GET /api/bridge/[slug]
 * Get redirect URL for instructor bridge link
 * Returns the Zoom start URL for the current/upcoming lesson
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // Get current lesson for this bridge
    const result = await bridgeService.getCurrentLessonForBridge(slug);

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        message: result.error || 'No active session right now',
        next_lesson: result.nextLesson || null,
      });
    }

    const lesson = result.data;

    return NextResponse.json({
      success: true,
      redirect_url: lesson.zoom_start_url,
      lesson_id: lesson.lesson_id,
      lesson_title: lesson.lesson_title,
      is_current: lesson.is_current,
      is_upcoming: lesson.is_upcoming,
      minutes_until_start: lesson.minutes_until_start,
    });
  } catch (error) {
    console.error('Error in bridge route:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
