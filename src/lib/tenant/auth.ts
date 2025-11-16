import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from './detection';

/**
 * Verify that the current user is authenticated and is an admin/owner in the current tenant
 * @param request - The Next.js request object
 * @returns Object with user, tenant, and tenant user role, or null if unauthorized
 */
export async function verifyTenantAdmin(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return null;
    }

    // Check if user is admin/owner in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, status')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || tenantUser.status !== 'active') {
      return null;
    }

    if (!['owner', 'admin'].includes(tenantUser.role)) {
      return null;
    }

    return {
      user,
      tenant,
      tenantRole: tenantUser.role,
    };
  } catch (error) {
    console.error('Error verifying tenant admin:', error);
    return null;
  }
}

/**
 * Verify that the current user is authenticated and belongs to the current tenant
 * @param request - The Next.js request object
 * @returns Object with user, tenant, and tenant user role, or null if unauthorized
 */
export async function verifyTenantMember(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return null;
    }

    // Check if user belongs to this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, status')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || tenantUser.status !== 'active') {
      return null;
    }

    return {
      user,
      tenant,
      tenantRole: tenantUser.role,
    };
  } catch (error) {
    console.error('Error verifying tenant member:', error);
    return null;
  }
}

/**
 * Check if the current user is a super admin
 * @returns boolean indicating if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data } = await supabase.rpc('is_super_admin', { p_user_id: user.id });
    return data === true;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}
