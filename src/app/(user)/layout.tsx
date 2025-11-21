import { UserLayout } from '@/components/user/UserLayout';

/**
 * User Portal Layout
 *
 * NOTE: Authentication is handled client-side via the UserLayout component
 * and protected by middleware. We don't check auth here to avoid cookie
 * sync issues between API routes and server components in Next.js 14.
 */
export default function UserPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout>
      {children}
    </UserLayout>
  );
}
