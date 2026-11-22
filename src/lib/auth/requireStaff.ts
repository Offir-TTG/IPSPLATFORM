import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const STAFF_ROLES = ['admin', 'super_admin', 'instructor'];

/**
 * Stops students from changing course content. Returns a response to send
 * back when the signed-in user isn't staff, or null to carry on.
 *
 *   const denied = await requireStaff();
 *   if (denied) return denied;
 */
export async function requireStaff(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
