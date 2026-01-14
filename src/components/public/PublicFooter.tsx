'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

export function PublicFooter() {
  const { t } = useUserLanguage();
  const [mounted, setMounted] = useState(false);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('EduPlatform');

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
    <footer className="border-t bg-primary dark:bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {tenantLogo ? (
                <div className="relative h-16 w-16 overflow-hidden">
                  <Image
                    src={tenantLogo}
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center">
                  <GraduationCap className="h-10 w-10 text-primary-foreground dark:text-foreground" />
                </div>
              )}
              <div className="text-xl font-bold text-primary-foreground dark:text-foreground">
                {tenantName}
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 dark:text-muted-foreground">
              {mounted ? t('public.footer.description', 'Empowering learners worldwide with quality education and expert instruction.') : 'Empowering learners worldwide with quality education and expert instruction.'}
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground dark:text-foreground">
              {mounted ? t('public.footer.platform', 'Platform') : 'Platform'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#programs" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.browsePrograms', 'Browse Programs') : 'Browse Programs'}
                </Link>
              </li>
              <li>
                <Link href="/#courses" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.browseCourses', 'Browse Courses') : 'Browse Courses'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground dark:text-foreground">
              {mounted ? t('public.footer.company', 'Company') : 'Company'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.about', 'About Us') : 'About Us'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.contact', 'Contact Us') : 'Contact Us'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary-foreground dark:text-foreground">
              {mounted ? t('public.footer.legal', 'Legal') : 'Legal'}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.terms', 'Terms of Use') : 'Terms of Use'}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.privacy', 'Privacy Policy') : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.cookies', 'Cookie Policy') : 'Cookie Policy'}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground">
                  {mounted ? t('public.footer.accessibility', 'Accessibility') : 'Accessibility'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-primary-foreground/20 dark:border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-primary-foreground/80 dark:text-muted-foreground">
              © {new Date().getFullYear()} {tenantName}. {mounted ? t('public.footer.rights', 'All rights reserved') : 'All rights reserved'}.
            </p>
            <div className="flex gap-6">
              <Link href="https://www.facebook.com/intlparentingschool" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="https://x.com/omer_yael" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground" aria-label="X (Twitter)">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="https://www.youtube.com/channel/UC2iD1IqCweHe3Zug8pJOYtw" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground" aria-label="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
              <Link href="https://www.instagram.com/omer.yael/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/80 dark:text-muted-foreground transition-colors hover:text-primary-foreground dark:hover:text-foreground" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
