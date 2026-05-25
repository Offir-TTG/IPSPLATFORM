import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/messages
// Returns conversations the user is currently in, with a snippet of the
// most recent message and the user's unread_count. Read-only — admin
// cannot send DMs from this view.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch the user's participant rows + the joined conversation metadata.
    const { data: parts, error } = await adminClient
      .from('conversation_participants')
      .select(`
        id,
        unread_count,
        last_read_at,
        joined_at,
        left_at,
        conversation:conversations (
          id, name, last_message_at, program_id, course_id, is_active
        )
      `)
      .eq('user_id', params.id)
      .is('left_at', null)
      .order('joined_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('conversation_participants query failed:', error);
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    const conversationIds = (parts ?? [])
      .map((p: any) => p.conversation?.id)
      .filter(Boolean);

    // Fetch the most recent message per conversation in one round-trip,
    // then dedupe client-side (PostgREST has no DISTINCT ON convenience).
    let lastMsgByConvId = new Map<string, { content: string; created_at: string }>();
    if (conversationIds.length > 0) {
      const { data: msgs } = await adminClient
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })
        .limit(conversationIds.length * 10); // generous over-fetch

      for (const m of msgs ?? []) {
        if (!lastMsgByConvId.has((m as any).conversation_id)) {
          lastMsgByConvId.set((m as any).conversation_id, {
            content: (m as any).content,
            created_at: (m as any).created_at,
          });
        }
      }
    }

    const conversations = (parts ?? []).map((p: any) => {
      const c = p.conversation;
      const last = c ? lastMsgByConvId.get(c.id) : null;
      return {
        conversation_id: c?.id,
        name: c?.name ?? '',
        unread_count: p.unread_count ?? 0,
        last_message_snippet: last?.content?.slice(0, 140) ?? null,
        last_message_at: last?.created_at ?? c?.last_message_at ?? null,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/messages:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
