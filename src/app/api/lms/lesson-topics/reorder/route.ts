import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// PATCH /api/lms/lesson-topics/reorder
// Bulk update topic order after drag-drop
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
    const { lesson_id, topics } = body;

    // Validate required fields
    if (!lesson_id || !topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { success: false, error: 'lesson_id and topics array are required' },
        { status: 400 }
      );
    }

    // Verify all topics belong to the specified lesson
    const topicIds = topics.map(t => t.id);
    const { data: existingTopics, error: verifyError } = await supabase
      .from('lesson_topics')
      .select('id, lesson_id')
      .in('id', topicIds);

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: verifyError.message },
        { status: 400 }
      );
    }

    // Check that all topics belong to the same lesson
    const invalidTopics = existingTopics?.filter(t => t.lesson_id !== lesson_id);
    if (invalidTopics && invalidTopics.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Some topics do not belong to the specified lesson' },
        { status: 400 }
      );
    }

    // Update order for each topic
    // To avoid unique constraint violations during reordering,
    // we use a two-phase approach:
    // 1. Set all orders to temporary negative values
    // 2. Then update to final positive values

    // Phase 1: Set temporary negative orders
    const tempUpdatePromises = topics.map(({ id }, index) =>
      supabase
        .from('lesson_topics')
        .update({ order: -(index + 1000) }) // Use negative offset to avoid conflicts
        .eq('id', id)
    );

    const tempResults = await Promise.all(tempUpdatePromises);
    const tempErrors = tempResults.filter(r => r.error);
    if (tempErrors.length > 0) {
      console.error('Errors setting temporary orders:', tempErrors);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder topics (phase 1)' },
        { status: 400 }
      );
    }

    // Phase 2: Set final orders
    const finalUpdatePromises = topics.map(({ id, order }) =>
      supabase
        .from('lesson_topics')
        .update({ order })
        .eq('id', id)
    );

    const finalResults = await Promise.all(finalUpdatePromises);
    const finalErrors = finalResults.filter(r => r.error);
    if (finalErrors.length > 0) {
      console.error('Errors setting final orders:', finalErrors);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder topics (phase 2)' },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'lesson_topics',
      resource_id: lesson_id,
      action: 'Reordered lesson topics',
      description: `Reordered ${topics.length} topics in lesson`,
      new_values: { topics },
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      message: 'Topics reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering lesson topics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
