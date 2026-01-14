'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  ClipboardList,
  Calendar,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserLanguage } from '@/context/AppContext';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useUserLanguage();

  const navigationSections = [
    {
      title: t('user.sidebar.sections.learning', 'Learning'),
      items: [
        { name: t('user.sidebar.dashboard', 'Dashboard'), href: '/dashboard', icon: Home, badge: null },
        { name: t('user.sidebar.myLearning', 'My Learning'), href: '/learning', icon: BookOpen, badge: null },
        { name: t('user.sidebar.assignments', 'Assignments'), href: '/assignments', icon: ClipboardList, badge: 3 },
        { name: t('user.sidebar.progress', 'Progress'), href: '/progress', icon: TrendingUp, badge: null },
      ],
    },
    {
      title: t('user.sidebar.sections.schedule', 'Schedule'),
      items: [
        { name: t('user.sidebar.calendar', 'Calendar'), href: '/calendar', icon: Calendar, badge: null },
      ],
    },
    {
      title: t('user.sidebar.sections.community', 'Community'),
      items: [
        { name: t('user.sidebar.community', 'Community'), href: '/community', icon: Users, badge: null },
        { name: t('user.sidebar.discussions', 'Discussions'), href: '/discussions', icon: MessageSquare, badge: 2 },
      ],
    },
    {
      title: t('user.sidebar.sections.profile', 'Profile'),
      items: [
        { name: t('user.sidebar.achievements', 'Achievements'), href: '/achievements', icon: Award, badge: null },
        { name: t('user.sidebar.certificates', 'Certificates'), href: '/certificates', icon: GraduationCap, badge: null },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-all duration-300 sticky top-0 h-screen',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Learning</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start relative group transition-all',
                        isActive
                          ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                          : 'text-foreground/70 hover:text-foreground hover:bg-accent',
                        isCollapsed ? 'px-2' : 'px-3'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute ltr:left-0 rtl:right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                      )}

                      <Icon className={cn('h-5 w-5 shrink-0', isCollapsed ? '' : 'ltr:mr-3 rtl:ml-3')} />

                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.name}</span>
                          {item.badge && (
                            <Badge
                              variant={isActive ? 'default' : 'secondary'}
                              className="ltr:ml-auto rtl:mr-auto h-5 min-w-5 px-1.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute ltr:left-full rtl:right-full ltr:ml-2 rtl:mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                          {item.name}
                          {item.badge && (
                            <Badge variant="secondary" className="ltr:ml-2 rtl:mr-2 h-4 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              <span>{t('user.sidebar.collapse', 'Collapse')}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
