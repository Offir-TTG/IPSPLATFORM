// ============================================================================
// MULTITENANCY: TENANT DETECTION
// ============================================================================
// Functions for detecting and retrieving tenant information
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import type { Tenant } from './types';

/**
 * Get tenant slug from request headers (set by middleware)
 */
export function getTenantSlugFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant-slug');
}

/**
 * Get tenant by slug from database
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_tenant_by_slug', { p_slug: slug })
      .single();

    if (error) {
      console.error('Error fetching tenant by slug:', error);
      return null;
    }

    return data as Tenant;
  } catch (error) {
    console.error('Error in getTenantBySlug:', error);
    return null;
  }
}

/**
 * Get tenant by custom domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_tenant_by_domain', { p_domain: domain })
      .maybeSingle();

    if (error) {
      console.error('Error fetching tenant by domain:', error);
      return null;
    }

    if (!data) {
      console.log(`No tenant found for domain: ${domain}`);
      return null;
    }

    return data as Tenant;
  } catch (error) {
    console.error('Error in getTenantByDomain:', error);
    return null;
  }
}

/**
 * Extract tenant slug from URL path
 * Supports path-based routing: /org/{slug}/...
 */
export function getTenantSlugFromPath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/^\/org\/([a-z0-9][a-z0-9-]{1,61}[a-z0-9])/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get current tenant from request
 * Priority:
 * 1. Path-based routing (/org/{slug}) - for localhost testing
 * 2. Custom domain
 * 3. Subdomain from headers
 * 4. Default tenant (localhost fallback)
 */
export async function getCurrentTenant(request: Request): Promise<Tenant | null> {
  const headers = new Headers(request.headers);
  const hostname = headers.get('host') || '';
  const url = request.url;
  const defaultTenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'default';

  // For local development with path-based routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Check for path-based tenant: /org/{slug}/...
    const pathSlug = getTenantSlugFromPath(url);
    if (pathSlug) {
      const tenant = await getTenantBySlug(pathSlug);
      if (tenant) {
        return tenant;
      }
    }

    // Fall back to default tenant for localhost
    return getTenantBySlug(defaultTenantSlug);
  }

  // Production: Try custom domain first
  let tenant = await getTenantByDomain(hostname);
  if (tenant) {
    return tenant;
  }

  // Fall back to subdomain from middleware
  const tenantSlug = getTenantSlugFromHeaders(headers);
  if (tenantSlug) {
    tenant = await getTenantBySlug(tenantSlug);
    if (tenant) {
      return tenant;
    }
  }

  // Final fallback: use default tenant (for Vercel deployments without custom domain)
  console.log('No tenant found via domain/subdomain, falling back to default tenant:', defaultTenantSlug);
  return getTenantBySlug(defaultTenantSlug);
}

/**
 * Validate that a user belongs to a tenant
 */
export async function validateUserTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('user_belongs_to_tenant', {
        p_user_id: userId,
        p_tenant_id: tenantId,
      });

    if (error) {
      console.error('Error validating tenant access:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in validateUserTenantAccess:', error);
    return false;
  }
}

/**
 * Get user's role in a tenant
 */
export async function getUserTenantRole(
  userId: string,
  tenantId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_user_tenant_role', {
        p_user_id: userId,
        p_tenant_id: tenantId,
      });

    if (error) {
      console.error('Error fetching user tenant role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserTenantRole:', error);
    return null;
  }
}

/**
 * Get all tenants a user belongs to
 */
export async function getUserTenants(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_user_tenants', { p_user_id: userId });

    if (error) {
      console.error('Error fetching user tenants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserTenants:', error);
    return [];
  }
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('is_super_admin', { p_user_id: userId });

    if (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isSuperAdmin:', error);
    return false;
  }
}
