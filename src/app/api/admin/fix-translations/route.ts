import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fix 1: Update translation_keys context
    const { error: keysError } = await supabase
      .from('translation_keys')
      .update({ context: 'admin' })
      .like('key', 'admin.audit.%');

    if (keysError) {
      console.error('Error updating translation_keys:', keysError);
      return NextResponse.json({ error: keysError.message }, { status: 500 });
    }

    // Fix 2: Update translations context
    const { error: translationsError } = await supabase
      .from('translations')
      .update({ context: 'admin' })
      .like('translation_key', 'admin.audit.%');

    if (translationsError) {
      console.error('Error updating translations:', translationsError);
      return NextResponse.json({ error: translationsError.message }, { status: 500 });
    }

    // Fix 3: Clear translation cache
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/translations`, {
      method: 'POST',
    });

    return NextResponse.json({
      success: true,
      message: 'Translations context fixed and cache cleared',
    });
  } catch (error) {
    console.error('Fix translations error:', error);
    return NextResponse.json(
      { error: 'Failed to fix translations' },
      { status: 500 }
    );
  }
}
