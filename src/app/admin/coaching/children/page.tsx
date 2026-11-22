'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import { api, childLabel, Empty, ErrorBox, errText, fmtDateTime, inputCls, Loading, PageHeader, Pill, tf } from '@/components/admin/coaching/shared';

interface Pack {
  enrollment_id: string;
  status: string;
  child_name: string | null;
  child_age: number | null;
  waiting_for_parent_signup: boolean;
  parent_name: string | null;
  coach_name: string | null;
  product_title: string | null;
  sessions_total: number | null;
  sessions_used: number;
  sessions_to_mark: number;
  next_session_at: string | null;
}

export default function CoachingChildrenPage() {
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ packs: Pack[] }>('/api/admin/coaching/packs');
      setPacks(data.packs ?? []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return packs;
    return packs.filter((p) => [p.child_name, p.parent_name, p.coach_name, p.product_title].some((v) => (v || '').toLowerCase().includes(s)));
  }, [packs, q]);

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <PageHeader
          title={t('admin.coaching.children.title', 'ילדים באימון')}
          description={t('admin.coaching.children.subtitle', 'כל חבילות האימון. לחיצה על ילד פותחת את המפגשים, השאלון והתשלומים שלו.')}
          action={
            <Button asChild className="h-11">
              <Link href="/admin/coaching/new">
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t('admin.coaching.children.newPack', 'פתיחת חבילה')}
              </Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="pt-6">
            <Input
              type="search"
              className={inputCls}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.coaching.children.search', 'חיפוש לפי ילד, הורה או מטפלת')}
              aria-label={t('admin.coaching.children.search', 'חיפוש לפי ילד, הורה או מטפלת')}
            />
          </CardContent>
        </Card>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox t={t} message={error} onRetry={load} />
        ) : (
          <Card>
            <CardContent className="p-0">
              {shown.length === 0 ? (
                <Empty>
                  {packs.length === 0
                    ? t('admin.coaching.children.empty', 'עוד אין ילדים באימון. פותחים חבילה מתוך בקשת אימון או בכפתור "פתיחת חבילה".')
                    : t('admin.coaching.children.noMatch', 'לא נמצא ילד שמתאים לחיפוש.')}
                </Empty>
              ) : (
                shown.map((p) => (
                  <Link
                    key={p.enrollment_id}
                    href={`/admin/coaching/children/${p.enrollment_id}`}
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-[1_1_240px] space-y-0.5">
                      <div className="font-semibold">{childLabel(t, p.child_name, p.child_age)}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('admin.coaching.requests.parent', 'ההורה:')} {p.parent_name || '—'}
                        {p.coach_name ? ` · ${t('admin.coaching.children.coach', 'מטפלת:')} ${p.coach_name}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">{p.product_title}</div>
                    </div>
                    <div className="space-y-0.5 text-sm">
                      <div>
                        {tf(t, 'admin.coaching.children.used', '{used} מתוך {total} מפגשים נוצלו', {
                          used: p.sessions_used,
                          total: p.sessions_total ?? '?',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.next_session_at
                          ? tf(t, 'admin.coaching.children.next', 'המפגש הבא: {when}', { when: fmtDateTime(p.next_session_at, language) })
                          : t('admin.coaching.children.noNext', 'אין מפגש קרוב')}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.waiting_for_parent_signup && <Pill tone="amber">{t('admin.coaching.children.waitingSignup', 'מחכה שההורה יירשם')}</Pill>}
                      {p.sessions_to_mark > 0 && <Pill tone="amber">{tf(t, 'admin.coaching.children.toMark', '{n} מפגשים צריך לסמן', { n: p.sessions_to_mark })}</Pill>}
                      {p.status === 'draft' && <Pill>{t('admin.coaching.children.statusDraft', 'עוד לא הושלמה הרשמה')}</Pill>}
                      {p.status === 'completed' && <Pill tone="green">{t('admin.coaching.children.statusCompleted', 'הסתיימה')}</Pill>}
                      {p.status === 'suspended' && <Pill tone="red">{t('admin.coaching.children.statusSuspended', 'מושהית')}</Pill>}
                      <Chevron className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
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
