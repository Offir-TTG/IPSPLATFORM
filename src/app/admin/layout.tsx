import { HelpProvider } from '@/context/HelpContext';

/**
 * Next.js layout wrapping every /admin route.
 *
 * Why this exists: `useHelp(slug)` is called at the top of admin pages,
 * BEFORE they return their JSX (and thus before `<AdminLayout>` renders).
 * The HelpProvider therefore can't live inside `<AdminLayout>` — it
 * needs to be an ancestor of the page itself. A Next.js layout file is
 * exactly that.
 *
 * Server component is fine here — HelpProvider is a client component
 * so it carries its own 'use client' boundary; React knows to ship it
 * to the browser and run state there. No need to mark this file client.
 */
export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HelpProvider>{children}</HelpProvider>;
}
