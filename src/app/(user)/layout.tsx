import { redirect } from 'next/navigation';
import { PortalFrame } from '@/components/user/portal/PortalFrame';

/**
 * Client portal layout. Checks the session on the server so pages render
 * with the user already known, instead of waiting for the browser.
 */
export default async function UserPortalLayout({ children }: { children: React.ReactNode }) {
  const framed = await PortalFrame({ children });
  if (!framed) redirect('/login');
  return framed;
}
