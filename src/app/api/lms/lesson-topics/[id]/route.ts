import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteCourseMaterial } from '@/lib/supabase/materialStorage';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// GET /api/lms/lesson-topics/[id]
// Get a single topic by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('lesson_topics')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching lesson topic:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/lesson-topics/[id]
// Update a topic
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get old values for audit
    const { data: oldTopic } = await supabase
      .from('lesson_topics')
      .select('*')
      .eq('id', params.id)
      .single();

    // Get request body
    const body = await request.json();

    // Update topic
    const { data, error } = await supabase
      .from('lesson_topics')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Topic update failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'lesson_topics',
      resource_id: params.id,
      action: 'Updated lesson topic',
      description: `Topic: ${data.title}`,
      old_values: oldTopic,
      new_values: data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Topic updated successfully',
    });
  } catch (error) {
    console.error('Error updating lesson topic:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/lms/lesson-topics/[id]
// Delete a topic
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get topic details for audit and file cleanup
    const { data: topic } = await supabase
      .from('lesson_topics')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Delete associated files from storage if PDF or download type
    if (topic.content_type === 'pdf' || topic.content_type === 'download') {
      try {
        const fileUrl = topic.content?.file_url;
        if (fileUrl) {
          // Extract file path from URL
          const urlParts = fileUrl.split('/');
          const bucketIndex = urlParts.findIndex((part: string) => part === 'course-materials');
          if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
            const filePath = urlParts.slice(bucketIndex + 1).join('/');
            await deleteCourseMaterial(filePath);
          }
        }
      } catch (fileError) {
        console.error('Error deleting topic file:', fileError);
        // Continue with topic deletion even if file deletion fails
      }
    }

    // Delete topic from database
    const { error } = await supabase
      .from('lesson_topics')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Topic deletion failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Reorder remaining topics in the lesson
    if (topic.lesson_id) {
      const { data: remainingTopics } = await supabase
        .from('lesson_topics')
        .select('id, order')
        .eq('lesson_id', topic.lesson_id)
        .gt('order', topic.order)
        .order('order', { ascending: true });

      if (remainingTopics && remainingTopics.length > 0) {
        for (const t of remainingTopics) {
          await supabase
            .from('lesson_topics')
            .update({ order: t.order - 1 })
            .eq('id', t.id);
        }
      }
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'DELETE',
      event_category: 'EDUCATION',
      resource_type: 'lesson_topics',
      resource_id: params.id,
      action: 'Deleted lesson topic',
      description: `Topic: ${topic.title} (${topic.content_type})`,
      old_values: topic,
      risk_level: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lesson topic:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
