import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/help/articles/[slug]?locale=en
 *
 * Returns one article by slug + locale, plus the title/category of any
 * related articles (so the drawer can render a "See also" footer
 * without a second round-trip).
 *
 * Locale fallback: if the requested locale is missing, fall back to
 * 'en' so the user sees content rather than an empty drawer. This
 * matters during the rollout when not every article is translated yet.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
    const slug = params.slug;

    // Try requested locale first; fall back to 'en' if missing.
    let article = await fetchOne(supabase, slug, locale);
    let resolvedLocale = locale;
    if (!article && locale !== 'en') {
      article = await fetchOne(supabase, slug, 'en');
      resolvedLocale = 'en';
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Build a single set of all slugs referenced by this article so we
    // can fetch their titles in ONE query instead of three round-trips:
    //   • related_slugs (the "Related articles" footer, lateral links)
    //   • prerequisites (cards above the body — "what to do first")
    //   • next_steps    (cards below the body — "what to do next")
    const allRefSlugs = Array.from(
      new Set([
        ...(article.related_slugs ?? []),
        ...(article.prerequisites ?? []),
        ...(article.next_steps ?? []),
      ])
    );

    let refTitles: Record<string, { slug: string; title: string; category: string | null }> = {};
    if (allRefSlugs.length > 0) {
      const { data: refRows } = await supabase
        .from('help_articles')
        .select('slug, title, category')
        .in('slug', allRefSlugs)
        .eq('locale', resolvedLocale);
      for (const row of refRows ?? []) {
        refTitles[row.slug] = row;
      }
    }

    // Hydrate each list in the order the article specified, dropping any
    // slugs whose target doesn't exist for this locale.
    const hydrate = (slugs: string[] | null | undefined) =>
      (slugs ?? [])
        .map((s) => refTitles[s])
        .filter((row): row is { slug: string; title: string; category: string | null } => !!row);

    return NextResponse.json({
      success: true,
      data: {
        article: {
          slug: article.slug,
          title: article.title,
          body_markdown: article.body_markdown,
          category: article.category,
          updated_at: article.updated_at,
          locale: resolvedLocale,
          requested_locale: locale,
        },
        related:       hydrate(article.related_slugs),
        prerequisites: hydrate(article.prerequisites),
        next_steps:    hydrate(article.next_steps),
      },
    });
  } catch (error) {
    console.error('[Help API] Failed to fetch article:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load article',
      },
      { status: 500 }
    );
  }
}

async function fetchOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  locale: string,
) {
  const { data } = await supabase
    .from('help_articles')
    .select('slug, title, body_markdown, category, related_slugs, prerequisites, next_steps, updated_at')
    .eq('slug', slug)
    .eq('locale', locale)
    .maybeSingle();
  return data;
}
