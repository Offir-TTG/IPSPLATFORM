'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import { api, Empty, ErrorBox, errText, Loading, PageHeader, Pill, tf } from '@/components/admin/coaching/shared';

interface Coach {
  id: string;
  name: string;
  role: string;
  weekly_hours: number;
}

export default function CoachesPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ coaches: Coach[] }>('/api/admin/coaching/choices');
      setCoaches(data.coaches ?? []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <PageHeader
          title={t('admin.coaching.coaches.title', 'מטפלות ושעות')}
          description={t('admin.coaching.coaches.subtitle', 'לחיצה על מטפלת פותחת את שעות העבודה והחופשות שלה, לשימוש הצוות בקביעת מפגשים.')}
        />

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox t={t} message={error} onRetry={load} />
        ) : (
          <Card>
            <CardContent className="p-0">
              {coaches.length === 0 ? (
                <Empty>{t('admin.coaching.coaches.empty', 'אין עדיין מטפלות. מטפלת היא משתמשת עם תפקיד מדריך/ה. מוסיפים אותה בעמוד "משתמשים".')}</Empty>
              ) : (
                coaches.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/coaching/coaches/${c.id}`}
                    className="flex min-h-[64px] flex-wrap items-center gap-4 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{c.name}</div>
                      {c.weekly_hours > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {tf(t, 'admin.coaching.coaches.hours', '{hours} שעות פנויות בכל שבוע', { hours: c.weekly_hours })}
                        </div>
                      )}
                    </div>
                    {c.weekly_hours <= 0 && <Pill tone="amber">{t('admin.coaching.coaches.noHours', 'עוד לא הוגדרו שעות')}</Pill>}
                    <Chevron className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
