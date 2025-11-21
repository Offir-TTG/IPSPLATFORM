# User Portal Implementation Guide
**IPSPlatform - Complete Student/User-Facing Portal**

> **Version:** 1.0
> **Last Updated:** January 18, 2025
> **Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 0: Critical Bug Fix](#phase-0-critical-bug-fix)
4. [Phase 1: Dashboard Implementation](#phase-1-dashboard-implementation)
5. [Phase 2: My Learning](#phase-2-my-learning)
6. [Phase 3: Assignments & Grading](#phase-3-assignments--grading)
7. [Phase 4: Calendar & Sessions](#phase-4-calendar--sessions)
8. [Phase 5: Community Features](#phase-5-community-features)
9. [Phase 6: Account & Settings](#phase-6-account--settings)
10. [Theme Inheritance](#theme-inheritance)
11. [Performance Strategy](#performance-strategy)
12. [Accessibility](#accessibility)
13. [Testing Strategy](#testing-strategy)
14. [Timeline & Milestones](#timeline--milestones)

---

## Overview

### Purpose
Build a complete, modern, accessible user portal for students/learners that:
- **Inherits 100% from existing theme** configuration (colors, fonts, RTL)
- **Optimized for performance** (React Query, lazy loading, caching)
- **Comprehensive audit logging** (especially payments & LMS activities)
- **Mobile-responsive** from day one
- **Accessibility-first** (WCAG 2.1 AA compliance)

### Key Principles
1. **Theme Consistency**: Use existing CSS variables, no custom colors
2. **Performance**: Single optimized API calls, aggressive caching
3. **User Experience**: Progressive disclosure, clear CTAs, motivating design
4. **Security**: RLS policies, audit trails, proper authentication
5. **Internationalization**: Full RTL support, translations via existing system

---

## Architecture

### Technology Stack
```
Frontend:
- Next.js 14 (App Router) ✓
- React 18 ✓
- TypeScript ✓
- Tailwind CSS (existing theme) ✓
- Radix UI components (existing) ✓
- React Query (NEW - for data fetching)
- Recharts (NEW - for visualizations)

Backend:
- Next.js API Routes ✓
- Supabase PostgreSQL ✓
- RLS Policies ✓
- Optimized SQL Functions (NEW)

Integrations:
- Zoom (existing) ✓
- DocuSign (existing) ✓
- Stripe (existing) ✓
```

### Portal Structure
```
src/
├── app/
│   ├── (user)/                    # User portal route group
│   │   ├── layout.tsx             # UserLayout wrapper + auth
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── learning/
│   │   │   ├── programs/
│   │   │   │   ├── page.tsx       # Programs list
│   │   │   │   └── [id]/page.tsx  # Program detail
│   │   │   └── courses/
│   │   │       └── [id]/page.tsx  # Course player
│   │   ├── assignments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── community/
│   │   │   ├── discussions/
│   │   │   └── announcements/
│   │   └── account/
│   │       ├── profile/page.tsx
│   │       ├── preferences/page.tsx
│   │       ├── payments/page.tsx
│   │       └── certificates/page.tsx
│   │
│   └── api/
│       └── user/
│           ├── dashboard/route.ts
│           ├── enrollments/route.ts
│           ├── progress/route.ts
│           ├── assignments/route.ts
│           └── certificates/route.ts
│
├── components/
│   └── user/
│       ├── UserLayout.tsx
│       ├── dashboard/
│       │   ├── WelcomeHero.tsx
│       │   ├── StatsCards.tsx
│       │   ├── ContinueLearning.tsx
│       │   ├── UpcomingSessions.tsx
│       │   └── PendingAssignments.tsx
│       ├── course/
│       │   ├── CoursePlayer.tsx
│       │   ├── TopicRenderer.tsx
│       │   └── ProgressTracker.tsx
│       └── shared/
│           ├── ProgressBar.tsx
│           └── AssignmentCard.tsx
│
├── hooks/
│   ├── useDashboard.ts
│   ├── useEnrollments.ts
│   ├── useProgress.ts
│   └── useAssignments.ts
│
└── providers/
    └── QueryProvider.tsx           # React Query setup
```

---

## Phase 0: Critical Bug Fix

### Issue: DocuSign Template Dropdown Crash
**Error**: `<Select.Item /> must have a value prop that is not an empty string`

**Location**: `src/app/admin/lms/programs/page.tsx`

**Fix**: Change the "None" option value from `""` to `"__none__"`

#### Files to Modify:

**1. Create Dialog - Line ~1072:**
```typescript
// BEFORE (causes crash):
<SelectItem value="">{t('common.none', 'None')}</SelectItem>

// AFTER (fix):
<SelectItem value="__none__">{t('common.none', 'None')}</SelectItem>
```

**2. Edit Dialog - Line ~1303:**
```typescript
// Same fix as above
<SelectItem value="__none__">{t('common.none', 'None')}</SelectItem>
```

**3. Form Initialization - Line ~106:**
```typescript
// Update initial state
const [formData, setFormData] = useState({
  // ... other fields
  docusign_template_id: '__none__', // Changed from ''
});
```

**4. Save Handler - Before submission:**
```typescript
// Before sending to API, convert back to null
const dataToSave = {
  ...formData,
  docusign_template_id: formData.docusign_template_id === '__none__'
    ? null
    : formData.docusign_template_id
};
```

---

## Phase 1: Dashboard Implementation

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install recharts  # For charts/visualizations
```

### Step 2: Setup React Query Provider

**Create**: `src/providers/QueryProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.Node }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**Update**: `src/app/layout.tsx`

```typescript
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html lang={lang} dir={dir}>
      <body>
        <QueryProvider>  {/* Add this */}
          <ThemeProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Step 3: Create User Layout

**Create**: `src/components/user/UserLayout.tsx`

```typescript
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Home, BookOpen, Calendar, FileText, User,
  Bell, Settings, LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { t, direction } = useContext(AppContext);
  const pathname = usePathname();
  const isRtl = direction === 'rtl';

  const navigation = [
    { name: t('user.nav.dashboard', 'Dashboard'), href: '/dashboard', icon: Home },
    { name: t('user.nav.learning', 'My Learning'), href: '/learning', icon: BookOpen },
    { name: t('user.nav.calendar', 'Calendar'), href: '/calendar', icon: Calendar },
    { name: t('user.nav.assignments', 'Assignments'), href: '/assignments', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold">📚 IPSPlatform</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            <DropdownMenu dir={direction}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56">
                <DropdownMenuLabel>
                  {t('user.account.my_account', 'My Account')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account/profile">
                    <User className="mr-2 h-4 w-4" />
                    {t('user.account.profile', 'Profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/preferences">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('user.account.preferences', 'Preferences')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('user.account.logout', 'Logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
        <div className="grid grid-cols-4 gap-2 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
```

### Step 4: Create Route Group

**Create**: `src/app/(user)/layout.tsx`

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UserLayout from '@/components/user/UserLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <UserLayout>{children}</UserLayout>;
}
```

### Step 5: Create Dashboard Database Function

**Create**: `supabase/migrations/20250118_user_dashboard_function.sql`

```sql
-- ============================================================================
-- USER DASHBOARD OPTIMIZED FUNCTION
-- Single query to fetch all dashboard data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Active Enrollments with Progress
    'enrollments', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'status', e.status,
          'course', jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'image_url', c.image_url,
            'program', jsonb_build_object(
              'id', p.id,
              'name', p.name
            )
          ),
          'progress_percentage', COALESCE((
            SELECT AVG(up.progress_percentage)
            FROM user_progress up
            WHERE up.enrollment_id = e.id
          ), 0)::INTEGER,
          'last_accessed', (
            SELECT MAX(up.last_accessed_at)
            FROM user_progress up
            WHERE up.enrollment_id = e.id
          )
        )
      ), '[]'::jsonb)
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN programs p ON c.program_id = p.id
      WHERE e.user_id = p_user_id
        AND e.status IN ('active', 'pending')
      ORDER BY (
        SELECT MAX(up.last_accessed_at)
        FROM user_progress up
        WHERE up.enrollment_id = e.id
      ) DESC NULLS LAST
      LIMIT 5
    ),

    -- Upcoming Live Sessions
    'upcoming_sessions', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'description', l.description,
          'start_time', l.start_time,
          'duration', l.duration,
          'zoom_join_url', l.zoom_join_url,
          'zoom_meeting_id', l.zoom_meeting_id,
          'course', jsonb_build_object(
            'id', c.id,
            'title', c.title
          ),
          'instructor', jsonb_build_object(
            'name', u.first_name || ' ' || u.last_name,
            'avatar', NULL  -- Add avatar field when available
          )
        )
      ), '[]'::jsonb)
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = p_user_id
        AND e.status = 'active'
        AND l.start_time > NOW()
        AND l.start_time < NOW() + INTERVAL '7 days'
        AND l.zoom_meeting_id IS NOT NULL
      ORDER BY l.start_time ASC
      LIMIT 5
    ),

    -- Pending Assignments
    'pending_assignments', (
      SELECT jsonb_build_object(
        'total_count', COUNT(*)::INTEGER,
        'urgent', COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'title', a.title,
            'description', a.description,
            'due_date', a.due_date,
            'max_score', a.max_score,
            'course', jsonb_build_object(
              'id', c.id,
              'title', c.title
            )
          )
        ) FILTER (WHERE a.due_date < NOW() + INTERVAL '3 days'), '[]'::jsonb)
      )
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
        AND s.user_id = p_user_id
      WHERE e.user_id = p_user_id
        AND e.status = 'active'
        AND a.due_date > NOW()
        AND s.id IS NULL  -- Not yet submitted
    ),

    -- Recent Activity
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'type', ae.event_type,
          'action', ae.action,
          'details', ae.details,
          'created_at', ae.created_at
        )
      ), '[]'::jsonb)
      FROM audit_events ae
      WHERE ae.user_id = p_user_id
        AND ae.event_category IN ('EDUCATION', 'STUDENT_RECORD', 'GRADE')
      ORDER BY ae.created_at DESC
      LIMIT 10
    ),

    -- Overall Statistics
    'stats', jsonb_build_object(
      'enrolled_count', (
        SELECT COUNT(*)::INTEGER
        FROM enrollments
        WHERE user_id = p_user_id
          AND status = 'active'
      ),
      'completed_count', (
        SELECT COUNT(*)::INTEGER
        FROM enrollments
        WHERE user_id = p_user_id
          AND status = 'completed'
      ),
      'certificates_count', (
        SELECT COUNT(*)::INTEGER
        FROM certificates
        WHERE user_id = p_user_id
      ),
      'overall_progress', (
        SELECT COALESCE(AVG(
          (SELECT AVG(up.progress_percentage)
           FROM user_progress up
           WHERE up.enrollment_id = e.id)
        ), 0)::INTEGER
        FROM enrollments e
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
      )
    ),

    -- Unread Announcements Count
    'unread_announcements_count', (
      SELECT COUNT(*)::INTEGER
      FROM announcements a
      WHERE a.is_published = true
        AND a.published_at <= NOW()
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
        -- Add logic for unread tracking when implemented
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_dashboard(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_dashboard IS
'Optimized function to fetch all dashboard data in a single query for performance';
```

### Step 6: Create Dashboard API Endpoint

**Create**: `src/app/api/user/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const GET = withAuth(async (
  request: NextRequest,
  user: any
) => {
  try {
    const supabase = await createClient();

    // Call optimized dashboard function
    const { data, error } = await supabase
      .rpc('get_user_dashboard', { p_user_id: user.id });

    if (error) {
      console.error('Dashboard query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }

    // Log dashboard access (low risk)
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'dashboard.accessed',
      details: {
        timestamp: new Date().toISOString(),
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['student', 'instructor']); // All non-admin users
```

### Step 7: Create Dashboard Hook

**Create**: `src/hooks/useDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  enrollments: any[];
  upcoming_sessions: any[];
  pending_assignments: {
    total_count: number;
    urgent: any[];
  };
  recent_activity: any[];
  stats: {
    enrolled_count: number;
    completed_count: number;
    certificates_count: number;
    overall_progress: number;
  };
  unread_announcements_count: number;
}

export function useDashboard() {
  return useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/user/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
  });
}
```

### Step 8: Create Dashboard Components

All dashboard components inherit theme via:
- Using existing Tailwind classes (`bg-background`, `text-foreground`, etc.)
- Using existing components (`Card`, `Button`, `Progress`)
- No custom colors or styles

#### Component files to create:

1. **`src/components/user/dashboard/WelcomeHero.tsx`** - See detailed code in implementation section
2. **`src/components/user/dashboard/StatsCards.tsx`** - See detailed code in implementation section
3. **`src/components/user/dashboard/ContinueLearning.tsx`** - See detailed code in implementation section
4. **`src/components/user/dashboard/UpcomingSessions.tsx`** - See detailed code in implementation section
5. **`src/components/user/dashboard/PendingAssignments.tsx`** - See detailed code in implementation section

### Step 9: Create Dashboard Page

**Create**: `src/app/(user)/dashboard/page.tsx`

```typescript
'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeHero } from '@/components/user/dashboard/WelcomeHero';
import { StatsCards } from '@/components/user/dashboard/StatsCards';
import { ContinueLearning } from '@/components/user/dashboard/ContinueLearning';
import { UpcomingSessions } from '@/components/user/dashboard/UpcomingSessions';
import { PendingAssignments } from '@/components/user/dashboard/PendingAssignments';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const {
    enrollments,
    upcoming_sessions,
    pending_assignments,
    stats,
    recent_activity
  } = data.data;

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Section */}
      <WelcomeHero stats={stats} />

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Continue Learning (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <ContinueLearning enrollments={enrollments} />
          <UpcomingSessions sessions={upcoming_sessions} />
        </div>

        {/* Right Column - Sidebar Widgets (1/3 width) */}
        <div className="space-y-6">
          <PendingAssignments assignments={pending_assignments} />
          {/* Future: Add Recent Activity widget */}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
```

### Step 10: Add Dashboard Translations

**Create**: `supabase/migrations/20250118_dashboard_translations.sql`

```sql
-- ============================================================================
-- USER DASHBOARD TRANSLATIONS
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- ========================================================================
    -- ENGLISH TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        -- Navigation
        ('en', 'user.nav.dashboard', 'Dashboard', 'user', v_tenant_id, 'navigation'),
        ('en', 'user.nav.learning', 'My Learning', 'user', v_tenant_id, 'navigation'),
        ('en', 'user.nav.calendar', 'Calendar', 'user', v_tenant_id, 'navigation'),
        ('en', 'user.nav.assignments', 'Assignments', 'user', v_tenant_id, 'navigation'),

        -- Dashboard
        ('en', 'user.dashboard.welcome', 'Welcome back', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.progress_summary', 'You''re making great progress', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.continue_learning', 'Continue Learning', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.view_certificates', 'View Certificates', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.check_grades', 'Check Grades', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.overall_progress', 'Overall Progress', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.this_week', 'This Week', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.achievements', 'Achievements', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.continue_where_left', 'Continue Where You Left Off', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.upcoming_sessions', 'Upcoming Live Sessions', 'user', v_tenant_id, 'dashboard'),
        ('en', 'user.dashboard.pending_assignments', 'Pending Assignments', 'user', v_tenant_id, 'dashboard'),

        -- Account
        ('en', 'user.account.my_account', 'My Account', 'user', v_tenant_id, 'account'),
        ('en', 'user.account.profile', 'Profile', 'user', v_tenant_id, 'account'),
        ('en', 'user.account.preferences', 'Preferences', 'user', v_tenant_id, 'account'),
        ('en', 'user.account.logout', 'Logout', 'user', v_tenant_id, 'account')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value;

    -- ========================================================================
    -- HEBREW TRANSLATIONS
    -- ========================================================================

    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
    VALUES
        -- Navigation
        ('he', 'user.nav.dashboard', 'לוח בקרה', 'user', v_tenant_id, 'navigation'),
        ('he', 'user.nav.learning', 'הלמידה שלי', 'user', v_tenant_id, 'navigation'),
        ('he', 'user.nav.calendar', 'יומן', 'user', v_tenant_id, 'navigation'),
        ('he', 'user.nav.assignments', 'מטלות', 'user', v_tenant_id, 'navigation'),

        -- Dashboard
        ('he', 'user.dashboard.welcome', 'ברוך שובך', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.progress_summary', 'אתה עושה התקדמות מצוינת', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.continue_learning', 'המשך ללמוד', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.view_certificates', 'צפה בתעודות', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.check_grades', 'בדוק ציונים', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.overall_progress', 'התקדמות כללית', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.this_week', 'השבוע', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.achievements', 'הישגים', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.continue_where_left', 'המשך מהמקום שבו הפסקת', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.upcoming_sessions', 'מפגשים קרובים', 'user', v_tenant_id, 'dashboard'),
        ('he', 'user.dashboard.pending_assignments', 'מטלות ממתינות', 'user', v_tenant_id, 'dashboard'),

        -- Account
        ('he', 'user.account.my_account', 'החשבון שלי', 'user', v_tenant_id, 'account'),
        ('he', 'user.account.profile', 'פרופיל', 'user', v_tenant_id, 'account'),
        ('he', 'user.account.preferences', 'העדפות', 'user', v_tenant_id, 'account'),
        ('he', 'user.account.logout', 'התנתק', 'user', v_tenant_id, 'account')
    ON CONFLICT (language_code, translation_key) DO UPDATE SET
        translation_value = EXCLUDED.translation_value;

    RAISE NOTICE 'Dashboard translations added successfully';

END $$;
```

---

## Theme Inheritance

### Critical: Use ONLY Existing Theme Variables

**DO NOT create custom colors!** All styles must use existing CSS variables from `globals.css`:

```css
/* Background Colors */
bg-background           /* Main background */
bg-card                /* Card backgrounds */
bg-muted              /* Muted backgrounds */
bg-accent             /* Accent/hover states */

/* Text Colors */
text-foreground               /* Primary text */
text-muted-foreground         /* Secondary text */
text-primary                  /* Brand color text */
text-destructive              /* Error/urgent text */

/* Border */
border                 /* Default border color */
border-input          /* Input borders */

/* Status Colors */
bg-destructive         /* Red - urgent/errors */
bg-success            /* Green - success (custom variable) */
bg-warning            /* Orange - warnings (custom variable) */
bg-info               /* Blue - info (custom variable) */

/* Interactive Elements */
bg-primary            /* Primary button */
bg-secondary          /* Secondary button */
hover:bg-accent       /* Hover state */
```

### Theme Provider Integration

The user portal automatically inherits:
1. **Color Scheme** - All theme colors from database
2. **Dark Mode** - Follows user preference
3. **Typography** - Heebo font (supports Hebrew + Latin)
4. **Spacing** - Consistent Tailwind spacing
5. **Border Radius** - Consistent rounding
6. **Shadows** - Consistent elevation

### RTL Support

All components must support RTL via:

```typescript
const { direction } = useContext(AppContext);
const isRtl = direction === 'rtl';

// Use conditional classes
<div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
<div className={isRtl ? 'text-right' : 'text-left'}>
```

---

## Performance Strategy

### 1. Data Fetching Optimization

**Single Query Approach**:
- Dashboard: 1 SQL function call (not 5 separate queries)
- Joins instead of N+1 queries
- JSONB aggregation for complex data

**React Query Caching**:
```typescript
staleTime: 5 * 60 * 1000      // Don't refetch for 5 minutes
cacheTime: 10 * 60 * 1000     // Keep in cache for 10 minutes
refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
```

### 2. Code Splitting

```typescript
// Lazy load heavy components
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <Skeleton className="h-[400px]" />,
  ssr: false,
});
```

### 3. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={course.image_url}
  alt={course.title}
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

### 4. Database Indexes

Required indexes for performance:
```sql
CREATE INDEX idx_user_progress_enrollment ON user_progress(enrollment_id);
CREATE INDEX idx_user_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_enrollments_user_active ON enrollments(user_id, status) WHERE status = 'active';
CREATE INDEX idx_lessons_upcoming ON lessons(start_time) WHERE start_time > NOW();
```

### 5. Audit Logging Performance

**Async Logging** (don't block responses):
```typescript
// Fire and forget
logAuditEvent(params).catch(err =>
  console.error('Audit log failed:', err)
);
```

**Batch Low-Risk Events**:
```typescript
// Buffer topic views, flush every 30 seconds
const progressBuffer = [];
if (progressBuffer.length >= 100) {
  await supabase.from('audit_events').insert(progressBuffer);
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: All interactive elements accessible via Tab
- **Focus Indicators**: Visible focus rings (2px outline)
- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **ARIA Labels**: All icons and buttons properly labeled
- **Screen Reader**: Tested with NVDA/JAWS
- **Skip Links**: "Skip to main content" link
- **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3)

### Implementation Checklist

```typescript
// Button with icon - ALWAYS add aria-label
<Button variant="ghost" size="icon" aria-label="Notifications">
  <Bell className="h-5 w-5" />
</Button>

// Link with icon - add descriptive text
<Link href="/dashboard" aria-label="Go to dashboard">
  <Home className="h-5 w-5" />
  <span className="sr-only">Dashboard</span>
</Link>

// Image - ALWAYS add alt text
<Image src={url} alt="Course thumbnail for React Fundamentals" />
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest
```

Test files:
- `src/hooks/__tests__/useDashboard.test.ts`
- `src/components/user/dashboard/__tests__/StatsCards.test.tsx`

### Integration Tests

Test flows:
1. Login → Dashboard → View enrollment → Resume course
2. Dashboard → Assignments → Submit assignment
3. Dashboard → Calendar → Join Zoom session

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

Test scenarios:
- Complete onboarding flow
- Complete assignment submission
- Join live session
- Download certificate

### Performance Tests

```bash
npm install -D lighthouse-ci
```

Targets:
- Performance Score: >90
- Accessibility Score: 100
- Best Practices: >90
- SEO: >90

---

## Timeline & Milestones

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 0: Bug Fix** | 1 hour | DocuSign dropdown fixed |
| **Phase 1: Dashboard** | 2 days | Dashboard fully functional |
| **Phase 2: My Learning** | 3 days | Programs, courses, course player |
| **Phase 3: Assignments** | 3 days | Assignment list, submission, grading |
| **Phase 4: Calendar** | 2 days | Calendar view, session management |
| **Phase 5: Community** | 2 days | Discussions, announcements |
| **Phase 6: Account** | 2 days | Profile, preferences, payments |
| **Testing & Polish** | 2 days | Bug fixes, accessibility, performance |
| **TOTAL** | **~17 days** | **Complete user portal** |

---

## Next Steps

1. ✅ Create this documentation file
2. Fix DocuSign dropdown bug (Phase 0)
3. Install dependencies (React Query, Recharts)
4. Create QueryProvider and update layout
5. Create UserLayout component
6. Create dashboard database function
7. Create dashboard API endpoint
8. Create dashboard components
9. Create dashboard page
10. Test dashboard thoroughly

---

## Support & Resources

- **Existing Documentation**: See `docs/CLAUDE_GUIDE.md`
- **Admin Implementation**: Reference `src/components/admin/AdminLayout.tsx`
- **Theme Configuration**: See `src/app/globals.css`
- **Database Schema**: See `supabase/migrations/*.sql`

---

**Last Updated**: January 18, 2025
**Status**: Ready for Implementation
**Next Action**: Fix DocuSign bug, then start Phase 1
