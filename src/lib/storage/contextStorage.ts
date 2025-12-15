/**
 * Context-aware storage helper
 *
 * This module provides storage that automatically chooses between localStorage and sessionStorage
 * based on the current route context to prevent cross-browser interference.
 *
 * PROBLEM:
 * - localStorage is shared across ALL tabs/browsers on the same domain
 * - When wizard opens in Edge, it overwrites tenant_id, breaking admin in Chrome
 *
 * SOLUTION:
 * - Admin routes: Use localStorage (persistent, user wants to stay logged in)
 * - Wizard routes: Use sessionStorage (isolated per tab, doesn't interfere)
 */

type StorageContext = 'admin' | 'wizard' | 'user';

/**
 * Detect storage context from current URL path
 */
export function getStorageContext(): StorageContext {
  if (typeof window === 'undefined') return 'admin'; // SSR fallback

  const path = window.location.pathname;

  // Wizard routes - use sessionStorage (browser-isolated)
  if (path.includes('/enroll/wizard/')) {
    return 'wizard';
  }

  // Public enrollment routes - use sessionStorage
  if (path.includes('/enroll/')) {
    return 'wizard';
  }

  // Admin routes - use localStorage (persistent)
  if (path.includes('/admin/')) {
    return 'admin';
  }

  // User routes - use localStorage (persistent)
  return 'user';
}

/**
 * Get the appropriate storage for the current context
 */
export function getContextStorage(): Storage {
  const context = getStorageContext();

  if (context === 'wizard') {
    // Wizard uses sessionStorage - isolated per tab/browser
    console.log('[ContextStorage] Using sessionStorage for wizard (browser-isolated)');
    return sessionStorage;
  }

  // Admin and user routes use localStorage - persistent
  return localStorage;
}

/**
 * Set item in context-aware storage
 */
export function setStorageItem(key: string, value: string): void {
  const storage = getContextStorage();
  storage.setItem(key, value);
}

/**
 * Get item from context-aware storage
 */
export function getStorageItem(key: string): string | null {
  const storage = getContextStorage();
  return storage.getItem(key);
}

/**
 * Remove item from context-aware storage
 */
export function removeStorageItem(key: string): void {
  const storage = getContextStorage();
  storage.removeItem(key);
}

/**
 * Get tenant context from appropriate storage
 */
export function getTenantFromStorage(): {
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_name: string | null;
  tenant_role: string | null;
} {
  const storage = getContextStorage();

  return {
    tenant_id: storage.getItem('tenant_id'),
    tenant_slug: storage.getItem('tenant_slug'),
    tenant_name: storage.getItem('tenant_name'),
    tenant_role: storage.getItem('tenant_role'),
  };
}

/**
 * Set tenant context in appropriate storage
 */
export function setTenantInStorage(tenant: {
  id: string;
  slug: string;
  name?: string;
  role?: string;
}): void {
  const storage = getContextStorage();

  storage.setItem('tenant_id', tenant.id);
  storage.setItem('tenant_slug', tenant.slug);

  if (tenant.name) {
    storage.setItem('tenant_name', tenant.name);
  }

  if (tenant.role) {
    storage.setItem('tenant_role', tenant.role);
  }
}

/**
 * Clear tenant context from appropriate storage
 */
export function clearTenantFromStorage(): void {
  const storage = getContextStorage();

  storage.removeItem('tenant_id');
  storage.removeItem('tenant_slug');
  storage.removeItem('tenant_name');
  storage.removeItem('tenant_role');
}
