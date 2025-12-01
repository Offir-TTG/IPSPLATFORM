'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeHero } from '@/components/user/dashboard/WelcomeHero';
import { StatsCards } from '@/components/user/dashboard/StatsCards';
import { ContinueLearning } from '@/components/user/dashboard/ContinueLearning';
import { UpcomingSessions } from '@/components/user/dashboard/UpcomingSessions';
import { PendingAssignments } from '@/components/user/dashboard/PendingAssignments';
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

  return (
    <div className="min-h-screen">
      <div className="space-y-8 pb-12">
        {/* Welcome Hero */}
        <WelcomeHero userName={userName} stats={data.stats} />

        {/* Stats Cards */}
        <StatsCards stats={data.stats} />

        {/* Main Content */}
        <ContinueLearning enrollments={data.enrollments} />

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingSessions sessions={data.upcoming_sessions} />
          <PendingAssignments assignments={data.pending_assignments} />
        </div>
      </div>
    </div>
  );
}
