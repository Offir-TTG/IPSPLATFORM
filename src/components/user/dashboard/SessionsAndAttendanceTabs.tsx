'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpcomingSessions } from './UpcomingSessions';
import { Attendance } from './Attendance';
import { Grades } from './Grades';
import { Calendar, CalendarCheck, Award } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import type { UpcomingSession, AttendanceRecord, RecentGrade } from '@/hooks/useDashboard';

interface SessionsAndAttendanceTabsProps {
  sessions: UpcomingSession[];
  attendance: AttendanceRecord[];
  grades: RecentGrade[];
}

export function SessionsAndAttendanceTabs({
  sessions,
  attendance,
  grades,
}: SessionsAndAttendanceTabsProps) {
  const { t } = useUserLanguage();

  return (
    <Tabs defaultValue="sessions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sessions" className="gap-2">
          <Calendar className="h-4 w-4" />
          {t('user.dashboard.sessions.title', 'Upcoming Sessions')}
        </TabsTrigger>
        <TabsTrigger value="attendance" className="gap-2">
          <CalendarCheck className="h-4 w-4" />
          {t('user.dashboard.attendance.title', 'Attendance')}
        </TabsTrigger>
        <TabsTrigger value="grades" className="gap-2">
          <Award className="h-4 w-4" />
          {t('user.dashboard.grades.title', 'Grades')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sessions" className="mt-6">
        <UpcomingSessions sessions={sessions} />
      </TabsContent>

      <TabsContent value="attendance" className="mt-6">
        <Attendance attendance={attendance} />
      </TabsContent>

      <TabsContent value="grades" className="mt-6">
        <Grades grades={grades} />
      </TabsContent>
    </Tabs>
  );
}
