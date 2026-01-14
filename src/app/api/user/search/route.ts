import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimiter, RATE_LIMITS } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: prevent search spam
    const rateLimitResult = await rateLimiter.limit(
      `chatbot_search:${user.id}`,
      RATE_LIMITS.CHATBOT_SEARCH.limit,
      RATE_LIMITS.CHATBOT_SEARCH.windowMs
    );

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please wait before searching again',
          retryAfter: resetIn
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.CHATBOT_SEARCH.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50 results

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    // Use the RPC function for full-text search
    const { data: results, error } = await supabase
      .rpc('search_user_content', {
        p_user_id: user.id,
        p_query: query,
        p_limit: limit
      });

    if (error) {
      console.error('Search RPC error:', error);
      return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
    }

    // Group results by type
    const groupedResults = {
      courses: (results || []).filter((r: any) => r.result_type === 'course'),
      lessons: (results || []).filter((r: any) => r.result_type === 'lesson'),
      files: (results || []).filter((r: any) => r.result_type === 'file'),
      announcements: (results || []).filter((r: any) => r.result_type === 'announcement'),
    };

    return NextResponse.json(
      {
        success: true,
        query,
        total: results?.length || 0,
        results: groupedResults,
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.CHATBOT_SEARCH.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
