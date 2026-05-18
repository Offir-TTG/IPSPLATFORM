import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { verifyPersonToken } from '@/lib/persons/signed-token';
import { getOrCreatePerson } from '@/lib/persons/get-or-create-client';
import {
  emitPersonEnrolled,
  emitPersonEnrollmentPending,
} from '@/lib/persons/outbox';

export const dynamic = 'force-dynamic';

type SourcePayload = {
  type: 'course' | 'program' | 'lecture';
  id: string;
  slug: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      locale,
      country,
      // The Register CTA on IParentingSchool may include a signed
      // token carrying the existing person_id (when the visitor was
      // already known to the CRM) and a `source` describing which
      // content item they clicked. Either / both can be absent.
      person_token,
      source,
    } = (await request.json()) as {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      locale?: string;
      country?: string;
      person_token?: string;
      source?: SourcePayload;
    };

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          phone,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Use admin client to bypass RLS for user creation
    const supabaseAdmin = createAdminClient();

    // ─── Resolve person_id (cross-platform identity) ────────────────
    // Two paths:
    //   (1) Signed token from the IParentingSchool Register CTA carries
    //       an existing person_id — use it directly, no remote call.
    //   (2) No token (Register-direct from anonymous visitor) — call
    //       IParentingSchool's get-or-create to mint/resolve, passing
    //       the seed payload so the new crm_contacts row is populated.
    //       If unreachable, leave person_id=NULL and queue a
    //       person.enrollment_pending event for IParentingSchool to
    //       resolve when it returns.
    let personId: string | null = null;
    let personResolutionFailed = false;
    const tokenClaims = verifyPersonToken(person_token);
    if (tokenClaims && tokenClaims.email.toLowerCase() === email.toLowerCase()) {
      personId = tokenClaims.person_id;
    } else {
      const outcome = await getOrCreatePerson({
        email,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        phone: phone || null,
        locale: locale || null,
        country: country || null,
        source: source
          ? { type: source.type, id: source.id, slug: source.slug }
          : null,
      });
      if (outcome.ok) {
        personId = outcome.person_id;
      } else {
        personResolutionFailed = true;
        console.warn(
          '[signup] get-or-create unreachable — will queue enrollment_pending:',
          outcome.reason,
        );
      }
    }

    // Create user profile with tenant_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'student',
        first_name,
        last_name,
        phone: phone || null,
        tenant_id: tenant.id,
        person_id: personId,
      })
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);

      // Rollback: delete auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error deleting user during rollback:', deleteError);
      }

      return NextResponse.json(
        { success: false, error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    // Add user to tenant_users table
    const { error: tenantUserError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        role: 'student',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (tenantUserError) {
      console.error('Tenant user creation error:', tenantUserError);
      // Continue anyway - user was created, just not added to tenant_users
      // This can be fixed manually by admin if needed
    }

    // ─── Cross-platform notify ───────────────────────────────────────
    // Tell IParentingSchool that this person has registered. If we
    // couldn't resolve a person_id at signup time (IParentingSchool
    // unreachable), queue an enrollment_pending event carrying the
    // full seed — the drainer will deliver it when IParentingSchool
    // returns, and IParentingSchool will reply with person.linked so
    // we can stamp users.person_id retroactively.
    const nowIso = new Date().toISOString();
    if (personId) {
      await emitPersonEnrolled(supabaseAdmin, {
        personId,
        userId: authData.user.id,
        enrolledAt: nowIso,
        sourceType: source?.type ?? null,
        sourceId: source?.id ?? null,
      });
    } else if (personResolutionFailed) {
      await emitPersonEnrollmentPending(supabaseAdmin, {
        userId: authData.user.id,
        email,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        phone: phone || null,
        locale: locale || null,
        country: country || null,
        source: source
          ? { type: source.type, id: source.id, slug: source.slug }
          : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: authData.session,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: 'student',
        },
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
