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
  User,
  TrendingUp,
  BarChart3,
  Award,
  Building2,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase/client';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  key: string;
  icon: any;
  href: string;
  badge?: number;
  translation_key?: string;
  visible?: boolean;
  order?: number;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
  translation_key?: string;
  visible?: boolean;
  order?: number;
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
  const [user, setUser] = useState<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  } | null>(null);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('Admin');
  const [customNavSections, setCustomNavSections] = useState<NavSection[] | null>(null);

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted(true);
    // Mark as hydrated to show sidebar
    setHydrated(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error('No authenticated user:', authError);
          return;
        }

        // Get user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, role')
          .eq('id', authUser.id)
          .single();

        if (userError || !userData) {
          console.error('Failed to load user data:', userError);
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadTenantLogo() {
      try {
        const response = await fetch('/api/admin/tenant');
        const data = await response.json();

        if (data.success) {
          setTenantLogo(data.data.logo_url || null);
          setTenantName(data.data.name || 'Admin');
        }
      } catch (error) {
        console.error('Error loading tenant logo:', error);
      }
    }

    loadTenantLogo();
  }, []);

  useEffect(() => {
    async function loadNavigationConfig() {
      try {
        const response = await fetch('/api/admin/navigation');
        const data = await response.json();

        if (data.success && data.data.sections) {
          setCustomNavSections(data.data.sections);
        }
      } catch (error) {
        console.error('Error loading navigation config:', error);
      }
    }

    loadNavigationConfig();
  }, []);

  // Don't render translated content until mounted and translations loaded
  // This prevents hydration mismatch
  if (!mounted) {
    return null;
  }

  const getInitials = () => {
    if (!user) return '?';
    if (user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    }
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email;
  };

  const getRoleBadge = () => {
    if (!user?.role) return 'User';
    if (user.role === 'super_admin') return 'Super Admin';
    if (user.role === 'admin') return 'Admin';
    return user.role;
  };

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

  // Icon mapping for navigation items
  const iconMap: Record<string, any> = {
    'dashboard': LayoutDashboard,
    'programs': BookOpen,
    'courses': GraduationCap,
    'enrollments': UserPlus,
    'grading': Award,
    'users': Users,
    'organization': Building2,
    'languages': Languages,
    'translations': FileText,
    'settings': Settings,
    'theme': Palette,
    'features': Flag,
    'integrations': Plug,
    'navigation': Navigation,
    'emails': Mail,
    'payments': CreditCard,
    'audit': Shield,
    'notifications': Bell,
  };

  // Translation key mapping for navigation items
  const navKeyMap: Record<string, string> = {
    'overview': 'admin.nav.overview',
    'learning': 'admin.nav.learning',
    'users': 'admin.nav.users_access',
    'configuration': 'admin.nav.configuration',
    'business': 'admin.nav.business',
    'security': 'admin.nav.security',
    'communications': 'admin.nav.communications',
    'dashboard': 'admin.nav.dashboard',
    'programs': 'admin.nav.lms_programs',
    'courses': 'admin.nav.lms_courses',
    'enrollments': 'admin.nav.enrollments',
    'grading': 'admin.nav.grading',
    'organization': 'admin.nav.organization',
    'languages': 'admin.nav.languages',
    'translations': 'admin.nav.translations',
    'settings': 'admin.nav.settings',
    'theme': 'admin.nav.theme',
    'features': 'admin.nav.features',
    'integrations': 'admin.nav.integrations',
    'navigation': 'admin.nav.navigation',
    'emails': 'admin.nav.emails',
    'payments': 'admin.nav.payments',
    'audit': 'admin.nav.audit',
    'notifications': 'admin.nav.notifications',
  };

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
        { key: 'admin.nav.grading', icon: Award, href: '/admin/grading/scales' },
      ],
    },
    {
      titleKey: 'admin.nav.users_access',
      items: [
        { key: 'admin.nav.users', icon: Users, href: '/admin/settings/users' },
      ],
    },
    {
      titleKey: 'admin.nav.communications',
      items: [
        { key: 'admin.nav.notifications', icon: Bell, href: '/admin/notifications' },
      ],
    },
    {
      titleKey: 'admin.nav.configuration',
      items: [
        { key: 'admin.nav.organization', icon: Building2, href: '/admin/settings/organization' },
        { key: 'admin.nav.languages', icon: Languages, href: '/admin/config/languages' },
        { key: 'admin.nav.translations', icon: FileText, href: '/admin/config/translations' },
        { key: 'admin.nav.settings', icon: Settings, href: '/admin/config/settings' },
        { key: 'admin.nav.theme', icon: Palette, href: '/admin/settings/theme' },
        { key: 'admin.nav.features', icon: Flag, href: '/admin/config/features' },
        { key: 'admin.nav.integrations', icon: Plug, href: '/admin/config/integrations' },
        { key: 'admin.nav.navigation', icon: Navigation, href: '/admin/config/navigation' },
        { key: 'admin.nav.emails', icon: Mail, href: '/admin/emails' },
      ],
    },
    {
      titleKey: 'admin.nav.business',
      items: [
        { key: 'admin.nav.payments', icon: CreditCard, href: '/admin/payments' },
      ],
    },
    {
      titleKey: 'admin.nav.security',
      items: [
        { key: 'admin.nav.audit', icon: Shield, href: '/admin/audit' },
      ],
    },
  ];

  // Apply custom navigation config if available
  let navSections = baseNavSections;
  if (customNavSections && customNavSections.length > 0) {
    navSections = customNavSections
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order)
      .map(section => ({
        titleKey: section.translation_key,
        items: section.items
          .filter(item => item.visible)
          .sort((a, b) => a.order - b.order)
          .map(item => ({
            key: item.translation_key,
            icon: item.icon ? (iconMap[item.icon] || Settings) : Settings,
            href: item.href,
          }))
      }));
  }

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

        <div className="flex items-center gap-2">
          <LanguageSwitcher context="admin" />

          {/* Mobile User Gear Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover:bg-accent"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback
                    className="font-semibold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
                      color: 'hsl(var(--primary-foreground))'
                    }}
                  >
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              {/* Modern User Info Card */}
              <div className="px-3 py-4 mb-2 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg">
                    <AvatarFallback
                      className="font-bold text-base"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
                        color: 'hsl(var(--primary-foreground))'
                      }}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{getDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Shield className="h-3 w-3" />
                      <span className="text-[10px] font-semibold">{getRoleBadge()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Modern Menu Items with Icons */}
              <div className="space-y-0.5">
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/settings/organization"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t('admin.nav.organization', 'Organization')}</p>
                      <p className="text-xs text-muted-foreground">{t('admin.nav.organizationSettings', 'Manage organization')}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/audit"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t('admin.nav.auditLog', 'Audit Log')}</p>
                      <p className="text-xs text-muted-foreground">{t('admin.nav.viewActivity', 'View activity logs')}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Logout Button */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('nav.logout', 'Log out')}</p>
                    <p className="text-xs text-muted-foreground">{t('nav.signOut', 'Sign out of your account')}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
              {tenantLogo ? (
                <div className="h-10 w-10 flex items-center justify-center">
                  <img
                    src={tenantLogo}
                    alt={tenantName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <h2 className="font-bold" style={{
                  color: 'hsl(var(--sidebar-foreground))',
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)'
                }}>{tenantName}</h2>
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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher context="admin" />

            {/* User Gear Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-accent"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarFallback
                      className="font-semibold text-sm"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
                        color: 'hsl(var(--primary-foreground))'
                      }}
                    >
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                {/* Modern User Info Card */}
                <div className="px-3 py-4 mb-2 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30 shadow-lg">
                      <AvatarFallback
                        className="font-bold text-base"
                        style={{
                          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
                          color: 'hsl(var(--primary-foreground))'
                        }}
                      >
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm truncate">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <Shield className="h-3 w-3" />
                        <span className="text-[10px] font-semibold">{getRoleBadge()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2" />

                {/* Modern Menu Items with Icons */}
                <div className="space-y-0.5">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/settings/organization"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('admin.nav.organization', 'Organization')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.nav.organizationSettings', 'Manage organization')}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/audit"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('admin.nav.auditLog', 'Audit Log')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.nav.viewActivity', 'View activity logs')}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2" />

                {/* Logout Button */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t('nav.logout', 'Log out')}</p>
                      <p className="text-xs text-muted-foreground">{t('nav.signOut', 'Sign out of your account')}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
