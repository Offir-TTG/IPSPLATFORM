import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checks = {
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      supabase: {
        canConnect: false,
        tablesExist: false,
        error: null as string | null,
      },
    };

    // Test Supabase connection
    if (checks.env.hasSupabaseUrl && checks.env.hasAnonKey) {
      try {
        const supabase = await createClient();

        // Try to query the users table
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        if (error) {
          checks.supabase.error = error.message;
        } else {
          checks.supabase.canConnect = true;
          checks.supabase.tablesExist = true;
        }
      } catch (err) {
        checks.supabase.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      status: 'ok',
      checks,
      message: checks.supabase.tablesExist
        ? 'All systems operational!'
        : 'Configuration incomplete. Check the issues below.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
