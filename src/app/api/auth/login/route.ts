import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant, validateUserTenantAccess, getUserTenantRole } from '@/lib/tenant/detection';
import { canUserLogIn } from '@/lib/users/communication-eligible';

export async function POST(request: NextRequest) {
  let response = NextResponse.next();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with cookie management for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    // Reads of the just-authenticated user's own profile/tenant rows use
    // the service-role client. RLS on `public.users` (and `tenants`) is
    // stricter than just `auth.uid() = id` — it relies on a session GUC
    // the browser sets but this server-side route can't replicate, which
    // made the user's own SELECTs return 0 rows and surfaced as
    // "User profile not found" right after a successful password reset.
    // We've already verified the identity via `signInWithPassword`, so
    // reading `authData.user.id`'s row with the admin client is safe.
    const admin = createAdminClient();

    // Get current tenant from URL (for org-based routes)
    let tenant = await getCurrentTenant(request);

    // If no tenant found from URL (e.g., /login instead of /org/slug/login),
    // try to find tenant from user's profile
    if (!tenant) {
      const { data: userData } = await admin
        .from('users')
        .select('tenant_id')
        .eq('id', authData.user.id)
        .single();

      if (userData?.tenant_id) {
        const { data: tenantData } = await admin
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single();

        if (tenantData) {
          tenant = tenantData;
        }
      }
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Check if tenant email is verified (for self-service signups)
    if (tenant.creation_method === 'self_service' && !tenant.email_verified) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          requiresVerification: true,
          email: tenant.admin_email
        },
        { status: 403 }
      );
    }

    // Account-status gate FIRST. The legacy `validateUserTenantAccess`
    // hides a `status = 'active'` filter inside its RPC, so without
    // this preflight a suspended user would see the misleading
    // "no access to this organization" message instead of the real
    // reason (their account is suspended). Run the status check
    // scoped to THIS tenant so the message is correct even when the
    // user belongs to multiple orgs with different statuses.
    const loginCheck = await canUserLogIn(admin, authData.user.id, tenant.id);
    if (!loginCheck.ok) {
      await supabase.auth.signOut();

      // Map each reason to a user-facing message. Distinct codes so
      // the client can deep-link to a recovery surface ("contact
      // support" vs "open your invitation email").
      const messages: Record<typeof loginCheck.reason, { msg: string; code: string; status: number }> = {
        suspended: {
          msg: 'Your account has been suspended. Contact your administrator to restore access.',
          code: 'account_suspended',
          status: 403,
        },
        inactive: {
          msg: 'Your account is inactive. Contact your administrator to reactivate it.',
          code: 'account_inactive',
          status: 403,
        },
        invited: {
          msg: 'Please complete your invitation before signing in. Check your email for the invitation link.',
          code: 'account_invited',
          status: 403,
        },
        not_found: {
          // User authenticated against Supabase but has no
          // tenant_users row for this tenant — they're truly not a
          // member. Surface the original "no access" message.
          msg: 'You do not have access to this organization.',
          code: 'no_tenant_access',
          status: 403,
        },
        unknown: {
          msg: 'Unable to verify account status. Please try again.',
          code: 'status_check_failed',
          status: 500,
        },
      };
      const m = messages[loginCheck.reason];
      return NextResponse.json(
        { success: false, error: m.msg, code: m.code },
        { status: m.status },
      );
    }

    // Belt-and-suspenders: the status gate above covers the same
    // ground as validateUserTenantAccess (which also checks
    // status='active' via its RPC) — but keep this here for cases
    // where the RPC's logic diverges from ours (e.g. role-based
    // gates added later).
    const hasAccess = await validateUserTenantAccess(authData.user.id, tenant.id);
    if (!hasAccess) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'You do not have access to this organization.', code: 'no_tenant_access' },
        { status: 403 }
      );
    }

    // Get user's role in this tenant
    const tenantRole = await getUserTenantRole(authData.user.id, tenant.id);

    // Get user profile data — same reasoning as above: identity already
    // verified by `signInWithPassword`, so read with the admin client to
    // bypass the tenant-context RLS that this server route can't satisfy.
    const { data: userData, error: userError} = await admin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create response with user data
    // The cookies are already set by the signInWithPassword call via the cookie callbacks
    response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: authData.session,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: tenantRole,
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
