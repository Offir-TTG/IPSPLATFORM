import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Public API endpoint to check if a tenant slug is available
 * Used during self-service signup for real-time validation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'Slug must be 3-63 characters, lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.',
      });
    }

    // Reserved slugs that cannot be used
    const reservedSlugs = [
      'admin',
      'superadmin',
      'api',
      'auth',
      'login',
      'signup',
      'logout',
      'dashboard',
      'settings',
      'profile',
      'help',
      'support',
      'about',
      'contact',
      'terms',
      'privacy',
      'billing',
      'pricing',
      'features',
      'docs',
      'blog',
      'www',
      'app',
      'platform',
      'system',
      'default',
    ];

    if (reservedSlugs.includes(slug.toLowerCase())) {
      return NextResponse.json({
        success: true,
        available: false,
        message: 'This slug is reserved and cannot be used.',
      });
    }

    const supabase = await createClient();

    // Check if slug exists using RPC function
    const { data: isAvailable, error } = await supabase.rpc('is_slug_available', {
      p_slug: slug,
    });

    if (error) {
      console.error('Error checking slug availability:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to check slug availability' },
        { status: 500 }
      );
    }

    if (isAvailable) {
      return NextResponse.json({
        success: true,
        available: true,
        message: 'This slug is available!',
      });
    } else {
      // Generate suggestions
      const suggestions = [];
      for (let i = 1; i <= 3; i++) {
        const suggestion = `${slug}-${i}`;
        const { data: suggestionAvailable } = await supabase.rpc('is_slug_available', {
          p_slug: suggestion,
        });
        if (suggestionAvailable) {
          suggestions.push(suggestion);
        }
      }

      return NextResponse.json({
        success: true,
        available: false,
        message: 'This slug is already taken.',
        suggestions,
      });
    }
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while checking slug availability',
      },
      { status: 500 }
    );
  }
}
