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

    // Create cache key including context
    const cacheKey = `${languageCode}:${context}`;

    // Check cache first
    const cached = translationsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        context,
      });
    }

    const supabase = await createClient();

    // Build query based on context
    let query = supabase
      .from('translations')
      .select('translation_key, translation_value, context')
      .eq('language_code', languageCode);

    // Filter by context
    if (context === 'admin') {
      // Admin gets both admin-specific and common translations
      query = query.in('context', ['admin', 'both']);
    } else if (context === 'user') {
      // Users get both user-specific and common translations
      query = query.in('context', ['user', 'both']);
    }
    // If context is 'both', get everything

    const { data: translations, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

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
