/**
 * The client role. On screen it is "Client" / "לקוח" and covers parents and
 * students alike (everyone reaches what they enrolled in).
 *
 * The stored value is moving from 'student' to 'client'. Until every row has
 * moved (supabase/migrations/20261123_role_student_to_client.sql), both
 * values mean the same role, so every check must accept either: use
 * isClientRole() or CLIENT_ROLES, never `role === 'student'`.
 */
export const CLIENT_ROLES = ['client', 'student'] as const;
export type ClientRole = (typeof CLIENT_ROLES)[number];

/**
 * The value new accounts get. The migration above has run (2026-11-24): the
 * database accepts 'client' and every former 'student' row moved.
 */
export const NEW_CLIENT_ROLE = 'client' as const;

export function isClientRole(role: string | null | undefined): boolean {
  return role === 'client' || role === 'student';
}

/** A role list for permission checks: if it lets clients in, both values pass. */
export function withClientAlias<T extends string>(roles: readonly T[]): T[] {
  const out = [...roles] as string[];
  if (out.some(isClientRole)) for (const r of CLIENT_ROLES) if (!out.includes(r)) out.push(r);
  return out as T[];
}
