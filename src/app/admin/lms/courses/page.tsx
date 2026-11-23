'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, CheckCircle2, ImageIcon, PencilLine, RefreshCw, Search, WifiOff } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  ClearFilters,
  FilterSelect,
  IconButton,
  KpiItem,
  KpiStrip,
  ListCell,
  ListFooter,
  ListPanel,
  ListRow,
  ListRowMain,
  ListSearch,
  ListSkeleton,
  ListState,
  NewButton,
  PageTitle,
  QuickPills,
  StatusDot,
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';
import { stripHtml } from '@/components/admin/programs/types';
import { COURSE_TYPES, COURSE_TYPE_FALLBACK, courseStatus, dateRange, dayOf, personName, type AdminCourse } from '@/components/admin/courses/types';
import { CourseDrawer, type CourseQuickAction } from '@/components/admin/courses/CourseDrawer';

type StatusFilter = 'all' | 'published' | 'draft' | 'inactive';
const STATUS_TONE = { published: 'green', draft: 'orange', inactive: 'grey' } as const;

/**
 * Courses, in the admin list template: the numbers (each filters the list),
 * then one card with search, type and program filters, status pills, the
 * courses and paging. All courses load once and filter as you type. A row
 * opens the course's own page (structure, materials, settings, tools).
 */
export default function CoursesListPage() {
  const router = useRouter();
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<string>('all');
  const [program, setProgram] = useState<string>('all');
  const [thisMonth, setThisMonth] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<CourseQuickAction | null>(null);
  const openCourse = courses.find((c) => c.id === openId) ?? null;

  /** The drawer's quick actions: on/off, publish/hide (saved in place), duplicate (opens the copy). */
  const quickAction = async (course: AdminCourse, action: CourseQuickAction) => {
    setBusy(action);
    try {
      if (action === 'duplicate') {
        const res = await fetch(`/api/lms/courses/${course.id}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newTitle: t('admin.courses.copyTitle', '{title} (copy)').replace('{title}', course.title) }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.success || !result.data?.id) throw new Error('duplicate failed');
        router.push(`/admin/lms/courses/${result.data.id}?step=basics`);
        return;
      }
      const field = action === 'active' ? 'is_active' : 'is_published';
      const next = !course[field];
      const res = await fetch(`/api/lms/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.error || 'update failed');
      setCourses((list) => list.map((c) => (c.id === course.id ? { ...c, [field]: next } : c)));
      toast({
        title:
          action === 'active'
            ? next
              ? t('admin.courses.drawer.turnedOn', 'The course is on.')
              : t('admin.courses.drawer.turnedOff', 'The course is off. Clients cannot see it.')
            : next
              ? t('admin.courses.drawer.published', 'The course is published. Clients can see it.')
              : t('admin.courses.drawer.hidden', 'The course is hidden from clients.'),
      });
    } catch (error) {
      const reason = error instanceof Error && !/failed$/.test(error.message) ? ` (${error.message})` : '';
      toast({
        title: t('common.error', 'Error'),
        description:
          action === 'duplicate'
            ? t('admin.courses.duplicateError', "The course wasn't copied. Try again.")
            : `${t('admin.courses.drawer.saveError', 'The change was not saved. Try again.')}${reason}`,
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  /** Loads the list. `silent` (after a drawer save) shows no spinner and keeps the drawer open. */
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/lms/courses');
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.error || 'load failed');
      setCourses(result.data || []);
      setLoadError(false);
    } catch (error) {
      console.error('Failed to load courses:', error);
      if (silent) return;
      setLoadError(true);
      ui.current.toast({ title: ui.current.t('common.error', 'Error'), description: ui.current.t('admin.courses.loadError', "We couldn't load the courses"), variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const monthKey = new Date().toISOString().slice(0, 7);
  const startsThisMonth = (c: AdminCourse) => dayOf(c.start_date).slice(0, 7) === monthKey;

  const counts = useMemo(() => {
    const by = { published: 0, draft: 0, inactive: 0 };
    for (const c of courses) by[courseStatus(c)] += 1;
    return { all: courses.length, ...by, month: courses.filter(startsThisMonth).length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const programOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) if (c.program?.id) map.set(c.program.id, c.program.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [courses]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (status === 'all' || courseStatus(c) === status) &&
        (type === 'all' || c.course_type === type) &&
        (program === 'all' || (program === 'standalone' ? c.is_standalone || !c.program_id : c.program_id === program)) &&
        (!thisMonth || startsThisMonth(c)) &&
        (!q || `${c.title} ${stripHtml(c.description)}`.toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, search, status, type, program, thisMonth]);

  const paged = usePagedList(shown, `${search}|${status}|${type}|${program}|${thisMonth}`);
  const filtersOn = !!search || status !== 'all' || type !== 'all' || program !== 'all' || thisMonth;
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setType('all');
    setProgram('all');
    setThisMonth(false);
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const typeLabel = (v: string | null) => (v ? t(`lms.course.type_${v}`, COURSE_TYPE_FALLBACK[v as keyof typeof COURSE_TYPE_FALLBACK] ?? v) : '');
  const statusLabel = (s: 'published' | 'draft' | 'inactive') =>
    s === 'published' ? t('lms.course.published', 'Published') : s === 'draft' ? t('lms.course.draft', 'Draft') : t('lms.courses.inactive', 'Inactive');
  const COLS = 'minmax(0,1.5fr) minmax(0,1fr) 150px 110px';
  const createButton = <NewButton href="/admin/lms/courses/new">{t('admin.courses.new', 'New course')}</NewButton>;

  let state: ReactNode = undefined;
  if (!loaded || (loading && courses.length === 0)) state = <ListSkeleton />;
  else if (loadError && courses.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={() => void load(false)} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (courses.length === 0)
    state = <ListState icon={BookOpen} title={t('lms.courses.no_courses', 'No courses found')} text={t('lms.courses.no_courses_description', 'Get started by creating your first course')} action={createButton} />;
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.courses.noMatch', 'No courses match')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.users.filters.clear', 'Clear Filters')}
          </button>
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={BookOpen}
          title={t('lms.courses.title', 'Courses')}
          badge={loaded ? num(counts.all) : undefined}
          description={t('admin.courses.description', 'Courses, lectures and workshops, with their modules and lessons.')}
          actions={createButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<BookOpen />} label={t('admin.courses.kpi.all', 'All courses')} value={loaded ? num(counts.all) : '—'} onClick={clearFilters} />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.courses.kpi.published', 'Published')}
            value={loaded ? num(counts.published) : '—'}
            onClick={() => toggleStatus('published')}
            active={status === 'published'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<PencilLine />}
            tone="amber"
            label={t('admin.courses.kpi.drafts', 'Drafts')}
            value={loaded ? num(counts.draft) : '—'}
            subtitle={t('admin.courses.kpi.draftsSub', 'Clients cannot see them yet')}
            onClick={() => toggleStatus('draft')}
            active={status === 'draft'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<CalendarDays />}
            tone="blue"
            label={t('admin.courses.kpi.thisMonth', 'Starting this month')}
            value={loaded ? num(counts.month) : '—'}
            onClick={() => setThisMonth((v) => !v)}
            active={thisMonth}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('lms.courses.title', 'Courses')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.courses.searchPlaceholder', 'Search by name or description')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect
                label={t('admin.courses.filter.type', 'Type')}
                value={type}
                onChange={setType}
                dir={direction}
                options={[{ value: 'all', label: t('admin.courses.filter.all', 'All') }, ...COURSE_TYPES.map((v) => ({ value: v, label: typeLabel(v) }))]}
              />
              <FilterSelect
                label={t('lms.courses.program', 'Program')}
                value={program}
                onChange={setProgram}
                dir={direction}
                options={[
                  { value: 'all', label: t('admin.courses.filter.all', 'All') },
                  { value: 'standalone', label: t('admin.courses.filter.standalone', 'No program (standalone)') },
                  ...programOptions,
                ]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load(false)} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.payments.products.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.courses.filter.all', 'All'), count: counts.all },
                  ...(['published', 'draft', 'inactive'] as const).map((s) => ({
                    value: s,
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s === 'published' ? 'bg-green-500' : s === 'draft' ? 'bg-amber-500' : 'bg-slate-400'}`} aria-hidden />
                        {statusLabel(s)}
                      </span>
                    ),
                    count: counts[s],
                  })),
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[t('admin.courses.col.course', 'Course'), t('admin.courses.col.programInstructor', 'Program · Instructor'), t('admin.courses.col.dates', 'Dates'), t('admin.payments.products.status', 'Status')]}
          state={state}
          footer={
            loaded && shown.length > 0 ? (
              <ListFooter
                showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num(paged.start + 1))
                  .replace('{to}', num(paged.start + paged.pageItems.length))
                  .replace('{total}', num(shown.length))}
                pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}').replace('{page}', String(paged.page)).replace('{pages}', String(paged.totalPages))}
                page={paged.page}
                totalPages={paged.totalPages}
                onPage={paged.setPage}
                prevLabel={t('admin.users.list.prevPage', 'Previous page')}
                nextLabel={t('admin.users.list.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
          {paged.pageItems.map((c) => {
            const st = courseStatus(c);
            const instructor = personName(c.instructor);
            return (
              <ListRow key={c.id} columns={COLS} onOpen={() => setOpenId(c.id)} label={c.title} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-primary/10 text-primary">
                      {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" aria-hidden />}
                    </span>
                  }
                  title={<bdi className="font-semibold">{c.title}</bdi>}
                  sub={
                    <span className="mt-0.5 flex flex-wrap gap-1.5">
                      {c.course_type && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/75">{typeLabel(c.course_type)}</span>}
                      {c.is_standalone && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t('admin.courses.standaloneChip', 'Standalone')}</span>}
                    </span>
                  }
                />
                <ListCell label={t('admin.courses.col.programInstructor', 'Program · Instructor')}>
                  <span className={`block ${c.program?.name ? '' : 'text-muted-foreground'}`}>{c.program?.name || t('admin.courses.noProgram', 'No program')}</span>
                  {instructor && <span className="block text-[13px] text-muted-foreground">{instructor}</span>}
                </ListCell>
                <ListCell label={t('admin.courses.col.dates', 'Dates')} muted={!c.start_date}>
                  {dateRange(c.start_date, c.end_date, locale) || '—'}
                </ListCell>
                <ListCell label={t('admin.payments.products.status', 'Status')}>
                  <StatusDot tone={STATUS_TONE[st]}>{statusLabel(st)}</StatusDot>
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>
      <CourseDrawer course={openCourse} busy={busy} onClose={() => setOpenId(null)} onAction={(c, a) => void quickAction(c, a)}
        onUpdated={(u) => {
          setCourses((list) => list.map((c) => (c.id === u.id ? { ...c, ...u } : c)));
          void load(true);
        }}
      />
    </AdminLayout>
  );
}
