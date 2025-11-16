import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

      // Get user details with role
      const { data: userData, error: userError } = await supabase
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