import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dailyService } from '@/lib/daily/dailyService';

/**
 * Generate Daily.co meeting token with automatic role assignment
 *
 * This endpoint:
 * 1. Verifies user authentication
 * 2. Checks if user is instructor or student for the lesson
 * 3. Automatically assigns owner/participant role
 * 4. Returns token with embedded role permissions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    // Get lesson with course and Daily.co session info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        course:courses (
          id,
          title,
          instructor_id
        ),
        zoom_sessions (
          id,
          daily_room_name,
          daily_room_url,
          platform
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('[Daily.co Token] Lesson query error:', lessonError);
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Handle zoom_sessions being either an array or a single object
    const zoomSession = Array.isArray(lesson.zoom_sessions)
      ? lesson.zoom_sessions[0]
      : lesson.zoom_sessions;

    // Check if Daily.co room exists
    if (!zoomSession?.daily_room_name || zoomSession?.platform !== 'daily') {
      return NextResponse.json(
        { error: 'No Daily.co room configured for this lesson' },
        { status: 400 }
      );
    }

    // 🔑 AUTOMATIC ROLE ASSIGNMENT
    // Check if user is the instructor for this course
    const isInstructor = lesson.course?.instructor_id === user.id;

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const userName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : user.email?.split('@')[0] || 'Anonymous';

    // Generate token with automatic role assignment
    const tokenData = await dailyService.createMeetingToken(
      zoomSession.daily_room_name,
      {
        isOwner: isInstructor, // ✅ Instructors automatically become owners
        userName,
        userId: user.id,
        expiresInHours: 4,
        enableRecording: isInstructor, // Only instructors can record
        startCloudRecording: false, // Don't auto-start (instructor can manually start)
      }
    );

    return NextResponse.json({
      token: tokenData.token,
      roomUrl: zoomSession.daily_room_url,
      roomName: zoomSession.daily_room_name,
      isOwner: isInstructor,
      userName,
    });

  } catch (error) {
    console.error('[Daily.co Token] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate meeting token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
