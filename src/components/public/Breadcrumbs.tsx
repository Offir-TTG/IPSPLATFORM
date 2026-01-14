'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t, direction } = useUserLanguage();

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground py-4" dir={direction}>
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>{t('breadcrumbs.home', 'Home')}</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
          {item.href && index < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
