import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type UserRole = 'admin' | 'instructor' | 'student';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenant_id?: string;
}

type RouteHandler = (
  request: NextRequest,
  user: AuthUser,
  params?: any
) => Promise<Response>;

export function withAuth(
  handler: RouteHandler,
  allowedRoles: UserRole[] = ['admin']
) {
  return async (request: NextRequest, params?: any) => {
    try {
      const supabase = await createClient();

      // Get the user from the session
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Identity is already verified by `auth.getUser()` (it validates the
      // JWT against Supabase Auth). The `public.users` table has stricter
      // RLS than just `auth.uid() = id` — it relies on a tenant-context
      // GUC that's set by the browser but not by API routes, so reading
      // the authenticated user's *own* row with the cookie client returns
      // 0 rows and would surface as a misleading 404 across every endpoint
      // wrapped by `withAuth`. Use the admin client for this single
      // narrowly-scoped read of `id = user.id`.
      const admin = createAdminClient();
      const { data: userData, error: userError } = await admin
        .from('users')
        .select('id, email, role, tenant_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user has the required role
      if (!allowedRoles.includes(userData.role as UserRole)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Call the actual handler with the authenticated user
      return handler(request, userData as AuthUser, params);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}