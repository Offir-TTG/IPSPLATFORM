'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Award, ClipboardList, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLanguage } from '@/context/AppContext';

type GradingTab = 'categories' | 'items' | 'gradebook';

interface GradingTabsNavProps {
  courseId: string;
  active: GradingTab;
}

export function GradingTabsNav({ courseId, active }: GradingTabsNavProps) {
  const { t } = useAdminLanguage();
  const base = `/admin/lms/courses/${courseId}/grading`;
  const stripRef = useRef<HTMLDivElement | null>(null);

  // Mouse wheel only emits deltaY, which the browser sends to the
  // nearest vertical scroller — that's the page, not this horizontal
  // strip. Intercept wheel events on the strip and translate vertical
  // wheel motion into horizontal scroll. Only when the strip actually
  // overflows; otherwise let the page handle the wheel normally.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const overflowsX = el.scrollWidth > el.clientWidth;
      if (!overflowsX) return;
      // Prefer the dominant axis. If the user is scrolling vertically
      // over the strip, redirect to horizontal; preserve native deltaX
      // for trackpads that already scroll horizontally.
      const dominant = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (dominant === 0) return;
      e.preventDefault();
      el.scrollLeft += dominant;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const tabs: { key: GradingTab; href: string; label: string; Icon: typeof Award }[] = [
    { key: 'categories', href: `${base}/categories`, label: t('admin.grading.nav.categories', 'Categories'), Icon: Award },
    { key: 'items',      href: `${base}/items`,      label: t('admin.grading.nav.items',      'Grade Items'), Icon: ClipboardList },
    { key: 'gradebook',  href: `${base}/gradebook`,  label: t('admin.grading.nav.gradebook',  'Gradebook'),   Icon: Calculator },
  ];

  return (
    <nav
      aria-label={t('admin.grading.nav.aria', 'Grading sections')}
      className="border-b"
    >
      <div
        ref={stripRef}
        className="flex gap-1 overflow-x-auto overflow-y-hidden"
        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
      >
        {tabs.map(({ key, href, label, Icon }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
