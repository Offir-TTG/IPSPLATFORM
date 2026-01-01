import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/admin/programs/[id]/bridge
// DEPRECATED: Program-level bridge links are no longer supported
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Program-level bridge links are deprecated',
      message: 'Instructor bridge links are now created at the course level. Please navigate to individual courses to create bridge links for instructors.',
      migration_guide: 'Each course can have its own instructor, so bridge links are now managed per course instead of per program.',
    },
    { status: 410 } // 410 Gone - Resource no longer available
  );
}

// ============================================================================
// GET /api/admin/programs/[id]/bridge
// DEPRECATED: Program-level bridge links are no longer supported
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Program-level bridge links are deprecated',
      message: 'Instructor bridge links are now managed at the course level. Please check individual courses for their bridge links.',
      migration_guide: 'Navigate to each course within this program to view or create bridge links for the course instructors.',
    },
    { status: 410 } // 410 Gone - Resource no longer available
  );
}
