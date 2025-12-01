'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Languages,
  FileText,
  Settings,
  Palette,
  Flag,
  Menu as MenuIcon,
  X,
  ChevronRight,
  Plug,
  Navigation,
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  Mail,
  LogOut,
  Shield,
  UserPlus,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  key: string;
  icon: any;
  href: string;
  badge?: number;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t, language, loading: translationsLoading } = useAdminLanguage();
  const { isSuperAdmin } = useTenant();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted(true);
    // Mark as hydrated to show sidebar
    setHydrated(true);
  }, []);

  // Don't render translated content until mounted and translations loaded
  // This prevents hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        console.error('Logout failed');
        setLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  // Note: Direction is managed purely via CSS using [dir] attribute
  // The inline script in layout.tsx sets document.dir before React loads
  // No JavaScript state needed - CSS handles everything

  const baseNavSections: NavSection[] = [
    {
      titleKey: 'admin.nav.overview',
      items: [
        { key: 'admin.nav.dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      ],
    },
    {
      titleKey: 'admin.nav.learning',
      items: [
        { key: 'admin.nav.lms_programs', icon: BookOpen, href: '/admin/lms/programs' },
        { key: 'admin.nav.lms_courses', icon: GraduationCap, href: '/admin/lms/courses' },
        { key: 'admin.nav.enrollments', icon: UserPlus, href: '/admin/enrollments' },
      ],
    },
    {
      titleKey: 'admin.nav.configuration',
      items: [
        { key: 'admin.nav.languages', icon: Languages, href: '/admin/config/languages' },
        { key: 'admin.nav.translations', icon: FileText, href: '/admin/config/translations' },
        { key: 'admin.nav.settings', icon: Settings, href: '/admin/config/settings' },
        { key: 'admin.nav.theme', icon: Palette, href: '/admin/settings/theme' },
        { key: 'admin.nav.features', icon: Flag, href: '/admin/config/features' },
        { key: 'admin.nav.integrations', icon: Plug, href: '/admin/config/integrations' },
        { key: 'admin.nav.navigation', icon: Navigation, href: '/admin/config/navigation' },
        { key: 'admin.nav.emails', icon: Mail, href: '/admin/emails' },
        { key: 'admin.nav.keap.dashboard', icon: Users, href: '/admin/keap' },
      ],
    },
    {
      titleKey: 'admin.nav.business',
      items: [
        { key: 'admin.nav.payments', icon: CreditCard, href: '/admin/payments' },
      ],
    },
//    {
//      titleKey: 'admin.nav.keap',
//      items: [
//        { key: 'admin.nav.keap.dashboard', icon: Users, href: '/admin/keap' },
//      ],
//    },
    {
      titleKey: 'admin.nav.security',
      items: [
        { key: 'admin.nav.audit', icon: Shield, href: '/admin/audit' },
      ],
    },
  ];

  const navSections = baseNavSections;

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>

        <h1 className="font-bold" style={{
          fontSize: 'var(--font-size-lg)',
          fontFamily: 'var(--font-family-heading)',
          color: 'hsl(var(--text-heading))'
        }}>{t('admin.title', 'Admin Panel')}</h1>

        <LanguageSwitcher context="admin" />
      </div>

      {/* Sidebar */}
      <aside
        className={`
          admin-sidebar
          ${hydrated ? 'hydrated' : ''}
          fixed top-0 bottom-0 z-40 w-64
          ${sidebarOpen ? 'translate-x-0' : ''}
          lg:translate-x-0
        `}
        style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
      >
        <div className="h-full flex flex-col">
          {/* Logo/Brand */}
          <div className="p-6 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold" style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)'
                }}>{t('platform.name', 'Admin')}</h2>
                <p style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  opacity: 0.7,
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)'
                }}>{t('admin.subtitle', 'Control Panel')}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-semibold uppercase tracking-wider mb-2 px-3" style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  opacity: 0.6,
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {t(section.titleKey, section.titleKey.split('.').pop())}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                          ${active ? 'font-medium' : ''}
                        `}
                        style={active ? {
                          backgroundColor: 'hsl(var(--sidebar-active))',
                          color: 'hsl(var(--sidebar-active-foreground))',
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)'
                        } : {
                          color: 'hsl(var(--sidebar-foreground))',
                          opacity: 0.8,
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)'
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-active) / 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{t(item.key, item.key.split('.').pop())}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {active && <ChevronRight className="h-4 w-4" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">OO</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}>Offir Omer</p>
                <p className="truncate" style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  opacity: 0.6,
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)'
                }}>Admin</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                aria-label="Logout"
                title={t('nav.logout', 'Logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="admin-main min-h-screen">
        {/* Desktop header */}
        <div className="hidden lg:flex sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-bold" style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'var(--font-family-heading)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('admin.title', 'Admin Panel')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher context="admin" />
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
