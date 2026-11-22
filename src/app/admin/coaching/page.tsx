'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import { api, Btn, childLabel, Empty, ErrorBox, errText, fmtSent, Loading, PageHeader, Pill, tf } from '@/components/admin/coaching/shared';

type Status = 'new' | 'in_progress' | 'handled';

interface CoachingRequest {
  id: string;
  status: Status;
  note: string | null;
  created_at: string;
  parent: { id: string; name: string; email: string; phone: string | null } | null;
  child: { id: string; name: string; age: number | null } | null;
  has_active_pack: boolean;
}

export default function CoachingRequestsPage() {
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [tab, setTab] = useState<Status>('new');
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [counts, setCounts] = useState<{ new: number; in_progress: number }>({ new: 0, in_progress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: Status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ counts: { new: number; in_progress: number }; requests: CoachingRequest[] }>(
        `/api/admin/coaching/requests?status=${status}`,
      );
      setRequests(data.requests ?? []);
      setCounts(data.counts ?? { new: 0, in_progress: 0 });
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const setStatus = async (id: string, status: Status) => {
    setBusyId(id);
    try {
      await api(`/api/admin/coaching/requests/${id}`, { method: 'PATCH', body: { status } });
      toast.success(
        status === 'in_progress'
          ? t('admin.coaching.requests.movedInProgress', 'הבקשה עברה ל"בטיפול"')
          : status === 'handled'
            ? t('admin.coaching.requests.movedHandled', 'הבקשה סומנה כטופלה')
            : t('admin.coaching.requests.movedNew', 'הבקשה הוחזרה ל"חדשות"'),
      );
      await load(tab);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Status; label: string; count?: number }[] = [
    { key: 'new', label: t('admin.coaching.requests.tabNew', 'חדשות'), count: counts.new },
    { key: 'in_progress', label: t('admin.coaching.requests.tabInProgress', 'בטיפול'), count: counts.in_progress },
    { key: 'handled', label: t('admin.coaching.requests.tabHandled', 'טופלו') },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <PageHeader
          title={t('admin.coaching.requests.title', 'בקשות אימון')}
          description={t(
            'admin.coaching.requests.subtitle',
            'הורים שביקשו אימון לילד מהפורטל. פותחים חבילה, משבצים מטפלת, והבקשה מסומנת כטופלה.',
          )}
          action={
            <Button asChild className="h-11">
              <Link href="/admin/coaching/new">
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t('admin.coaching.children.newPack', 'פתיחת חבילה')}
              </Link>
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div role="tablist" aria-label={t('admin.coaching.requests.filterLabel', 'סינון לפי מצב')} className="flex flex-wrap gap-2">
              {tabs.map((x) => (
                <Button
                  key={x.key}
                  role="tab"
                  aria-selected={tab === x.key}
                  variant={tab === x.key ? 'default' : 'outline'}
                  className="h-11"
                  onClick={() => setTab(x.key)}
                >
                  {x.label}
                  {x.count !== undefined ? ` · ${x.count}` : ''}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox t={t} message={error} onRetry={() => load(tab)} />
        ) : (
          <Card>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <Empty>
                  {tab === 'new'
                    ? t('admin.coaching.requests.emptyNew', 'אין בקשות חדשות כרגע. כשהורה יבקש אימון מהפורטל, הבקשה תופיע כאן.')
                    : tab === 'in_progress'
                      ? t('admin.coaching.requests.emptyInProgress', 'אין בקשות בטיפול.')
                      : t('admin.coaching.requests.emptyHandled', 'עוד אין בקשות שטופלו.')}
                </Empty>
              ) : (
                requests.map((r) => (
                  <article key={r.id} className="flex flex-wrap items-center gap-4 border-b p-4 last:border-b-0">
                    <div className="min-w-0 flex-[1_1_320px] space-y-1.5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-semibold">{childLabel(t, r.child?.name, r.child?.age)}</span>
                        <span className="text-sm text-muted-foreground">
                          {t('admin.coaching.requests.parent', 'ההורה:')} {r.parent?.name || r.parent?.email || t('admin.coaching.common.unknown', 'לא ידוע')}
                          {r.parent?.phone ? ` · ${r.parent.phone}` : ''}
                        </span>
                        {r.has_active_pack && <Pill tone="amber">{t('admin.coaching.requests.hasActivePack', 'כבר יש חבילה פעילה (בקשה לחבילה נוספת)')}</Pill>}
                      </div>
                      {r.note ? (
                        <p className="whitespace-pre-line text-sm leading-relaxed">&quot;{r.note}&quot;</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">{t('admin.coaching.requests.noNote', 'ללא הערה')}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {tf(t, 'admin.coaching.requests.sent', 'נשלחה {when}', { when: fmtSent(r.created_at, t, language) })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status !== 'handled' && (
                        <Button asChild className="h-11">
                          <Link href={`/admin/coaching/new?request=${r.id}`}>{t('admin.coaching.requests.openPack', 'פתיחת חבילה')}</Link>
                        </Button>
                      )}
                      {r.status === 'new' && (
                        <Btn busy={busyId === r.id} onClick={() => setStatus(r.id, 'in_progress')}>
                          {t('admin.coaching.requests.markInProgress', 'סימון "בטיפול"')}
                        </Btn>
                      )}
                      {r.status === 'in_progress' && (
                        <>
                          <Btn busy={busyId === r.id} onClick={() => setStatus(r.id, 'handled')}>
                            {t('admin.coaching.requests.markHandled', 'סימון כטופל')}
                          </Btn>
                          <Btn tone="ghost" disabled={busyId === r.id} onClick={() => setStatus(r.id, 'new')}>
                            {t('admin.coaching.requests.backToNew', 'החזרה לחדשות')}
                          </Btn>
                        </>
                      )}
                      {r.status === 'handled' && (
                        <Btn busy={busyId === r.id} onClick={() => setStatus(r.id, 'new')}>
                          {t('admin.coaching.requests.reopen', 'פתיחה מחדש')}
                        </Btn>
                      )}
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
