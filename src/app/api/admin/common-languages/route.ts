import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all common languages for reference
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch common languages, popular ones first
    const { data: languages, error } = await supabase
      .from('common_languages')
      .select('*')
      .order('is_popular', { ascending: false })
      .order('name');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error('Get common languages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch common languages' },
      { status: 500 }
    );
  }
}
