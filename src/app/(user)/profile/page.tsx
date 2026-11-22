import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { loadClientLearning } from '@/lib/portal/clientLearning';
import { loadFamily } from '@/lib/portal/family';
import { ProfileView, type ProfileData } from '@/components/user/portal/ProfileView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Self-scoped reads with the admin client (users RLS needs a tenant setting server requests lack).
  const admin = createAdminClient();
  const [{ data: u }, { data: prefs }, { data: sessions }, learning, kids] = await Promise.all([
    admin
      .from('users')
      .select('first_name, last_name, email, phone, is_whatsapp, contact_email, bio, location, timezone, website, linkedin_url, facebook_url, instagram_url, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    admin.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    admin
      .from('audit_sessions')
      .select('id, device_type, browser, city, country_code, last_activity_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })
      .limit(10),
    loadClientLearning(user.id),
    loadFamily(user.id),
  ]);

  // "תוכנית אדלר · מועדון ההורים": what the client belongs to, under their name.
  const belongs = [...new Set([...learning.sourceOfCourse.values()].filter((s) => s.group !== 'me').map((s) => s.label))].slice(0, 2);

  const data: ProfileData = {
    firstName: u?.first_name ?? '',
    lastName: u?.last_name ?? '',
    email: u?.email ?? user.email ?? '',
    phone: u?.phone ?? '',
    isWhatsapp: !!u?.is_whatsapp,
    contactEmail: u?.contact_email ?? '',
    bio: u?.bio ?? '',
    location: u?.location ?? '',
    timezone: u?.timezone ?? null,
    website: u?.website ?? '',
    linkedin: u?.linkedin_url ?? '',
    facebook: u?.facebook_url ?? '',
    instagram: u?.instagram_url ?? '',
    avatarUrl: u?.avatar_url ?? null,
    belongs: belongs.join(' · '),
    prefs: prefs
      ? {
          email: prefs.email_enabled !== false,
          categories: prefs.category_preferences ?? {},
          quietStart: prefs.quiet_hours_start ?? null,
          quietEnd: prefs.quiet_hours_end ?? null,
          digest: !!prefs.digest_mode,
        }
      : null,
    sessions: (sessions ?? []).map((s: any) => ({
      id: s.id,
      device: s.device_type || s.browser || 'מכשיר',
      place: [s.city, s.country_code].filter(Boolean).join(', '),
      lastActive: s.last_activity_at,
    })),
  };

  const tab = (['details', 'family', 'notify', 'security'] as const).find((t) => t === searchParams?.tab) ?? 'details';
  return <ProfileView data={data} kids={kids} initialTab={tab} />;
}
