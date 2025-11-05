'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Home,
  Video,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Calendar,
  BarChart,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: UserRole;
  userName: string;
}

const getNavItems = (role: UserRole) => {
  const baseItems = [
    { href: `/${role}/dashboard`, label: 'Dashboard', icon: Home },
  ];

  if (role === 'admin') {
    return [
      ...baseItems,
      { href: '/admin/programs', label: 'Programs', icon: BookOpen },
      { href: '/admin/courses', label: 'Courses', icon: Video },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];
  }

  if (role === 'instructor') {
    return [
      ...baseItems,
      { href: '/instructor/courses', label: 'My Courses', icon: Video },
      { href: '/instructor/students', label: 'Students', icon: Users },
      { href: '/instructor/schedule', label: 'Schedule', icon: Calendar },
      { href: '/instructor/materials', label: 'Materials', icon: FileText },
      { href: '/instructor/settings', label: 'Settings', icon: Settings },
    ];
  }

  // Student
  return [
    ...baseItems,
    { href: '/student/courses', label: 'My Courses', icon: BookOpen },
    { href: '/student/schedule', label: 'Schedule', icon: Calendar },
    { href: '/student/recordings', label: 'Recordings', icon: Video },
    { href: '/student/materials', label: 'Materials', icon: FileText },
    { href: '/student/settings', label: 'Settings', icon: Settings },
  ];
};

export default function DashboardLayout({
  children,
  userRole,
  userName,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(userRole);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Parenting School</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-muted w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-card border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold">Parenting School</span>
            </Link>
            <div className="w-6" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
