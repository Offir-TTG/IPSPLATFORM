import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// MULTITENANCY MIDDLEWARE
// ============================================================================
// Detects tenant from subdomain and sets tenant context
// Runs before every request to validate tenant access
// ============================================================================

// Environment configuration
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'ipsplatform.com';
const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'default';
const MULTITENANCY_ENABLED = process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED === 'true';

// Reserved subdomains that should not be treated as tenants
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'dashboard', 'status', 'docs'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')  // Skip files with extensions (images, etc.)
  ) {
    return NextResponse.next();
  }

  // If multitenancy is not enabled, use default tenant
  if (!MULTITENANCY_ENABLED) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', DEFAULT_TENANT_SLUG);
    return response;
  }

  // Get hostname from request
  const hostname = request.headers.get('host') || '';

  // For local development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', DEFAULT_TENANT_SLUG);
    return response;
  }

  // Extract subdomain from hostname
  // Example: harvard.ipsplatform.com -> 'harvard'
  const parts = hostname.split('.');

  // Check if hostname matches main domain
  const isMainDomain = hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;

  if (isMainDomain || parts.length < 2) {
    // No subdomain, redirect to tenant selector
    return NextResponse.redirect(new URL('/select-tenant', request.url));
  }

  // Get subdomain (first part before main domain)
  const subdomain = parts[0];

  // Check if subdomain is reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return NextResponse.redirect(new URL('/select-tenant', request.url));
  }

  // The subdomain is the tenant slug
  const tenantSlug = subdomain;

  // Validate tenant exists (in production, you'd query Supabase here)
  // For now, we'll pass it through and let the API validate

  // Set tenant slug in headers for the application to use
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', tenantSlug);

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
