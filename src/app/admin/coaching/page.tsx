'use client';

export const dynamic = 'force-dynamic';

/**
 * Coaching: every package (parent coaching and child coaching) in one list,
 * as in the approved mockup "1 · חבילות ליווי". Four numbers on top, search,
 * service and state filters, and a row opens the package drawer.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, HeartHandshake, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { ListFooter, ListPanel, ListSearch, ListSkeleton, ListState, PageTitle, QuickPills, usePagedList } from '@/components/admin/notifications/kit';
import { CoachingHeader } from '@/components/admin/coaching/CoachingTabs';
import { PackageDrawer } from '@/components/admin/coaching/PackageDrawer';
import { api, errText, tf } from '@/components/admin/coaching/shared';
import { KIND_MARK, isWaiting, paymentText, perSession, statusName, statusStyle, whoName, whoSub, type PackageRow } from '@/components/admin/coaching/packageText';

type Service = 'all' | 'parent' | 'child';
type State = 'active' | 'waiting' | 'ended';
interface Stats {
  active: number;
  waiting: number;
  almost_done: number;
  failed: number;
}

const COLS = 'minmax(0,1.6fr) minmax(0,1.2fr) minmax(0,0.9fr) minmax(150px,0.9fr) minmax(0,0.8fr) minmax(0,0.9fr)';

function PackagesInner() {
  const { t, direction, language } = useAdminLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, waiting: 0, almost_done: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [service, setService] = useState<Service>('all');
  const [state, setState] = useState<State>('active');
  const openId = params.get('package');
  const openIdRef = useRef(openId);
  openIdRef.current = openId;
  // The filter is chosen once, on the first load (so a new package is in view).
  const picked = useRef(false);
  const Chevron = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ packages: PackageRow[]; stats: Stats }>('/api/admin/coaching/packages');
      const list = data.packages ?? [];
      setRows(list);
      if (!picked.current) {
        picked.current = true;
        const opened = openIdRef.current ? list.find((r) => r.enrollment_id === openIdRef.current) : null;
        const first: State = opened
          ? opened.status === 'active' ? 'active' : isWaiting(opened.status) ? 'waiting' : 'ended'
          : list.some((r) => r.status === 'active') ? 'active' : list.some((r) => isWaiting(r.status)) ? 'waiting' : 'active';
        setState(first);
      }
      setStats(data.stats ?? { active: 0, waiting: 0, almost_done: 0, failed: 0 });
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setOpen = (id: string | null) => router.replace(id ? `/admin/coaching?package=${id}` : '/admin/coaching', { scroll: false });

  const stateOf = (r: PackageRow): State => (r.status === 'active' ? 'active' : isWaiting(r.status) ? 'waiting' : 'ended');
  const inState = (r: PackageRow) => stateOf(r) === state;
  const searched = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.child_name, r.parent_name, r.parent_email, r.coach_name, r.product_title].some((v) => (v || '').toLowerCase().includes(s)));
  }, [rows, q]);
  const byState = searched.filter(inState);
  const shown = byState.filter((r) => service === 'all' || r.kind === service);
  const paged = usePagedList(shown, `${q}|${service}|${state}`);

  return (
    <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
      <CoachingHeader description={t('admin.coaching.packages.subtitle', 'ליווי הורי וליווי ילדים: חבילות מפגשים עם חוזה, שאלון פתיחה ותשלום.')} />

      <section aria-label={t('admin.coaching.packages.numbers', 'מספרים')} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Tile value={stats.active} label={t('admin.coaching.packages.statActive', 'חבילות פעילות')} />
        <Tile value={stats.waiting} label={t('admin.coaching.packages.statWaiting', 'ממתינות ללקוח (חוזה / כרטיס / שאלון)')} tone="amber" />
        <Tile value={stats.almost_done} label={t('admin.coaching.packages.statAlmost', 'נשאר מפגש אחד או פחות')} />
        <Tile value={stats.failed} label={t('admin.coaching.packages.statFailed', 'חיוב מפגש נכשל')} tone="red" />
      </section>

      <ListPanel
        label={t('admin.coaching.packages.listLabel', 'חבילות ליווי')}
        toolbar={
          <>
            <ListSearch value={q} onChange={setQ} placeholder={t('admin.coaching.packages.search', 'חיפוש הורה, ילד או מייל')} clearLabel={t('admin.coaching.packages.clearSearch', 'ניקוי החיפוש')} />
            <QuickPills
              label={t('admin.coaching.packages.serviceLabel', 'שירות')}
              value={service}
              onChange={setService}
              options={[
                { value: 'all', label: t('admin.coaching.packages.all', 'הכל'), count: byState.length },
                { value: 'parent', label: t('admin.coaching.kind.parent', 'ליווי הורי'), count: byState.filter((r) => r.kind === 'parent').length },
                { value: 'child', label: t('admin.coaching.kind.children', 'ליווי ילדים'), count: byState.filter((r) => r.kind === 'child').length },
              ]}
            />
            <QuickPills
              label={t('admin.coaching.packages.stateLabel', 'מצב')}
              value={state}
              onChange={setState}
              options={[
                { value: 'active', label: t('admin.coaching.packages.stateActive', 'פעילות'), count: searched.filter((r) => stateOf(r) === 'active').length },
                { value: 'waiting', label: t('admin.coaching.packages.stateWaiting', 'ממתינות'), count: searched.filter((r) => stateOf(r) === 'waiting').length },
                { value: 'ended', label: t('admin.coaching.packages.stateEnded', 'הסתיימו'), count: searched.filter((r) => stateOf(r) === 'ended').length },
              ]}
            />
          </>
        }
        columns={COLS}
        head={[
          t('admin.coaching.packages.colWho', 'למי'),
          t('admin.coaching.packages.colPack', 'חבילה'),
          t('admin.coaching.packages.colCoach', 'מאמן/ת'),
          t('admin.coaching.packages.colSessions', 'מפגשים'),
          t('admin.coaching.packages.colStatus', 'מצב'),
          t('admin.coaching.packages.colPay', 'תשלום'),
        ]}
        state={
          loading ? (
            <ListSkeleton />
          ) : error ? (
            <ListState icon={HeartHandshake} tone="red" title={t('admin.coaching.common.loadError', 'לא הצלחנו לטעון את המידע')} text={error} action={<button type="button" onClick={load} className="font-semibold text-primary">{t('admin.coaching.common.retry', 'לנסות שוב')}</button>} />
          ) : shown.length === 0 ? (
            <ListState
              icon={HeartHandshake}
              tone="grey"
              title={rows.length === 0 ? t('admin.coaching.packages.emptyTitle', 'עוד אין חבילות ליווי') : t('admin.coaching.packages.noResults', 'אין חבילות שמתאימות לסינון')}
              text={rows.length === 0 ? t('admin.coaching.packages.emptyText', 'פותחים חבילה ללקוח, והוא מקבל קישור להרשמה: חוזה, שמירת כרטיס ושאלון פתיחה.') : undefined}
            />
          ) : undefined
        }
        footer={
          shown.length > 0 ? (
            <ListFooter
              showingText={tf(t, 'admin.list.showing', 'מציג {from}–{to} מתוך {total}', { from: paged.start + 1, to: Math.min(paged.start + paged.pageItems.length, shown.length), total: shown.length })}
              pageText={tf(t, 'admin.list.page', 'עמוד {page} מתוך {pages}', { page: paged.page, pages: paged.totalPages })}
              page={paged.page}
              totalPages={paged.totalPages}
              onPage={paged.setPage}
              prevLabel={t('admin.list.prev', 'הקודם')}
              nextLabel={t('admin.list.next', 'הבא')}
              rtl={direction === 'rtl'}
            />
          ) : undefined
        }
      >
        {paged.pageItems.map((r) => {
          const st = statusStyle(r.status);
          const pay = paymentText(t, r);
          const pct = r.sessions_total > 0 ? Math.min(100, Math.round((r.sessions_used / r.sessions_total) * 100)) : 0;
          return (
            <button
              key={r.enrollment_id}
              type="button"
              onClick={() => setOpen(r.enrollment_id)}
              style={{ ['--list-cols' as any]: `${COLS} 20px` }}
              className="grid w-full grid-cols-1 gap-2 border-b border-border px-5 py-3 text-start last:border-b-0 hover:bg-muted/50 md:grid-cols-[var(--list-cols)] md:items-center md:gap-4"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${KIND_MARK[r.kind].cls}`} aria-hidden>
                  {t(KIND_MARK[r.kind].key, KIND_MARK[r.kind].fallback)}
                </span>
                <span className="min-w-0">
                  <b className="block truncate">{whoName(t, r)}</b>
                  <span className="block truncate text-[12.5px] text-muted-foreground">{whoSub(t, r)}</span>
                </span>
              </span>
              <span className="min-w-0 truncate text-sm">
                {r.product_title}
                {r.payment !== 'free' && ` · ${perSession(t, r.price_per_session, r.currency, language)}`}
              </span>
              <span className={`min-w-0 truncate text-sm ${r.coach_name ? '' : 'text-muted-foreground'}`}>{r.coach_name ?? t('admin.coaching.common.noCoach', 'עדיין לא שובץ')}</span>
              <span className="flex items-center gap-2 text-sm">
                <b className="whitespace-nowrap tabular-nums">
                  {r.sessions_used} / {r.sessions_total}
                </b>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10" aria-hidden>
                  <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span>
                <span className={`inline-block rounded-full px-2.5 py-1 text-[12.5px] font-bold ${st.cls}`}>{statusName(t, r.status)}</span>
              </span>
              <span className={`text-[13px] font-semibold ${pay.cls}`}>{pay.text}</span>
              <Chevron className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
            </button>
          );
        })}
      </ListPanel>

      <PackageDrawer enrollmentId={openId} onClose={() => setOpen(null)} onChanged={load} />
    </div>
  );
}

function Tile({ value, label, tone }: { value: number; label: string; tone?: 'amber' | 'red' }) {
  const cls =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
        : 'border-border bg-card';
  return (
    <div className={`rounded-2xl border px-4 py-3.5 ${cls}`}>
      <div className="text-[26px] font-extrabold tabular-nums">{value}</div>
      <div className={`text-[13.5px] ${tone ? '' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}

export default function CoachingPackagesPage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <PackagesInner />
      </Suspense>
    </AdminLayout>
  );
}
