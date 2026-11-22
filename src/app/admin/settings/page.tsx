'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  Languages,
  Mail,
  Navigation,
  Palette,
  Plug,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { SETTINGS_PAGES, type SettingsPageId } from '@/lib/admin/settings-pages';

/**
 * Settings home. Every settings screen is one card here, so the side menu
 * needs only one Settings link. Laid out like the Site settings page of the
 * marketing site: cards in groups, each opening its own page.
 */

const ICONS: Record<SettingsPageId, LucideIcon> = {
  organization: Building2,
  theme: Palette,
  languages: Languages,
  translations: FileText,
  platform: SlidersHorizontal,
  features: Flag,
  integrations: Plug,
  navigation: Navigation,
  emails: Mail,
  crons: Activity,
};

const GROUPS: Array<{ key: string; fallback: string; pages: SettingsPageId[] }> = [
  { key: 'admin.settingsHub.group.organization', fallback: 'Your organization', pages: ['organization', 'theme'] },
  { key: 'admin.settingsHub.group.language', fallback: 'Language', pages: ['languages', 'translations'] },
  { key: 'admin.settingsHub.group.platform', fallback: 'Platform', pages: ['platform', 'features', 'integrations'] },
  { key: 'admin.settingsHub.group.system', fallback: 'Menu, emails and system', pages: ['navigation', 'emails', 'crons'] },
];

function Card({ id }: { id: SettingsPageId }) {
  const { t, direction } = useAdminLanguage();
  const page = SETTINGS_PAGES[id];
  const Icon = ICONS[id];
  const Arrow = direction === 'rtl' ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={page.href}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:shadow-sm"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        {/* A heading, so it takes the theme's heading color and font, not
            the link color every <a> gets. */}
        <h3 className="text-base font-semibold">{t(page.titleKey, page.titleFallback)}</h3>
        <span className="mt-0.5 block text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {t(page.summaryKey, page.summaryFallback)}
        </span>
      </span>
      <Arrow className="h-4 w-4 shrink-0 self-center text-muted-foreground group-hover:text-foreground" aria-hidden />
    </Link>
  );
}

export default function SettingsHomePage() {
  const { t } = useAdminLanguage();
  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold">{t('admin.settingsHub.title', 'Settings')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('admin.settingsHub.subtitle', 'Everything that sets up the platform, in one place. Choose a card to open it.')}
        </p>

        {GROUPS.map((group) => (
          <section key={group.key} className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t(group.key, group.fallback)}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.pages.map((id) => (
                <Card key={id} id={id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
