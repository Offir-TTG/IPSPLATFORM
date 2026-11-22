/** The tabs of the user drawer, in order. Kept in the address as ?tab=. */
export const USER_TABS = [
  'overview',
  'profile',
  'activity',
  'enrollments',
  'payments',
  'attendance',
  'grades',
  'notifications',
  'emails',
  'messages',
  'access',
] as const;
export type UserTabKey = (typeof USER_TABS)[number];

export function isUserTab(value: string | null | undefined): value is UserTabKey {
  return !!value && (USER_TABS as readonly string[]).includes(value);
}
