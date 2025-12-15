import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// GET /api/lms/lesson-topics?lesson_id=xxx
// Get all topics for a lesson
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get lesson_id from query params
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'lesson_id is required' },
        { status: 400 }
      );
    }

    // Fetch topics ordered by order field
    const { data, error } = await supabase
      .from('lesson_topics')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching lesson topics:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error in GET /api/lms/lesson-topics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/lms/lesson-topics
// Create a new topic
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      lesson_id,
      title,
      content_type,
      content,
      order,
      duration_minutes,
      is_required,
    } = body;

    // Validate required fields
    if (!lesson_id || !title || !content_type) {
      return NextResponse.json(
        { success: false, error: 'lesson_id, title, and content_type are required' },
        { status: 400 }
      );
    }

    // Validate content_type
    const validContentTypes = ['video', 'text', 'pdf', 'quiz', 'assignment', 'link', 'embed', 'download', 'whiteboard'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid content_type. Must be one of: ${validContentTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // If order not provided, get next order number
    let topicOrder = order;
    if (topicOrder === undefined || topicOrder === null) {
      const { data: existingTopics } = await supabase
        .from('lesson_topics')
        .select('order')
        .eq('lesson_id', lesson_id)
        .order('order', { ascending: false })
        .limit(1);

      topicOrder = existingTopics && existingTopics.length > 0
        ? existingTopics[0].order + 1
        : 0;
    }

    // Insert new topic
    const insertData = {
      tenant_id: userData.tenant_id,
      lesson_id,
      title,
      content_type,
      content: content || {},
      order: topicOrder,
      duration_minutes: duration_minutes || null,
      is_required: is_required !== undefined ? is_required : false,
    };

    console.log('[DEBUG] Inserting topic with data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('lesson_topics')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson topic:', error);
      console.error('[DEBUG] Insert data was:', insertData);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'lesson_topics',
      resource_id: data.id,
      action: 'Created lesson topic',
      description: `Topic: ${data.title} (${data.content_type})`,
      new_values: data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Topic created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/lms/lesson-topics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
