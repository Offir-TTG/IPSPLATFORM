import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/check-email
 *
 * Check if an email address is already registered
 * Used during enrollment to prevent duplicate accounts
 * NO AUTHENTICATION REQUIRED - uses admin client to bypass RLS
 *
 * Request Body:
 * - email: string
 *
 * Response:
 * - exists: boolean
 * - user_id?: string (if exists)
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS - this is called by unauthenticated users
    const supabase = createAdminClient();

    // Check if email exists in users table
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return NextResponse.json(
        { error: 'Failed to check email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!existingUser,
      user_id: existingUser?.id
    });

  } catch (error: any) {
    console.error('Error in check-email endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
