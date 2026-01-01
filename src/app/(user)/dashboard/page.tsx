'use client';
export const dynamic = 'force-dynamic';

import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeHero } from '@/components/user/dashboard/WelcomeHero';
import { StatsCards } from '@/components/user/dashboard/StatsCards';
import { ContinueLearning } from '@/components/user/dashboard/ContinueLearning';
import { SessionsAndAttendanceTabs } from '@/components/user/dashboard/SessionsAndAttendanceTabs';
import { ProgressOverview } from '@/components/user/dashboard/ProgressOverview';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useUserLanguage } from '@/context/AppContext';

export default function DashboardPage() {
  const { t } = useUserLanguage();
  const { data, isLoading, error, refetch } = useDashboard();
  const [userName, setUserName] = useState('there');

  useEffect(() => {
    async function loadUserName() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (userData) {
          if (userData.first_name && userData.last_name) {
            setUserName(`${userData.first_name} ${userData.last_name}`);
          } else if (userData.first_name) {
            setUserName(userData.first_name);
          }
        }
      }
    }

    loadUserName();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="space-y-6">
          {/* Hero Skeleton */}
          <Skeleton className="h-56 w-full rounded-2xl" />

          {/* Stats Skeleton */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">{t('user.dashboard.errorTitle', 'Error loading dashboard')}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{t('user.dashboard.errorMessage', 'Failed to load your dashboard data. Please try again.')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.dashboard.retry', 'Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate total lessons and hours from enrollments
  const totalLessons = data.enrollments?.reduce((sum, enrollment) => sum + (enrollment.total_lessons || 0), 0) || 0;

  // Calculate total hours from enrollments (if total_hours is available, otherwise estimate)
  let totalHours = data.enrollments?.reduce((sum, enrollment) => sum + (enrollment.total_hours || 0), 0) || 0;

  // If total_hours not available from DB, estimate from lessons (average 90 min per lesson)
  if (totalHours === 0 && totalLessons > 0) {
    totalHours = Math.round((totalLessons * 90) / 60 * 10) / 10; // Convert to hours, round to 1 decimal
  }

  const enhancedStats = {
    ...data.stats,
    total_lessons: totalLessons,
    total_hours_spent: totalHours > 0 ? totalHours : data.stats.total_hours_spent,
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-8 pb-12">
        {/* Welcome Hero */}
        <WelcomeHero userName={userName} stats={enhancedStats} />

        {/* Stats Cards */}
        <StatsCards stats={enhancedStats} />

        {/* Progress and Courses Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ProgressOverview stats={enhancedStats} />
          <div className="lg:col-span-2">
            <ContinueLearning />
          </div>
        </div>

        {/* Sessions and Attendance Tabs */}
        <div className="pt-4">
          <SessionsAndAttendanceTabs
            sessions={data.upcoming_sessions}
            attendance={data.recent_attendance}
          />
        </div>
      </div>
    </div>
  );
}
