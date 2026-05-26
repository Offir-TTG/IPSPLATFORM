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

interface CourseSummary {
  course_id: string;
  course_title: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number | null;
}

interface AttendanceRecord {
  id: string;
  course_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  course: { id: string; title: string } | null;
}

function statusBadge(s: string, label: string) {
  if (s === 'present') return <Badge variant="default" className="text-[10px]">{label}</Badge>;
  if (s === 'absent') return <Badge variant="destructive" className="text-[10px]">{label}</Badge>;
  if (s === 'late') return <Badge variant="outline" className="text-[10px]">{label}</Badge>;
  return <Badge variant="secondary" className="text-[10px]">{label}</Badge>;
}

const PAGE_SIZE = 20;

export function UserAttendanceTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/attendance?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setSummaries(d.summaries ?? []);
        setRecords(d.records?.rows ?? []);
        setTotal(d.records?.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  if (loading && records.length === 0) {
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
          {t('admin.users.activity.attendance.empty', 'No attendance records.')}
        </CardContent>
      </Card>
    );
  }

  const lbl = {
    present: t('admin.users.activity.attendance.present', 'Present'),
    absent: t('admin.users.activity.attendance.absent', 'Absent'),
    late: t('admin.users.activity.attendance.late', 'Late'),
    excused: t('admin.users.activity.attendance.excused', 'Excused'),
  } as const;

  return (
    <div className="space-y-6" dir={direction}>
      {/* Per-course summary cards — top section. Computed server-side
          over the user's full attendance history so the percentage
          stays correct regardless of which records page is open. */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summaries.map((s) => (
            <Card key={s.course_id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium break-words flex-1" dir="auto">
                    {s.course_title || s.course_id.slice(0, 8)}
                  </p>
                  <Badge
                    variant={s.rate !== null && s.rate < 80 ? 'destructive' : 'default'}
                    dir="ltr"
                  >
                    {s.rate !== null ? `${s.rate}%` : '—'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span>{lbl.present}: {s.present}</span>
                  <span>{lbl.absent}: {s.absent}</span>
                  <span>{lbl.late}: {s.late}</span>
                  <span>{lbl.excused}: {s.excused}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Records table — paginated detail view. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.attendance.title', 'Attendance records')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.attendance.count', '{{count}} records').replace('{{count}}', String(total))}
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
                        {t('admin.users.activity.attendance.col.date', 'Date')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.attendance.col.course', 'Course')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.attendance.col.status', 'Status')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.attendance.col.notes', 'Notes')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.attendance_date).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-medium truncate text-sm" dir="auto" title={r.course?.title ?? '—'}>
                            {r.course?.title ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell>{statusBadge(r.status, lbl[r.status])}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md">
                          <p className="truncate" dir="auto" title={r.notes ?? ''}>
                            {r.notes ?? '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {records.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm" dir="auto" title={r.course?.title ?? '—'}>
                        {r.course?.title ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.attendance_date).toLocaleDateString(dateLocale)}
                      </p>
                    </div>
                    {statusBadge(r.status, lbl[r.status])}
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground break-words" dir="auto">
                      {r.notes}
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
