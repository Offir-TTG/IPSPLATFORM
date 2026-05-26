'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { RecentGrade } from '@/hooks/useDashboard';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';

interface GradesProps {
  grades: RecentGrade[];
}

export function Grades({ grades }: GradesProps) {
  const { t, language } = useUserLanguage();
  const locale = language === 'he' ? he : undefined;

  if (!grades || grades.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('user.dashboard.grades.title', 'Grades')}</h2>
        </div>
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-amber-500/10 to-pink-500/10 p-6">
              <Award className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t('user.dashboard.grades.noRecords', 'No grades yet')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('user.dashboard.grades.checkLater', 'Your grades will appear here once instructors post them')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('user.dashboard.grades.title', 'Grades')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {grades.length}{' '}
            {grades.length === 1
              ? t('user.dashboard.grades.record', 'graded item')
              : t('user.dashboard.grades.records', 'graded items')}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {grades.slice(0, 5).map((g) => {
          const graded = g.graded_at ? parseISO(g.graded_at) : null;
          // Percentage + letter come from the DB. Don't recompute or
          // derive a letter from a hardcoded 90/80/70/60 scale —
          // tenants can configure their own grading_scale and the
          // backfill writes letter_grade against that.
          const pct = g.percentage != null ? Number(g.percentage) : null;
          const isGraded = g.status === 'graded' && pct !== null;
          const statusColor = g.is_excused
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            : !isGraded
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
          const StatusIcon = g.is_excused
            ? AlertCircle
            : !isGraded
              ? Clock
              : CheckCircle;

          const inner = (
            <div className="flex items-center gap-3 p-4">
              {/* Letter box — colored using the grade range's
                  configured color_code (shipped by the API as
                  letter_color). No hardcoded thresholds; the box
                  falls back to the primary gradient only when the
                  row has no letter (e.g. excused or not graded). */}
              <div className="flex-shrink-0">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center border ${
                    g.letter_grade
                      ? ''
                      : 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/10'
                  }`}
                  style={
                    g.letter_grade && g.letter_color
                      ? {
                          backgroundColor: `${g.letter_color}1A`, // ~10% alpha
                          borderColor: `${g.letter_color}66`,     // ~40% alpha
                          color: g.letter_color,
                        }
                      : undefined
                  }
                  dir="ltr"
                >
                  {g.letter_grade ? (
                    <span className="text-2xl font-bold leading-none tabular-nums">
                      {g.letter_grade}
                    </span>
                  ) : (
                    <Award className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Middle: title + one folded meta line (course, category,
                  points, graded date) so the card stays two lines tall. */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1" dir="auto">
                  {g.grade_item_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                  <span className="line-clamp-1" dir="auto">{g.course_name}</span>
                  {g.category_name && (
                    <span className="inline-flex items-center gap-1 shrink-0" dir="auto">
                      <span aria-hidden="true">·</span>
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: g.category_color || 'currentColor' }}
                      />
                      {g.category_name}
                    </span>
                  )}
                  {g.points_earned != null && g.max_points != null && (
                    <span className="tabular-nums shrink-0" dir="ltr">
                      · {Number(g.points_earned)} / {Number(g.max_points)}
                    </span>
                  )}
                  {graded && (
                    <span className="shrink-0" dir="auto">· {format(graded, 'MMM d', { locale })}</span>
                  )}
                </div>
              </div>

              {/* Status badge — far-right, status-colored, mirrors the
                  Attendance card layout. Just the status icon + label;
                  the letter lives in the score box on the other end. */}
              <div className="flex-shrink-0">
                <Badge className={`flex items-center gap-1.5 ${statusColor} border`}>
                  <StatusIcon className="h-3 w-3" />
                  {g.is_excused
                    ? t('user.dashboard.grades.status.excused', 'Excused')
                    : t(
                        `user.dashboard.grades.status.${g.status ?? 'unknown'}`,
                        g.status ?? '—',
                      )}
                </Badge>
              </div>
            </div>
          );

          return (
            <Card
              key={g.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/20"
            >
              {g.course_id ? (
                <Link href={`/courses/${g.course_id}/grades`} className="block cursor-pointer">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </Card>
          );
        })}
      </div>

      {grades.length > 5 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/learning">
              {t('user.dashboard.grades.viewAll', 'View all grades')}
              <span className="text-lg ms-1">→</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
