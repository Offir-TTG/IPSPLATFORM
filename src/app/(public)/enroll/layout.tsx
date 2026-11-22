import { PortalFrame } from '@/components/user/portal/PortalFrame';

/**
 * Enrollment (invitation, wizard, payment). A parent who already has an
 * account and is signed in goes through the same wizard inside the portal;
 * someone new sees it on its own, as before. The wizard itself is unchanged.
 */
export default async function EnrollLayout({ children }: { children: React.ReactNode }) {
  // Staff open these links too (to check an invitation), so don't send them to the admin.
  const framed = await PortalFrame({ children, staffRedirect: false });
  return framed ?? <>{children}</>;
}
