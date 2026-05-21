import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/help/articles?locale=en[&search=...]
 *
 * Two modes:
 *  • Without `search`: returns the full article index for the given locale,
 *    grouped client-side by category, sorted by display_order. Used by the
 *    drawer's "Browse all topics" view.
 *
 *  • With `search`: calls the Postgres `search_help_articles` RPC, which
 *    blends full-text rank + title trigram similarity + prefix match.
 *    Returns up to 15 ranked results, each with a `snippet` containing
 *    <mark>…</mark> highlights of the matched terms.
 *
 * Snippets are server-trusted: help articles are admin-curated content,
 * not user-submitted, so the small amount of HTML in the snippet (only
 * <mark> tags, produced by ts_headline) is safe to render via
 * dangerouslySetInnerHTML.
 *
 * Auth: any authenticated user. The help_articles table has RLS allowing
 * SELECT to authenticated users.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') === 'he' ? 'he' : 'en';
    const search = searchParams.get('search')?.trim() || null;

    // -----------------------------------------------------------------
    // Search mode: ranked, with highlighted snippets
    // -----------------------------------------------------------------
    if (search && search.length >= 2) {
      const { data, error } = await supabase.rpc('search_help_articles', {
        q: search,
        loc: locale,
        result_limit: 15,
      });
      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: {
          articles: data ?? [],
          locale,
          mode: 'search',
          query: search,
        },
      });
    }

    // -----------------------------------------------------------------
    // Index mode: all articles, grouped client-side
    // -----------------------------------------------------------------
    const { data, error } = await supabase
      .from('help_articles')
      .select('slug, title, category, display_order, page_slugs, updated_at')
      .eq('locale', locale)
      .order('category', { ascending: true, nullsFirst: false })
      .order('display_order', { ascending: true });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        articles: data ?? [],
        locale,
        mode: 'index',
      },
    });
  } catch (error) {
    console.error('[Help API] Failed to list articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load help',
      },
      { status: 500 }
    );
  }
}
