import { Rubik } from 'next/font/google';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { PortalShell } from './PortalShell';

const rubik = Rubik({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-rubik' });

/**
 * The portal frame (top bar, phone tabs, notices) for whoever is signed in,
 * read on the server. Returns null when nobody is signed in, so the caller
 * decides: the portal sends them to log in, enrollment shows its plain page.
 */
export async function PortalFrame({ children, staffRedirect = true }: { children: React.ReactNode; staffRedirect?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // users RLS depends on a tenant setting server requests don't carry,
  // so read the verified user's own row with the admin client.
  const admin = createAdminClient();
  const { data: profile } = await admin.from('users').select('first_name, last_name, email, role, tenant_id').eq('id', user.id).maybeSingle();

  // The organisation's own name and logo, as set in the admin.
  const { data: org } = profile?.tenant_id ? await admin.from('tenants').select('name, logo_url').eq('id', profile.tenant_id).maybeSingle() : { data: null };

  return (
    <div className={rubik.variable}>
      <PortalShell
        user={{
          firstName: profile?.first_name ?? '',
          lastName: profile?.last_name ?? '',
          email: profile?.email ?? user.email ?? '',
          role: profile?.role ?? 'student',
        }}
        org={{ name: org?.name ?? '', logoUrl: org?.logo_url ?? null }}
        staffRedirect={staffRedirect}
      >
        {children}
      </PortalShell>
    </div>
  );
}
