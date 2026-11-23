'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookOpen, CheckCircle2, ImageIcon, PauseCircle, RefreshCw, Search, Users, WifiOff } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  ClearFilters,
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
import { stripHtml, type Program } from '@/components/admin/programs/types';
import { ProgramDrawer } from '@/components/admin/programs/ProgramDrawer';

type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Programs, in the admin list template: the numbers (each filters the
 * list), then one card with search, status pills, the programs and paging.
 * A row opens the program's own page (courses, students, settings).
 */
export default function ProgramsPage() {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const openProgram = programs.find((p) => p.id === openId) ?? null;

  /** Turns a program on or off from its drawer, and updates the list in place. */
  const toggleActive = async (program: Program) => {
    setToggling(true);
    const next = !program.is_active;
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.error || 'update failed');
      setPrograms((list) => list.map((p) => (p.id === program.id ? { ...p, is_active: next } : p)));
      toast({
        title: next
          ? t('admin.programs.drawer.turnedOn', 'The program is on. New clients can enroll.')
          : t('admin.programs.drawer.turnedOff', 'The program is off. It is not offered to new clients.'),
      });
    } catch (error) {
      const reason = error instanceof Error && error.message !== 'update failed' ? ` (${error.message})` : '';
      toast({ title: t('common.error', 'Error'), description: `${t('lms.programs.update_error', 'Failed to update program')}${reason}`, variant: 'destructive' });
    } finally {
      setToggling(false);
    }
  };

  /** Deletes a program from its drawer. The server refuses while enrollments are running. */
  const deleteProgram = async (program: Program) => {
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (res.status === 409 && result.error === 'has_active_enrollments') {
        setPrograms((list) => list.map((p) => (p.id === program.id ? { ...p, active_count: result.active_count } : p)));
        toast({
          title: t('common.error', 'Error'),
          description: t('admin.programs.delete.blocked', "Can't be deleted while {n} clients are enrolled (active or waiting). Cancel their enrollments first.").replace(
            '{n}',
            String(result.active_count),
          ),
          variant: 'destructive',
        });
        return false;
      }
      if (!res.ok || !result.success) throw new Error(result.error || 'delete failed');
      setOpenId(null);
      setPrograms((list) => list.filter((p) => p.id !== program.id));
      toast({ title: t('common.success', 'Success'), description: t('lms.programs.deleted', 'Program deleted successfully') });
      return true;
    } catch (error) {
      const reason = error instanceof Error && error.message !== 'delete failed' ? ` (${error.message})` : '';
      toast({ title: t('common.error', 'Error'), description: `${t('lms.programs.delete_error', 'Failed to delete program')}${reason}`, variant: 'destructive' });
      return false;
    }
  };

  // `t` and `toast` change on every render, so they're read through a ref.
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  /** Loads the list. `silent` (after a drawer save) shows no spinner and keeps the drawer open. */
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/programs');
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.error || 'load failed');
      setPrograms(result.data || []);
      setLoadError(false);
    } catch (error) {
      console.error('Failed to load programs:', error);
      if (silent) return;
      setLoadError(true);
      ui.current.toast({
        title: ui.current.t('common.error', 'Error'),
        description: ui.current.t('lms.programs.load_error', 'Failed to load programs'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      all: programs.length,
      active: programs.filter((p) => p.is_active).length,
      inactive: programs.filter((p) => !p.is_active).length,
      students: programs.reduce((s, p) => s + (p.student_count ?? 0), 0),
    }),
    [programs],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter(
      (p) =>
        (status === 'all' || (status === 'active' ? p.is_active : !p.is_active)) &&
        (!q || `${p.name} ${stripHtml(p.description)}`.toLowerCase().includes(q)),
    );
  }, [programs, search, status]);

  const paged = usePagedList(shown, `${search}|${status}`);
  const filtersOn = !!search || status !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const COLS = 'minmax(0,1.6fr) 100px 140px 110px 110px';
  const createButton = <NewButton href="/admin/lms/programs/new">{t('admin.programs.new', 'New program')}</NewButton>;

  let state: ReactNode = undefined;
  if (!loaded || (loading && programs.length === 0)) state = <ListSkeleton />;
  else if (loadError && programs.length === 0)
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
  else if (programs.length === 0)
    state = (
      <ListState
        icon={BookOpen}
        title={t('lms.programs.no_programs', 'No programs created yet')}
        text={t('admin.programs.emptyText', 'A program groups courses that clients enroll in together.')}
        action={createButton}
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('lms.programs.no_results', 'No programs found matching your search')}
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
          title={t('lms.programs.title', 'Programs')}
          badge={loaded ? num(counts.all) : undefined}
          description={t('admin.programs.description', 'The programs clients enroll in, and the courses in each.')}
          actions={createButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem icon={<BookOpen />} label={t('admin.programs.kpi.all', 'All programs')} value={loaded ? num(counts.all) : '—'} onClick={clearFilters} />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.programs.kpi.active', 'Active')}
            value={loaded ? num(counts.active) : '—'}
            onClick={() => toggleStatus('active')}
            active={status === 'active'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<PauseCircle />}
            tone="grey"
            label={t('admin.programs.kpi.inactive', 'Inactive')}
            value={loaded ? num(counts.inactive) : '—'}
            onClick={() => toggleStatus('inactive')}
            active={status === 'inactive'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Users />}
            tone="blue"
            label={t('admin.programs.kpi.students', 'Clients enrolled')}
            value={loaded ? num(counts.students) : '—'}
            subtitle={t('admin.programs.kpi.studentsSub', 'In all programs')}
          />
        </KpiStrip>

        <ListPanel
          label={t('lms.programs.title', 'Programs')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.programs.searchPlaceholder', 'Search by name or description')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
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
                  { value: 'all', label: t('lms.programs.all_statuses', 'All'), count: counts.all },
                  {
                    value: 'active',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                        {t('lms.programs.active', 'Active')}
                      </span>
                    ),
                    count: counts.active,
                  },
                  {
                    value: 'inactive',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                        {t('lms.programs.inactive', 'Inactive')}
                      </span>
                    ),
                    count: counts.inactive,
                  },
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.programs.col.program', 'Program'),
            t('lms.program_detail.tab_courses', 'Courses'),
            t('lms.program_detail.tab_students', 'Clients'),
            t('admin.programs.col.duration', 'Duration'),
            t('admin.payments.products.status', 'Status'),
          ]}
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
          {paged.pageItems.map((p) => {
            const students = p.student_count ?? 0;
            const pct = p.max_students ? Math.min(100, Math.round((students / p.max_students) * 100)) : 0;
            const description = stripHtml(p.description);
            return (
              <ListRow key={p.id} columns={COLS} onOpen={() => setOpenId(p.id)} label={p.name} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className="grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-primary/10 text-primary">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" aria-hidden />}
                    </span>
                  }
                  title={<bdi className="font-semibold">{p.name}</bdi>}
                  sub={description ? <span className="line-clamp-1">{description}</span> : undefined}
                />
                <ListCell label={t('lms.program_detail.tab_courses', 'Courses')}>
                  <b className="tabular-nums">{num(p.course_count ?? 0)}</b> {t('lms.programs.courses', 'courses')}
                </ListCell>
                <ListCell label={t('lms.program_detail.tab_students', 'Clients')}>
                  {p.max_students ? (
                    <span className="inline-block w-full max-w-[9rem] align-middle">
                      <span className="font-semibold tabular-nums">
                        {num(students)} / {num(p.max_students)}
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span className={`block h-full rounded-full ${pct >= 100 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold tabular-nums">{num(students)}</span>
                      <span className="ms-1.5 text-[13px] text-muted-foreground">{t('admin.programs.noLimit', 'no limit')}</span>
                    </span>
                  )}
                </ListCell>
                <ListCell label={t('admin.programs.col.duration', 'Duration')} muted={!p.duration_weeks}>
                  {p.duration_weeks ? `${p.duration_weeks} ${t('lms.programs.weeks', 'weeks')}` : '—'}
                </ListCell>
                <ListCell label={t('admin.payments.products.status', 'Status')}>
                  <StatusDot tone={p.is_active ? 'green' : 'grey'}>{p.is_active ? t('lms.programs.active', 'Active') : t('lms.programs.inactive', 'Inactive')}</StatusDot>
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>
      <ProgramDrawer program={openProgram} busy={toggling} onClose={() => setOpenId(null)} onToggleActive={(p) => void toggleActive(p)}
        onUpdated={(u) => {
          setPrograms((list) => list.map((p) => (p.id === u.id ? { ...p, ...u } : p)));
          void load(true);
        }}
        onDelete={deleteProgram}
      />
    </AdminLayout>
  );
}
