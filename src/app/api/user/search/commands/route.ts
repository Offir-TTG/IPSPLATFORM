import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiter, RATE_LIMITS } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Command patterns for natural language detection (English + Hebrew)
const COMMAND_PATTERNS = {
  my_courses: /^(הקורסים\s+שלי|my\s+courses?|show\s+courses?|list\s+courses?|my\s+classes?|קורסים|courses?)$/i,
  upcoming_lessons: /^(שיעורים\s+קרובים|upcoming\s+lessons?|next\s+lessons?|future\s+lessons?|שיעורים|lessons?)$/i,
  recent_files: /^(קבצים\s+אחרונים|recent\s+files?|latest\s+files?|new\s+files?|קבצים|files?)$/i,
  my_assignments: /^(המטלות\s+שלי|my\s+assignments?|pending\s+assignments?|my\s+homework|מטלות|assignments?)$/i,
  recent_recordings: /^(הקלטות\s+אחרונות|הקלטות|recent\s+recordings?|recordings?|recorded\s+lessons?|הקלטת?\s+שיעורים?)$/i,
};

function detectCommand(query: string): string | null {
  const normalized = query.trim().toLowerCase();

  console.log('[Command Detection] Query:', query);
  console.log('[Command Detection] Normalized:', normalized);

  for (const [command, pattern] of Object.entries(COMMAND_PATTERNS)) {
    const matches = pattern.test(normalized);
    console.log(`[Command Detection] Testing ${command}:`, matches, 'Pattern:', pattern);
    if (matches) {
      console.log(`[Command Detection] Matched command: ${command}`);
      return command;
    }
  }

  console.log('[Command Detection] No command matched');
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: prevent command spam
    const rateLimitResult = await rateLimiter.limit(
      `chatbot_command:${user.id}`,
      RATE_LIMITS.CHATBOT_COMMAND.limit,
      RATE_LIMITS.CHATBOT_COMMAND.windowMs
    );

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: resetIn },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Detect command
    const command = detectCommand(query);

    if (!command) {
      return NextResponse.json({
        success: false,
        message: 'Command not recognized'
      });
    }

    // Use the RPC function for quick commands
    const { data: rawResults, error } = await supabase
      .rpc('get_user_quick_data', {
        p_user_id: user.id,
        p_command: command
      });

    if (error) {
      console.error('Command RPC error:', error);
      return NextResponse.json({ error: 'Command failed', details: error.message }, { status: 500 });
    }

    // Parse the JSONB result
    const results = rawResults || [];

    return NextResponse.json({
      success: true,
      command,
      query,
      results: Array.isArray(results) ? results : [],
    });
  } catch (error) {
    console.error('Command API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
