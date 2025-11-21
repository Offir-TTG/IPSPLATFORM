import { NextRequest, NextResponse } from 'next/server';
import { getKeapClient } from '@/lib/keap/client';

// GET /api/admin/keap/tags - List all tags
export async function GET(request: NextRequest) {
  try {
    const keap = await getKeapClient();
    const tags = await keap.listTags();

    return NextResponse.json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    console.error('Error fetching Keap tags:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/keap/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, categoryId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const keap = await getKeapClient();
    const tag = await keap.createTag(name, description, categoryId);

    return NextResponse.json({
      success: true,
      data: tag,
      message: `Tag "${name}" created successfully`
    });
  } catch (error) {
    console.error('Error creating Keap tag:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag'
      },
      { status: 500 }
    );
  }
}
