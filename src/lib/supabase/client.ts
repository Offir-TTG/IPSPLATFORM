import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Get context-aware storage
 * Wizard routes use sessionStorage (isolated), Admin uses localStorage (persistent)
 */
function getStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;

  const path = window.location.pathname;

  // Wizard and public enrollment routes use sessionStorage (browser-isolated)
  if (path.includes('/enroll/wizard/') || path.includes('/enroll/')) {
    console.log('[Storage] Using sessionStorage for wizard (browser-isolated)');
    return sessionStorage;
  }

  // Admin and other routes use localStorage (persistent)
  return localStorage;
}

/**
 * Set tenant context for the browser client
 * Call this after user authentication or when switching tenants
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  try {
    await supabase.rpc('set_current_tenant', { p_tenant_id: tenantId });
  } catch (error) {
    console.error('Error setting tenant context:', error);
    throw error;
  }
}

/**
 * Get tenant by slug (for initialization)
 */
export async function getTenantBySlug(slug: string): Promise<{ id: string; slug: string; name: string } | null> {
  const { data, error } = await supabase
    .rpc('get_tenant_by_slug', { p_slug: slug })
    .single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data as { id: string; slug: string; name: string } | null;
}

/**
 * Initialize tenant context from subdomain or localStorage
 * Call this in your app initialization (e.g., in a useEffect or context provider)
 */
export async function initializeTenantContext(): Promise<void> {
  // Skip if multitenancy is disabled
  if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED !== 'true') {
    const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'default';
    const tenant = await getTenantBySlug(defaultSlug);
    if (tenant?.id) {
      await setTenantContext(tenant.id);
    }
    return;
  }

  try {
    // Try to get tenant from subdomain
    const hostname = window.location.hostname;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'ipsplatform.com';

    // For localhost, use default tenant
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // Use context-aware storage (sessionStorage for wizard, localStorage for admin)
      const storage = getStorage();

      // Check if tenant is already set in storage
      const existingTenantId = storage.getItem('tenant_id');

      if (existingTenantId) {
        // Use existing tenant context - don't overwrite it
        console.log('[Supabase Client] Using existing tenant from storage:', existingTenantId);
        await setTenantContext(existingTenantId);
        return;
      }

      // No existing tenant - use default
      const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'default';
      const tenant = await getTenantBySlug(defaultSlug);
      if (tenant?.id) {
        await setTenantContext(tenant.id);
        // Store in context-aware storage
        storage.setItem('tenant_id', tenant.id);
        storage.setItem('tenant_slug', tenant.slug);
      }
      return;
    }

    // Extract subdomain
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];

      // Get tenant by slug
      const tenant = await getTenantBySlug(subdomain);
      if (tenant?.id) {
        await setTenantContext(tenant.id);
        // Store in context-aware storage
        const storage = getStorage();
        storage.setItem('tenant_id', tenant.id);
        storage.setItem('tenant_slug', tenant.slug);
        return;
      }
    }

    // Fallback: try to get from context-aware storage
    const storage = getStorage();
    const storedTenantId = storage.getItem('tenant_id');
    if (storedTenantId) {
      await setTenantContext(storedTenantId);
    }
  } catch (error) {
    console.error('Error initializing tenant context:', error);
  }
}