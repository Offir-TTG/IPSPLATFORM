'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Settings, in three tabs: sending (hours, Shabbat, daily
 * summary, how the client's settings apply, team alerts), email branding,
 * and template categories. Each tab saves with the floating save bar.
 */

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { CommsPage, COMMS } from '@/components/admin/comms/CommsPage';
import { SettingsTab } from '@/components/admin/reminders/SettingsTab';
import { BrandingTab } from '@/components/admin/comms/BrandingTab';
import { CategoriesTab } from '@/components/admin/comms/CategoriesTab';
import type { ReminderRow } from '@/lib/messaging/admin';

type Tab = 'sending' | 'branding' | 'categories';

function SettingsPage() {
  const { t } = useAdminLanguage();
  const params = useSearchParams();
  const tab: Tab = (['sending', 'branding', 'categories'] as const).find((x) => x === params.get('tab')) ?? 'sending';
  const [reminders, setReminders] = useState<ReminderRow[]>([]);

  useEffect(() => {
    if (tab !== 'sending') return;
    fetch('/api/admin/reminders', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setReminders(b?.reminders ?? []))
      .catch(() => {});
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'sending', label: t('admin.comms.settings.sending', 'Sending') },
    { key: 'branding', label: t('admin.comms.settings.branding', 'Email branding') },
    { key: 'categories', label: t('admin.comms.settings.categories', 'Template categories') },
  ];

  return (
    <CommsPage icon={Settings2} title={t('admin.comms.settings.title', 'Communications settings')} description={t('admin.comms.settings.subtitle', 'All the settings of what goes out to clients, in one place.')}>
      <nav aria-label={t('admin.reminders.tabs', 'Parts')} className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]">
        {tabs.map((x) => (
          <Link
            key={x.key}
            href={x.key === 'sending' ? COMMS.settings : `${COMMS.settings}?tab=${x.key}`}
            aria-current={tab === x.key ? 'page' : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-[3px] px-4 text-sm font-semibold ${
              tab === x.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      {tab === 'sending' && <SettingsTab reminders={reminders} />}
      {tab === 'branding' && <BrandingTab />}
      {tab === 'categories' && <CategoriesTab />}
    </CommsPage>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}
