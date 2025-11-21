import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/chat/conversations
 * Get all conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's conversations using the database function
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create a new conversation for a program or course
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, programId, courseId, tenantId } = body;

    // Validate input
    if (!name || !tenantId) {
      return NextResponse.json(
        { error: 'Name and tenant ID are required' },
        { status: 400 }
      );
    }

    if (!programId && !courseId) {
      return NextResponse.json(
        { error: 'Either program ID or course ID is required' },
        { status: 400 }
      );
    }

    if (programId && courseId) {
      return NextResponse.json(
        { error: 'Cannot specify both program ID and course ID' },
        { status: 400 }
      );
    }

    // Create conversation
    const { data: conversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        name,
        description,
        program_id: programId || null,
        course_id: courseId || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    // Add creator as admin participant
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'admin',
      });

    if (participantError) {
      console.error('Error adding participant:', participantError);
      // Rollback conversation creation
      await supabase.from('conversations').delete().eq('id', conversation.id);
      return NextResponse.json(
        { error: 'Failed to add participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
