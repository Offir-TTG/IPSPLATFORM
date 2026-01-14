'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  ClipboardList,
  Calendar,
  Users,
  User,
  Bell,
  LogOut,
  Menu,
  TrendingUp,
  Settings,
  Search,
  Command,
  GraduationCap,
  Video,
  CreditCard,
  MessageCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/user/LoadingState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Sidebar } from '@/components/user/Sidebar';
import { CommandPalette } from '@/components/user/CommandPalette';
import { ChatBot } from '@/components/user/ChatBot';
import { useUserLanguage } from '@/context/AppContext';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useNotifications } from '@/hooks/useNotifications';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { t, direction } = useUserLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('Learning Portal');
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  // Real-time notification data
  const { unreadCount } = useUnreadCount();
  const { notifications } = useNotifications({ limit: 10, unread_only: false }); // Get more to check for urgent ones

  const navigationItems = [
    { name: t('user.nav.dashboard', 'Dashboard'), href: '/dashboard', icon: Home, badge: null },
    { name: t('user.nav.myPrograms', 'My Programs'), href: '/programs', icon: GraduationCap, badge: null },
    { name: t('user.nav.myCourses', 'My Courses'), href: '/courses', icon: Video, badge: null },
    { name: t('user.nav.notifications', 'Notifications'), href: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
  ];

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error('No authenticated user:', authError);
          router.push('/login');
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
          router.push('/login');
          return;
        }

        // Check if user should be in admin portal
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    async function loadTenant() {
      try {
        const response = await fetch('/api/admin/tenant');
        const result = await response.json();

        if (result.success) {
          setTenantLogo(result.data.logo_url || null);
          setTenantName(result.data.name || 'Learning Portal');
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
      }
    }

    loadTenant();
  }, []);

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const dismissBanner = (notificationId: string) => {
    setDismissedBanners((prev) => new Set(prev).add(notificationId));
  };

  // Get urgent unread notifications that haven't been dismissed
  const urgentNotifications = notifications.filter(
    (notif) =>
      notif.priority === 'urgent' &&
      !notif.is_read &&
      !dismissedBanners.has(notif.id)
  );
  const urgentNotification = urgentNotifications[0]; // Show first urgent notification

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Clean Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              {tenantLogo ? (
                <div className="h-8 w-8 flex items-center justify-center">
                  <img
                    src={tenantLogo}
                    alt={tenantName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent" suppressHydrationWarning>
                {tenantName}
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <LanguageSwitcher context="user" />
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 ltr:right-1 rtl:left-1 flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel suppressHydrationWarning>{t('user.layout.notifications', 'Notifications')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p suppressHydrationWarning>{t('user.layout.noNotifications', 'No notifications')}</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.action_url || '/notifications'}
                          className="block px-3 py-2 text-sm hover:bg-muted rounded-md cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium mb-1 truncate">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="w-full text-center justify-center cursor-pointer">
                      <span suppressHydrationWarning>{t('user.layout.viewAllNotifications', 'View all notifications')}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-[10px] font-semibold" suppressHydrationWarning>{t('user.layout.activeLearner', 'Active Learner')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-2" />

                  {/* Modern Menu Items with Icons */}
                  <div className="space-y-0.5">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" suppressHydrationWarning>{t('user.layout.profileSettings', 'Profile & Settings')}</p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('user.layout.manageAccount', 'Manage your account')}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile?tab=billing"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-accent cursor-pointer group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" suppressHydrationWarning>{t('user.layout.billing', 'Billing')}</p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('user.layout.manageSubscriptions', 'Manage subscriptions')}</p>
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
                        <p className="text-sm font-medium" suppressHydrationWarning>{t('user.layout.logout', 'Log out')}</p>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('user.layout.signOut', 'Sign out of your account')}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Urgent Notification Banner */}
      {urgentNotification && (
        <div className="fixed top-16 left-0 right-0 z-40 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <div style={{
            backgroundColor: 'hsl(var(--destructive))',
            borderBottom: '2px solid hsl(var(--destructive) / 0.3)'
          }}>
            {/* Animated accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              <div className="flex items-start gap-4 py-4">
                {/* Icon with background */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: 'hsl(var(--destructive-foreground) / 0.15)'
                }}>
                  <AlertTriangle style={{ color: 'hsl(var(--destructive-foreground))' }} className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-semibold text-sm mb-1.5" style={{
                    color: 'hsl(var(--destructive-foreground))',
                    fontFamily: 'var(--font-family-heading)'
                  }}>
                    {urgentNotification.title}
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-2" style={{
                    color: 'hsl(var(--destructive-foreground) / 0.95)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    {urgentNotification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {urgentNotification.action_url && (
                    <Link href={urgentNotification.action_url}>
                      <Button
                        size="sm"
                        className="font-medium shadow-sm"
                        style={{
                          backgroundColor: 'hsl(var(--destructive-foreground))',
                          color: 'hsl(var(--destructive))'
                        }}
                      >
                        {urgentNotification.action_label || t('common.view', 'View')}
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-white/10 transition-colors"
                    style={{ color: 'hsl(var(--destructive-foreground))' }}
                    onClick={() => dismissBanner(urgentNotification.id)}
                    title={t('common.dismiss', 'Dismiss')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`container mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-8 max-w-7xl ${urgentNotification ? 'pt-32' : 'pt-16'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
        <div className="grid grid-cols-5">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`relative flex flex-col items-center justify-center gap-1 py-2 w-full transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
                  {item.badge && (
                    <span className="absolute top-1 ltr:right-6 rtl:left-6 h-4 min-w-[16px] px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-semibold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ChatBot Widget */}
      <ChatBot />
    </div>
  );
}
