import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch active theme configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: theme, error } = await supabase
      .from('theme_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Fetch theme error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // If no active theme, return default
    if (!theme) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active theme found',
      });
    }

    return NextResponse.json({
      success: true,
      data: theme,
    });
  } catch (error) {
    console.error('Get theme error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch theme' },
      { status: 500 }
    );
  }
}
