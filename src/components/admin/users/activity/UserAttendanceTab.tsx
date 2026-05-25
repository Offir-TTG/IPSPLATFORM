'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

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
  if (s === 'present') return <Badge variant="default">{label}</Badge>;
  if (s === 'absent') return <Badge variant="destructive">{label}</Badge>;
  if (s === 'late') return <Badge variant="outline">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

export function UserAttendanceTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/attendance`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (!cancelled) {
          setSummaries(d.summaries ?? []);
          setRecords(d.records ?? []);
        }
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
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

  if (records.length === 0) {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {summaries.map((s) => (
          <Card key={s.course_id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium break-words flex-1">{s.course_title || s.course_id.slice(0, 8)}</p>
                <Badge variant={s.rate !== null && s.rate < 80 ? 'destructive' : 'default'}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {records.length} {t('admin.users.activity.attendance.empty', 'records').toLowerCase().replace('.', '')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 p-3 border rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words text-sm">{r.course?.title ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.attendance_date).toLocaleDateString()}
                  {r.notes && ` · ${r.notes}`}
                </p>
              </div>
              {statusBadge(r.status, lbl[r.status])}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
