/**
 * The screens reached from the Settings page (/admin/settings) instead of
 * the side menu. The admin layout uses `settingsPageFor` to keep Settings
 * lit in the menu and to show a way back on each of these screens.
 */

export type SettingsPageId =
  | 'organization'
  | 'theme'
  | 'languages'
  | 'translations'
  | 'platform'
  | 'features'
  | 'integrations'
  | 'navigation'
  | 'emails'
  | 'crons';

export const SETTINGS_HOME = '/admin/settings';

export const SETTINGS_PAGES: Record<
  SettingsPageId,
  { href: string; titleKey: string; titleFallback: string; summaryKey: string; summaryFallback: string }
> = {
  organization: {
    href: '/admin/settings/organization',
    titleKey: 'admin.nav.organization',
    titleFallback: 'Organization',
    summaryKey: 'admin.settingsHub.organization',
    summaryFallback: "Your organization's details and preferences",
  },
  theme: {
    href: '/admin/settings/theme',
    titleKey: 'admin.nav.theme',
    titleFallback: 'Theme',
    summaryKey: 'admin.settingsHub.theme',
    summaryFallback: 'Colors, fonts and how the platform looks',
  },
  languages: {
    href: '/admin/config/languages',
    titleKey: 'admin.nav.languages',
    titleFallback: 'Languages',
    summaryKey: 'admin.settingsHub.languages',
    summaryFallback: 'Which languages the platform offers, and the default one',
  },
  translations: {
    href: '/admin/config/translations',
    titleKey: 'admin.nav.translations',
    titleFallback: 'Translations',
    summaryKey: 'admin.settingsHub.translations',
    summaryFallback: 'The wording of every screen, in each language',
  },
  platform: {
    href: '/admin/config/settings',
    titleKey: 'admin.settingsHub.platformTitle',
    titleFallback: 'Platform settings',
    summaryKey: 'admin.settingsHub.platform',
    summaryFallback: 'General settings that apply across the whole platform',
  },
  features: {
    href: '/admin/config/features',
    titleKey: 'admin.nav.features',
    titleFallback: 'Features',
    summaryKey: 'admin.settingsHub.features',
    summaryFallback: 'Turn parts of the platform on or off',
  },
  integrations: {
    href: '/admin/config/integrations',
    titleKey: 'admin.nav.integrations',
    titleFallback: 'Integrations',
    summaryKey: 'admin.settingsHub.integrations',
    summaryFallback: 'Payments, signatures, video meetings and the other connected services',
  },
  navigation: {
    href: '/admin/config/navigation',
    titleKey: 'admin.nav.navigation',
    titleFallback: 'Navigation',
    summaryKey: 'admin.settingsHub.navigation',
    summaryFallback: 'The order and visibility of the side menu',
  },
  emails: {
    href: '/admin/emails',
    titleKey: 'admin.nav.emails',
    titleFallback: 'Emails',
    summaryKey: 'admin.settingsHub.emails',
    summaryFallback: 'Email templates, sending queue, schedules and results',
  },
  crons: {
    href: '/admin/crons',
    titleKey: 'admin.nav.crons',
    titleFallback: 'Scheduled tasks',
    summaryKey: 'admin.settingsHub.crons',
    summaryFallback: 'The automatic jobs the platform runs, and whether they worked',
  },
};

/** The settings screen an address belongs to, including its inner pages
 *  (for example /admin/emails/templates). Null for every other address. */
export function settingsPageFor(pathname: string): SettingsPageId | null {
  for (const [id, page] of Object.entries(SETTINGS_PAGES) as Array<[SettingsPageId, { href: string }]>) {
    if (pathname === page.href || pathname.startsWith(`${page.href}/`)) return id;
  }
  return null;
}
