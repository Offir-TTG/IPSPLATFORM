'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { TabPagination } from './TabPagination';

interface Grade {
  id: string;
  points_earned: number | null;
  percentage: number | null;
  letter_grade: string | null;
  letter_color: string | null;
  status: string;
  is_excused: boolean;
  is_late: boolean;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string | null;
  grade_item: {
    id: string;
    name: string;
    max_points: number;
    course: { id: string; title: string } | null;
  } | null;
  grader: { id: string; first_name: string; last_name: string } | null;
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'graded') return 'default';
  if (s === 'late') return 'destructive';
  if (s === 'excused') return 'secondary';
  if (s === 'submitted') return 'outline';
  return 'outline';
}

const PAGE_SIZE = 20;

export function UserGradesTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const [grades, setGrades] = useState<Grade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/grades?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setGrades(d.grades ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  if (loading && grades.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
        </CardContent>
      </Card>
    );
  }
  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.grades.empty', 'No grades recorded.')}
        </CardContent>
      </Card>
    );
  }

  const renderScore = (g: Grade) => {
    const points = g.points_earned !== null
      ? `${g.points_earned} / ${g.grade_item?.max_points ?? '?'}`
      : '—';
    const pct = g.percentage !== null ? `${g.percentage}%` : '';
    return (
      <div className="text-end">
        <p className="font-medium text-sm tabular-nums whitespace-nowrap" dir="ltr">
          {points}
        </p>
        {pct && (
          <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">{pct}</p>
        )}
      </div>
    );
  };

  const renderLetter = (g: Grade) => {
    if (!g.letter_grade) return <span className="text-xs text-muted-foreground">—</span>;
    const colored = g.letter_color
      ? {
          backgroundColor: `${g.letter_color}1A`,
          borderColor: `${g.letter_color}66`,
          color: g.letter_color,
        }
      : undefined;
    return (
      <Badge
        variant="outline"
        className="font-semibold tabular-nums"
        style={colored}
        dir="ltr"
      >
        {g.letter_grade}
      </Badge>
    );
  };

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.grades.title', 'Grades')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.grades.count', '{{count}} grades').replace('{{count}}', String(total))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveTable>
            <ResponsiveTable.Desktop>
              <div className="overflow-x-auto" dir={direction}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.grades.col.item', 'Item')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.grades.col.course', 'Course')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.grades.col.status', 'Status')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.grades.col.graded', 'Graded')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.grades.col.letter', 'Letter')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                        {t('admin.users.activity.grades.col.score', 'Score')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="max-w-xs">
                          <p className="font-medium truncate" dir="auto" title={g.grade_item?.name ?? '—'}>
                            {g.grade_item?.name ?? '—'}
                          </p>
                          {g.feedback && (
                            <p className="text-xs text-muted-foreground italic truncate" dir="auto" title={g.feedback}>
                              {g.feedback}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <p className="truncate" dir="auto" title={g.grade_item?.course?.title ?? '—'}>
                            {g.grade_item?.course?.title ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(g.status)} className="text-[10px]">
                            {t(`admin.users.activity.values.gradeStatus.${g.status}`, g.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {g.graded_at ? new Date(g.graded_at).toLocaleDateString(dateLocale) : '—'}
                          {g.grader && (
                            <div className="text-[10px] truncate" dir="auto">
                              {g.grader.first_name} {g.grader.last_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{renderLetter(g)}</TableCell>
                        <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                          {renderScore(g)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {grades.map((g) => (
                <div key={g.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" dir="auto" title={g.grade_item?.name ?? '—'}>
                        {g.grade_item?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" dir="auto">
                        {g.grade_item?.course?.title ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderLetter(g)}
                      {renderScore(g)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusVariant(g.status)} className="text-[10px]">
                      {t(`admin.users.activity.values.gradeStatus.${g.status}`, g.status)}
                    </Badge>
                    {g.graded_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(g.graded_at).toLocaleDateString(dateLocale)}
                      </span>
                    )}
                    {g.grader && (
                      <span className="text-xs text-muted-foreground" dir="auto">
                        · {g.grader.first_name} {g.grader.last_name}
                      </span>
                    )}
                  </div>
                  {g.feedback && (
                    <p className="text-xs text-muted-foreground italic break-words" dir="auto">
                      {g.feedback}
                    </p>
                  )}
                </div>
              ))}
            </ResponsiveTable.Mobile>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <TabPagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        loading={loading}
      />
    </div>
  );
}
