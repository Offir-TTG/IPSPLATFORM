import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dailyService } from '@/lib/daily/dailyService';

/**
 * Create a Daily.co room for a lesson
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId, customRoomName } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    // Get lesson with course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*, zoom_sessions(*), courses(title, tenant_id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if Daily.co room already exists
    if (lesson.zoom_sessions?.daily_room_name) {
      return NextResponse.json({
        message: 'Daily.co room already exists',
        roomName: lesson.zoom_sessions.daily_room_name,
        roomUrl: lesson.zoom_sessions.daily_room_url,
      });
    }

    // Generate room name from lesson data
    let roomName = '';

    // If custom room name is provided, use it (with sanitization)
    if (customRoomName && customRoomName.trim()) {
      // Sanitize custom room name: lowercase, replace spaces with hyphens, remove special chars
      roomName = customRoomName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50); // Limit length

      // Add unique suffix to ensure uniqueness
      roomName = `${roomName}-${lessonId.substring(0, 6)}`;

      console.log('[Daily.co] Using custom room name:', roomName);
    } else {
      // Auto-generate room name from course/lesson data
      const courseName = lesson.courses?.title || 'course';
      const lessonTitle = lesson.title || 'lesson';

    // Format date and time if available
    let dateTimeStr = '';
    if (lesson.start_time) {
      try {
        const startDate = new Date(lesson.start_time);

        // Format: YYYY-MM-DD-HHmm (e.g., 2025-12-22-1830)
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const minutes = String(startDate.getMinutes()).padStart(2, '0');

        dateTimeStr = `${year}-${month}-${day}-${hours}${minutes}`;
      } catch (e) {
        console.error('[Daily.co] Error formatting date/time:', e);
      }
    }

    // Build room name: course-lesson-datetime
    // For non-Latin names, use a hash-based approach
    const createSlug = (text: string): string => {
      // First try to keep alphanumeric (works for Latin text)
      let slug = text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // If slug is empty (non-Latin characters), create a hash
      if (!slug || slug.length < 3) {
        const hash = Buffer.from(text).toString('base64')
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase()
          .substring(0, 8);
        slug = hash;
      }

      // Limit length to keep room name reasonable
      return slug.substring(0, 30);
    };

      roomName = [
        courseName ? createSlug(courseName) : '',
        lessonTitle ? createSlug(lessonTitle) : '',
        dateTimeStr
      ]
        .filter(Boolean) // Remove empty strings
        .join('-')
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      // Add unique suffix to ensure uniqueness (shorter to keep name readable)
      roomName = `${roomName}-${lessonId.substring(0, 6)}`;

      console.log('[Daily.co] Auto-generated room name:', roomName);
    }

    console.log('[Daily.co] Creating room:', roomName);

    // Get integration settings for expiry hours
    const { data: integration } = await supabase
      .from('integrations')
      .select('settings')
      .eq('integration_key', 'daily')
      .single();

    const defaultExpiryHours = integration?.settings?.default_expiry_hours || (24 * 180); // Default: 6 months

    // Create Daily.co room
    const room = await dailyService.createRoom(roomName, {
      privacy: 'private',
      expiresInHours: defaultExpiryHours,
      enableRecording: false, // Set to false by default (cloud recording requires paid plan)
    });

    console.log('[Daily.co] Room created:', room.url);

    // Get tenant_id from the lesson's course
    const tenantId = lesson.courses?.tenant_id;

    if (!tenantId) {
      throw new Error('Could not determine tenant_id for lesson');
    }

    // If zoom_sessions record doesn't exist, create it
    if (!lesson.zoom_sessions) {
      const { error: insertError } = await supabase
        .from('zoom_sessions')
        .insert({
          tenant_id: tenantId,
          lesson_id: lessonId,
          daily_room_name: room.name,
          daily_room_url: room.url,
          daily_room_id: room.id,
          platform: 'daily',
        });

      if (insertError) {
        console.error('[Daily.co] Failed to save room to database:', insertError);
        // Try to cleanup the room
        await dailyService.deleteRoom(room.name).catch(console.error);
        throw insertError;
      }
    } else {
      // Update existing zoom_sessions record
      const { error: updateError } = await supabase
        .from('zoom_sessions')
        .update({
          daily_room_name: room.name,
          daily_room_url: room.url,
          daily_room_id: room.id,
          platform: 'daily',
        })
        .eq('id', lesson.zoom_sessions.id);

      if (updateError) {
        console.error('[Daily.co] Failed to update room in database:', updateError);
        // Try to cleanup the room
        await dailyService.deleteRoom(room.name).catch(console.error);
        throw updateError;
      }
    }

    return NextResponse.json({
      success: true,
      roomName: room.name,
      roomUrl: room.url,
      roomId: room.id,
    });

  } catch (error) {
    console.error('[Daily.co] Error creating room:', error);
    return NextResponse.json(
      {
        error: 'Failed to create Daily.co room',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
