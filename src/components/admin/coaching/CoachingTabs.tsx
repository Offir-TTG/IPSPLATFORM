'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { HeartHandshake } from 'lucide-react';
import { joinedBar, joinedSegment, NewButton, PageTitle } from '@/components/admin/notifications/kit';

/**
 * The three parts of coaching, as one joined bar: packages, requests (with
 * the number of new ones) and intake forms.
 */
export function CoachingTabs() {
  const { t } = useAdminLanguage();
  const pathname = usePathname() || '';
  const [newRequests, setNewRequests] = useState<number | null>(null);

  useEffect(() => {
    void fetch('/api/admin/coaching/requests?status=new', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNewRequests(d?.counts?.new ?? null))
      .catch(() => undefined);
  }, [pathname]);

  const tabs = [
    { href: '/admin/coaching', label: t('admin.coaching.tabs.packages', 'חבילות'), on: pathname === '/admin/coaching' || pathname.startsWith('/admin/coaching/new') },
    { href: '/admin/coaching/requests', label: t('admin.coaching.tabs.requestsShort', 'בקשות'), on: pathname.startsWith('/admin/coaching/requests'), count: newRequests },
    { href: '/admin/coaching/intake', label: t('admin.coaching.tabs.intakeForms', 'שאלוני פתיחה'), on: pathname.startsWith('/admin/coaching/intake') },
  ];

  return (
    <nav aria-label={t('admin.coaching.tabs.label2', 'ליווי')} className="max-w-full overflow-x-auto pb-0.5">
      <div className={joinedBar}>
        {tabs.map((x) => (
          <Link key={x.href} href={x.href} aria-current={x.on ? 'page' : undefined} className={`${joinedSegment(x.on)} min-h-11 px-4`}>
            {x.label}
            {x.count ? (
              <span className={`rounded-full px-2 text-xs font-bold tabular-nums ${x.on ? 'bg-white/20' : 'bg-amber-400 text-amber-950'}`}>{x.count}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/**
 * The same top on every coaching tab: the "ליווי" title, one line about the
 * tab, the "open a package" button, and the tabs. Switching tabs keeps it.
 */
export function CoachingHeader({ description }: { description: string }) {
  const { t } = useAdminLanguage();
  return (
    <>
      <PageTitle
        icon={HeartHandshake}
        title={t('admin.coaching.packages.title', 'ליווי')}
        description={description}
        actions={
          <NewButton href="/admin/coaching/new">{t('admin.coaching.packages.new', 'פתיחת חבילה')}</NewButton>
        }
      />
      <CoachingTabs />
    </>
  );
}
