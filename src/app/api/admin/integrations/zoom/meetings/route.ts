import { NextRequest, NextResponse } from 'next/server';
import { getZoomClient } from '@/lib/zoom/client';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

/**
 * GET /api/admin/integrations/zoom/meetings - List all meetings
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'scheduled' | 'live' | 'upcoming' || 'upcoming';

    const zoomClient = await getZoomClient();
    const meetings = await zoomClient.listMeetings(type);

    return NextResponse.json({
      success: true,
      meetings,
      count: meetings.length
    });

  } catch (error) {
    console.error('Error listing Zoom meetings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list meetings'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/zoom/meetings - Create a new meeting
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      topic,
      type = 2, // 2 = scheduled meeting
      start_time,
      duration = 60,
      timezone = 'UTC',
      password,
      agenda,
      settings
    } = body;

    // Validate required fields
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Meeting topic is required' },
        { status: 400 }
      );
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration must be at least 1 minute' },
        { status: 400 }
      );
    }

    // Validate start_time for scheduled meetings
    if (type === 2 && !start_time) {
      return NextResponse.json(
        { success: false, error: 'Start time is required for scheduled meetings' },
        { status: 400 }
      );
    }

    const zoomClient = await getZoomClient();

    const meeting = await zoomClient.createMeeting({
      topic,
      type,
      start_time,
      duration,
      timezone,
      password,
      agenda,
      settings
    });

    return NextResponse.json({
      success: true,
      meeting
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create meeting'
      },
      { status: 500 }
    );
  }
}
