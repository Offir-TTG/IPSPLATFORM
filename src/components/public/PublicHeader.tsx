'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { GraduationCap, LifeBuoy } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { LanguageSelector } from '@/components/public/LanguageSelector';
import { ThemeToggle } from '@/components/public/ThemeToggle';

export function PublicHeader() {
  const { t } = useUserLanguage();
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('EduPlatform');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const response = await fetch('/api/public/tenant');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tenant) {
          setTenantLogo(data.tenant.logo_url || null);
          setTenantName(data.tenant.name || 'EduPlatform');
        }
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      {/* px-3 on mobile / px-4 from sm — gives the row a touch more room
          on iPhone-SE-class widths. The right-cluster gap also tightens
          on mobile so all four controls + the brand still fit on ~360px. */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* min-w-0 + flex-1 lets the tenant name truncate instead of
              forcing the row to overflow when the name is long. */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 min-w-0 flex-1"
          >
            {tenantLogo ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={tenantLogo}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            {/* Truncate + responsive font size — name stays visible on
                every viewport but never forces the row to overflow. */}
            <span className="truncate text-base font-bold text-foreground sm:text-lg md:text-xl">
              {tenantName}
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            <Link href="/contact" aria-label="Support">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <LifeBuoy className="h-4 w-4" />
              </Button>
            </Link>
            <ThemeToggle />
            <LanguageSelector />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                {mounted ? t('public.nav.login', 'Login') : 'Login'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
