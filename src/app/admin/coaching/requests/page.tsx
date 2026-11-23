'use client';

export const dynamic = 'force-dynamic';

/**
 * Coaching requests from the portal (approved mockup "2 · בקשות"): coaching
 * for another child, or more sessions on a package. "Open a package from the
 * request" fills in the service, client and child; "Offer more sessions"
 * opens the add-sessions panel. Either marks the request handled.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HeartHandshake, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { kitButton, PageTitle, QuickPills, ListSkeleton, ListState } from '@/components/admin/notifications/kit';
import { CoachingHeader } from '@/components/admin/coaching/CoachingTabs';
import { AddSessionsSheet } from '@/components/admin/coaching/PackageDrawer';
import { api, Btn, childLabel, errText, fmtSent, tf } from '@/components/admin/coaching/shared';
import { KIND_MARK, kindName } from '@/components/admin/coaching/packageText';

type Status = 'new' | 'in_progress' | 'handled';

interface CoachingRequest {
  id: string;
  status: Status;
  kind: 'child' | 'more_sessions';
  sessions_requested: number | null;
  pack: { enrollment_id: string; kind: 'parent' | 'child'; title: string; used: number; total: number; coach_name: string | null } | null;
  parent_has: { parent_coaching: boolean; children: string[] };
  note: string | null;
  created_at: string;
  parent: { id: string; name: string; email: string; phone: string | null } | null;
  child: { id: string; name: string; age: number | null } | null;
  has_active_pack: boolean;
}

export default function CoachingRequestsPage() {
  const { t, direction, language } = useAdminLanguage();
  const [tab, setTab] = useState<Status>('new');
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [counts, setCounts] = useState<{ new: number; in_progress: number }>({ new: 0, in_progress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [offerFor, setOfferFor] = useState<CoachingRequest | null>(null);

  const load = useCallback(async (status: Status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ counts: { new: number; in_progress: number }; requests: CoachingRequest[] }>(`/api/admin/coaching/requests?status=${status}`);
      setRequests(data.requests ?? []);
      setCounts(data.counts ?? { new: 0, in_progress: 0 });
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
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

  /** "From Dana Cohen (already in parent coaching, and Noa in child coaching) · 2 hours ago" */
  const fromLine = (r: CoachingRequest) => {
    const who = r.parent?.name || r.parent?.email || t('admin.coaching.common.unknown', 'לא ידוע');
    const has: string[] = [];
    if (r.parent_has.parent_coaching) has.push(t('admin.coaching.requests.hasParent', 'כבר בליווי הורי'));
    const kids = r.parent_has.children.filter((n) => !r.child || !r.child.name.startsWith(n));
    if (kids.length) has.push(tf(t, 'admin.coaching.requests.hasChildren', '{names} בליווי ילד', { names: kids.join(', ') }));
    return [tf(t, 'admin.coaching.requests.from', 'מאת {who}', { who }) + (has.length ? ` (${has.join(', ')})` : ''), fmtSent(r.created_at, t, language)].join(' · ');
  };

  const packLine = (r: CoachingRequest) =>
    r.pack
      ? [
          kindName(t, r.pack.kind),
          tf(t, 'admin.coaching.requests.used', '{used} מתוך {total} מפגשים נוצלו', { used: r.pack.used, total: r.pack.total }),
          r.pack.coach_name ? tf(t, 'admin.coaching.requests.coach', 'מאמן/ת: {name}', { name: r.pack.coach_name }) : null,
          fmtSent(r.created_at, t, language),
        ]
          .filter(Boolean)
          .join(' · ')
      : fromLine(r);

  const statusChip = (s: Status) =>
    s === 'new'
      ? { text: t('admin.coaching.requests.chipNew', 'חדשה'), cls: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' }
      : s === 'in_progress'
        ? { text: t('admin.coaching.requests.chipInProgress', 'בטיפול'), cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' }
        : { text: t('admin.coaching.requests.chipHandled', 'טופלה'), cls: 'bg-muted text-foreground/70' };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <CoachingHeader description={t('admin.coaching.requests.subtitle2', 'בקשות שהגיעו מהפורטל: ילד נוסף, או מפגשים נוספים בחבילה.')} />

        <div className="max-w-full overflow-x-auto pb-0.5">
          <QuickPills
            label={t('admin.coaching.requests.filterLabel', 'סינון לפי מצב')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'new', label: t('admin.coaching.requests.tabNew', 'חדשות'), count: counts.new },
              { value: 'in_progress', label: t('admin.coaching.requests.tabInProgress', 'בטיפול'), count: counts.in_progress },
              { value: 'handled', label: t('admin.coaching.requests.tabHandled', 'טופלו') },
            ]}
          />
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ListSkeleton rows={3} />
          </div>
        ) : error ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ListState icon={HeartHandshake} tone="red" title={t('admin.coaching.common.loadError', 'לא הצלחנו לטעון את המידע')} text={error} action={<Btn onClick={() => load(tab)}>{t('admin.coaching.common.retry', 'לנסות שוב')}</Btn>} />
          </div>
        ) : requests.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ListState
              icon={HeartHandshake}
              tone="grey"
              title={
                tab === 'new'
                  ? t('admin.coaching.requests.emptyNew2', 'אין בקשות חדשות כרגע')
                  : tab === 'in_progress'
                    ? t('admin.coaching.requests.emptyInProgress', 'אין בקשות בטיפול.')
                    : t('admin.coaching.requests.emptyHandled', 'עוד אין בקשות שטופלו.')
              }
              text={tab === 'new' ? t('admin.coaching.requests.emptyNewText', 'כשלקוח יבקש ליווי לילד נוסף או מפגשים נוספים מהפורטל, הבקשה תופיע כאן.') : undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => {
              const more = r.kind === 'more_sessions';
              const markKind = more ? r.pack?.kind ?? 'parent' : 'child';
              const chip = statusChip(r.status);
              const title = more
                ? tf(t, 'admin.coaching.requests.titleMore', 'מפגשים נוספים · {name}', { name: r.pack?.kind === 'child' && r.child ? r.child.name : r.parent?.name ?? '' })
                : tf(t, 'admin.coaching.requests.titleChild', 'ליווי לילד נוסף · {child}', { child: r.child ? childLabel(t, r.child.name, r.child.age) : r.parent?.name ?? '' });
              return (
                <article key={r.id} className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-border bg-card p-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${KIND_MARK[markKind].cls}`} aria-hidden>
                    {t(KIND_MARK[markKind].key, KIND_MARK[markKind].fallback)}
                  </span>
                  <div className="min-w-0 flex-[1_1_360px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-base">{title}</b>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${chip.cls}`}>{chip.text}</span>
                    </div>
                    <div className="mt-0.5 text-[13.5px] text-muted-foreground">{more ? packLine(r) : fromLine(r)}</div>
                    {(more || r.note) && (
                      <div className="mt-2 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                        {more && r.sessions_requested
                          ? tf(t, 'admin.coaching.requests.askedSessions', 'ביקש/ה {n} מפגשים נוספים באותה חבילה.', { n: r.sessions_requested })
                          : null}
                        {more && r.sessions_requested && r.note ? ' ' : null}
                        {r.note ? `"${r.note}"` : null}
                        {more && !r.sessions_requested && !r.note ? t('admin.coaching.requests.askedMore', 'ביקש/ה מפגשים נוספים באותה חבילה.') : null}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status !== 'handled' &&
                      (more && r.pack ? (
                        <Btn tone="primary" onClick={() => setOfferFor(r)}>
                          {t('admin.coaching.requests.offerMore', 'הצעת מפגשים נוספים')}
                        </Btn>
                      ) : (
                        <Link href={`/admin/coaching/new?request=${r.id}`} className={kitButton.primary}>
                          {t('admin.coaching.requests.openFromRequest', 'פתיחת חבילה מהבקשה')}
                        </Link>
                      ))}
                    {r.status === 'new' && (
                      <Btn busy={busyId === r.id} onClick={() => setStatus(r.id, 'in_progress')}>
                        {t('admin.coaching.requests.inProgressBtn', 'בטיפול')}
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
              );
            })}
          </div>
        )}

        <p className="m-0 text-[13.5px] text-muted-foreground">
          {t('admin.coaching.requests.footNote', '"פתיחת חבילה מהבקשה" ממלאת מראש את השירות, הלקוח והילד; נשאר רק לבחור חבילה ולשלוח. הבקשה עוברת ל"טופלו" לבד.')}
        </p>
      </div>

      <AddSessionsSheet
        enrollmentId={offerFor?.pack?.enrollment_id ?? null}
        requestId={offerFor?.id}
        defaultSessions={offerFor?.sessions_requested}
        onClose={() => setOfferFor(null)}
        onDone={() => load(tab)}
      />
    </AdminLayout>
  );
}
