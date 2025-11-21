import { NextRequest, NextResponse } from 'next/server';
import { getZoomClient } from '@/lib/zoom/client';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

/**
 * GET /api/admin/integrations/zoom/meetings/[id] - Get meeting details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const zoomClient = await getZoomClient();
    const meeting = await zoomClient.getMeeting(params.id);

    return NextResponse.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error(`Error getting Zoom meeting ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get meeting'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/integrations/zoom/meetings/[id] - Update meeting
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { topic, start_time, duration, timezone, password, agenda, settings } = body;

    const zoomClient = await getZoomClient();

    await zoomClient.updateMeeting(params.id, {
      topic,
      type: 2, // scheduled meeting
      start_time,
      duration,
      timezone,
      password,
      agenda,
      settings
    });

    // Get updated meeting details
    const meeting = await zoomClient.getMeeting(params.id);

    return NextResponse.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting
    });

  } catch (error) {
    console.error(`Error updating Zoom meeting ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update meeting'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/integrations/zoom/meetings/[id] - Delete meeting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const zoomClient = await getZoomClient();
    await zoomClient.deleteMeeting(params.id);

    return NextResponse.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error(`Error deleting Zoom meeting ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete meeting'
      },
      { status: 500 }
    );
  }
}
