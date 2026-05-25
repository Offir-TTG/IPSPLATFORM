'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface Grade {
  id: string;
  points_earned: number | null;
  percentage: number | null;
  letter_grade: string | null;
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

export function UserGradesTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/grades`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => { if (!cancelled) setGrades(d.grades ?? []); })
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

  if (grades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.grades.empty', 'No grades recorded.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {grades.map((g) => (
        <Card key={g.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{g.grade_item?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {g.grade_item?.course?.title ?? '—'}
                  {g.grader && ` · ${t('admin.users.activity.grades.gradedBy', 'Graded by')} ${g.grader.first_name} ${g.grader.last_name}`}
                  {g.graded_at && ` · ${new Date(g.graded_at).toLocaleDateString()}`}
                </p>
                {g.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 italic break-words">
                    {t('admin.users.activity.grades.feedback', 'Feedback')}: {g.feedback}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(g.status)}>
                  {t(`admin.users.activity.values.gradeStatus.${g.status}`, g.status)}
                </Badge>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {g.points_earned !== null ? `${g.points_earned} / ${g.grade_item?.max_points ?? '?'}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.percentage !== null ? `${g.percentage}%` : ''}
                    {g.letter_grade && ` · ${g.letter_grade}`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
