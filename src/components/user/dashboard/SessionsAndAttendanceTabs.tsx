'use client';

import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
} from '@/components/ui/tabs';
import { UpcomingSessions } from './UpcomingSessions';
import { Attendance } from './Attendance';
import { Grades } from './Grades';
import { useUserLanguage } from '@/context/AppContext';
import type { UpcomingSession, AttendanceRecord, RecentGrade } from '@/hooks/useDashboard';

interface SessionsAndAttendanceTabsProps {
  sessions: UpcomingSession[];
  attendance: AttendanceRecord[];
  grades: RecentGrade[];
}

/**
 * Underline tabs + count badges (GitHub / Linear / Vercel). Uses the
 * shared `UnderlineTabsList` / `UnderlineTabsTrigger` / `TabCountBadge`
 * variants so the rest of the user portal can adopt the same pattern
 * without duplicating class strings.
 *
 * Mobile: only 3 short labels so no horizontal scroll is needed; the
 * tab strip fits on the narrowest phone. Card wrapper + `-mx/-px`
 * bleed makes the underline rail extend to the card edges.
 */
export function SessionsAndAttendanceTabs({
  sessions,
  attendance,
  grades,
}: SessionsAndAttendanceTabsProps) {
  const { t, direction } = useUserLanguage();

  return (
    <Card className="p-4 md:p-6">
      <Tabs defaultValue="sessions" className="w-full" dir={direction}>
        {/* `overflow-x-auto` on the bleed wrapper is mobile-safe: it
            only renders a scrollbar when the tabs actually exceed the
            viewport. With 3 short labels they fit even on the
            narrowest phone, so no scrollbar appears here. */}
        <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto">
          <UnderlineTabsList className="gap-6">
            <UnderlineTabsTrigger value="sessions">
              <span>{t('user.dashboard.sessions.title', 'Upcoming Sessions')}</span>
              <TabCountBadge n={sessions.length} />
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="attendance">
              <span>{t('user.dashboard.attendance.title', 'Attendance')}</span>
              <TabCountBadge n={attendance.length} />
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value="grades">
              <span>{t('user.dashboard.grades.title', 'Grades')}</span>
              <TabCountBadge n={grades.length} />
            </UnderlineTabsTrigger>
          </UnderlineTabsList>
        </div>

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
    </Card>
  );
}
