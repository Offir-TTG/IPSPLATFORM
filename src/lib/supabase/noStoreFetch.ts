/**
 * Database reads must never come from Next's data cache. Next 14 caches
 * server-side fetch() by default wherever a route doesn't opt out, which
 * served stale enrollments, plans and statuses (cached for a year). Every
 * Supabase client on the server passes this as `global.fetch`, so each
 * request goes out fresh.
 */
export const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });
