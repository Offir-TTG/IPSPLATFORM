import { NextRequest, NextResponse } from 'next/server';
import { getKeapClient } from '@/lib/keap/client';

// POST /api/admin/keap/contacts/:id/tags - Add tag to contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tag_id } = body;
    const contactId = parseInt(params.id);

    if (!tag_id) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();
    await keap.addTagToContact(contactId, tag_id);

    return NextResponse.json({
      success: true,
      message: 'Tag added to contact successfully'
    });
  } catch (error) {
    console.error('Error adding tag to contact:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add tag'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/keap/contacts/:id/tags/:tagId - Remove tag from contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    const contactId = parseInt(params.id);

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();
    await keap.removeTagFromContact(contactId, parseInt(tagId));

    return NextResponse.json({
      success: true,
      message: 'Tag removed from contact successfully'
    });
  } catch (error) {
    console.error('Error removing tag from contact:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove tag'
      },
      { status: 500 }
    );
  }
}
