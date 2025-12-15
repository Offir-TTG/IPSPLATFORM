import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// PATCH /api/lms/lessons/reorder
// Bulk update lesson order after drag-drop
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { module_id, lessons } = body;

    // Validate required fields
    if (!module_id || !lessons || !Array.isArray(lessons)) {
      return NextResponse.json(
        { success: false, error: 'module_id and lessons array are required' },
        { status: 400 }
      );
    }

    // Verify all lessons belong to the specified module
    const lessonIds = lessons.map(l => l.id);
    const { data: existingLessons, error: verifyError } = await supabase
      .from('lessons')
      .select('id, module_id')
      .in('id', lessonIds);

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: verifyError.message },
        { status: 400 }
      );
    }

    // Check that all lessons belong to the same module
    const invalidLessons = existingLessons?.filter(l => l.module_id !== module_id);
    if (invalidLessons && invalidLessons.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Some lessons do not belong to the specified module' },
        { status: 400 }
      );
    }

    // Update order for each lesson
    // To avoid unique constraint violations during reordering,
    // we use a two-phase approach:
    // 1. Set all orders to temporary negative values
    // 2. Then update to final positive values

    // Phase 1: Set temporary negative orders
    const tempUpdatePromises = lessons.map(({ id }, index) =>
      supabase
        .from('lessons')
        .update({ order: -(index + 1000) }) // Use negative offset to avoid conflicts
        .eq('id', id)
    );

    const tempResults = await Promise.all(tempUpdatePromises);
    const tempErrors = tempResults.filter(r => r.error);
    if (tempErrors.length > 0) {
      console.error('Errors setting temporary orders:', tempErrors);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder lessons (phase 1)' },
        { status: 400 }
      );
    }

    // Phase 2: Set final orders
    const finalUpdatePromises = lessons.map(({ id, order }) =>
      supabase
        .from('lessons')
        .update({ order })
        .eq('id', id)
    );

    const finalResults = await Promise.all(finalUpdatePromises);
    const finalErrors = finalResults.filter(r => r.error);
    if (finalErrors.length > 0) {
      console.error('Errors setting final orders:', finalErrors);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder lessons (phase 2)' },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'lessons',
      resource_id: module_id,
      action: 'Reordered lessons',
      description: `Reordered ${lessons.length} lessons in module`,
      new_values: { lessons },
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      message: 'Lessons reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
