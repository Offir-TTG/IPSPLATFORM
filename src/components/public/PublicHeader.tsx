'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { GraduationCap, MessageSquare } from 'lucide-react';
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
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {tenantLogo ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src={tenantLogo}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <span className="text-xl font-bold text-foreground">
              {tenantName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/contact" aria-label="Contact Us">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </Link>
            <ThemeToggle />
            <LanguageSelector />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {mounted ? t('public.nav.login', 'Login') : 'Login'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
