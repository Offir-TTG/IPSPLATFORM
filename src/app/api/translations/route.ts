import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// In-memory cache for translations
const translationsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET all translations for a specific language (with caching)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get('language') || 'he';
    const context = searchParams.get('context') || 'user'; // 'admin', 'user', or 'both'

    const supabase = await createClient();

    // Get tenant_id from authenticated user
    let tenantId: string | null = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log('[Translations API] Auth error:', authError);
      }

      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.log('[Translations API] User lookup error:', userError);
        }

        tenantId = userData?.tenant_id || null;
        console.log('[Translations API] User tenant_id:', tenantId);
      } else {
        console.log('[Translations API] No user found in session');
      }
    } catch (error) {
      console.log('[Translations API] Unexpected error getting user:', error);
    }

    // Create cache key including context and tenant_id
    const cacheKey = `${tenantId || 'global'}:${languageCode}:${context}`;

    // TEMPORARILY DISABLED: Check cache first
    // const cached = translationsCache.get(cacheKey);
    // if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    //   return NextResponse.json({
    //     success: true,
    //     data: cached.data,
    //     cached: true,
    //     context,
    //   });
    // }
    console.log('[Translations API] CACHE DISABLED - Fetching fresh from DB');

    // Build query based on context
    let query = supabase
      .from('translations')
      .select('translation_key, translation_value, context, tenant_id')
      .eq('language_code', languageCode);

    // Filter by tenant_id (include tenant-specific OR global translations)
    // For now, get translations for specific tenant OR global (null tenant_id)
    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }
    // If no tenant, get ALL translations (don't filter by tenant_id at all)
    // This ensures translations work even without authentication

    // Filter by context
    if (context === 'admin') {
      // Admin gets both admin-specific and common translations
      query = query.in('context', ['admin', 'both']);
    } else if (context === 'user') {
      // Users get both user-specific and common translations
      query = query.in('context', ['user', 'both']);
    }
    // If context is 'both', get everything

    // CRITICAL FIX: Fetch ALL translations by making multiple paginated requests
    // PostgREST has a 1000-row default limit, so we need to paginate
    const allTranslations: Array<{translation_key: string; translation_value: string; context: string; tenant_id: string | null}> = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      const { data: pageData, error } = await query.range(start, end);

      if (error) {
        console.error('[Translations API] Query error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      if (pageData && pageData.length > 0) {
        allTranslations.push(...pageData);
        hasMore = pageData.length === pageSize; // Continue if we got a full page
        page++;
      } else {
        hasMore = false;
      }

      // Safety limit to prevent infinite loops
      if (page > 20) break; // Max 20,000 rows
    }

    const translations = allTranslations;

    console.log(`[Translations API] Fetched ${translations?.length || 0} translations for language=${languageCode}, context=${context}, tenant_id=${tenantId}`);

    // Count Keap translations for debugging
    const keapCount = translations?.filter(t => t.translation_key.includes('keap')).length || 0;
    console.log(`[Translations API] Keap translations in result: ${keapCount}`);

    // Convert array to object for easier lookup
    const translationsMap: Record<string, string> = {};
    translations?.forEach((t) => {
      translationsMap[t.translation_key] = t.translation_value;
    });

    // Update cache
    translationsCache.set(cacheKey, {
      data: translationsMap,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      data: translationsMap,
      cached: false,
      context,
    });
  } catch (error) {
    console.error('Get translations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

// POST - Invalidate cache (called after translations are updated)
export async function POST() {
  try {
    translationsCache.clear();
    return NextResponse.json({
      success: true,
      message: 'Translation cache cleared',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
