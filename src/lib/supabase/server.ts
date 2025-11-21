import { cookies, headers } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Regular authenticated client (subject to RLS)
export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Set tenant context if multitenancy is enabled
  if (process.env.NEXT_PUBLIC_MULTITENANCY_ENABLED === 'true') {
    try {
      const headersList = await headers();
      const tenantSlug = headersList.get('x-tenant-slug');

      if (tenantSlug) {
        // Get tenant ID from slug
        const { data: tenant } = await client
          .rpc('get_tenant_by_slug', { p_slug: tenantSlug })
          .single();

        const typedTenant = tenant as { id: string; slug: string; name: string } | null;
        if (typedTenant?.id) {
          // Set current tenant in database session
          await client.rpc('set_current_tenant', { p_tenant_id: typedTenant.id });
        }
      }
    } catch (error) {
      console.error('Error setting tenant context:', error);
      // Don't fail the request, just log the error
    }
  }

  return client;
}

// Admin client with service role (bypasses RLS)
// Use this for admin operations that need to bypass RLS policies
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'ips-platform-admin',
          'Prefer': 'return=representation'
        }
      }
    }
  );
}