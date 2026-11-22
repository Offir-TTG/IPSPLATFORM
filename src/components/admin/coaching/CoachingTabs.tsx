'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { cn } from '@/lib/utils';

/** Tab bar shown at the top of every child-coaching admin page. */
export function CoachingTabs() {
  const { t } = useAdminLanguage();
  const pathname = usePathname() || '';
  const tabs = [
    { href: '/admin/coaching/children', label: t('admin.coaching.tabs.children', 'ילדים באימון') },
    { href: '/admin/coaching/coaches', label: t('admin.coaching.tabs.coaches', 'מטפלות ושעות') },
    { href: '/admin/coaching/intake', label: t('admin.coaching.tabs.intake', 'טופס אינטייק') },
  ];
  const otherActive = tabs.some((x) => pathname.startsWith(x.href));
  const all = [{ href: '/admin/coaching', label: t('admin.coaching.tabs.requests', 'בקשות אימון') }, ...tabs];

  return (
    <nav aria-label={t('admin.coaching.tabs.label', 'אימון ילדים')} className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-border px-1">
        {all.map((x) => {
          const active = x.href === '/admin/coaching' ? !otherActive && pathname.startsWith('/admin/coaching') : pathname.startsWith(x.href);
          return (
            <li key={x.href}>
              <Link
                href={x.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex min-h-[44px] items-center border-b-2 px-4 text-base',
                  active ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {x.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
