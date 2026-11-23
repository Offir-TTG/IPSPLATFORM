'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { ListFooter, ListSkeleton, StatusDot, usePagedList } from '@/components/admin/notifications/kit';
import { MultiSelectBar, TickBox } from './ProgramCoursesTab';
import { useEnrollmentFormat } from '@/components/admin/enrollments/useEnrollmentFormat';
import type { Program, Student } from './types';
import { isClientRole } from '@/lib/auth/roles';

interface UserOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
}

const STATUS_TONE: Record<string, 'green' | 'grey' | 'orange' | 'red'> = {
  active: 'green',
  completed: 'green',
  pending: 'orange',
  draft: 'orange',
  suspended: 'red',
  cancelled: 'grey',
  dropped: 'grey',
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const personName = (u: UserOption) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email;

/**
 * Enrolls a person in a program straight away: finds the program's product
 * (or makes a free one, as before) and creates an active enrollment.
 */
export async function enrollInProgram(program: Pick<Program, 'id' | 'name' | 'price' | 'currency'>, userId: string) {
  const productsRes = await fetch('/api/admin/products?type=program');
  const productsData = await productsRes.json().catch(() => ({}));
  const products = productsData.success ? productsData.data : [];
  let product = (products || []).find((p: any) => p.program_id === program.id);
  if (!product) {
    const createRes = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'program',
        title: program.name,
        program_id: program.id,
        payment_model: 'free',
        price: program.price || 0,
        currency: program.currency || 'USD',
      }),
    });
    const created = await createRes.json().catch(() => ({}));
    if (!createRes.ok) throw new Error(created.error || 'Failed to create product for program');
    product = created.success ? created.data : created;
  }
  const res = await fetch('/api/admin/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, product_id: product.id, status: 'active' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to enroll student');
  }
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[13px] font-bold text-primary" aria-hidden>
      {initials(name)}
    </span>
  );
}

function SmallSearch({ value, onChange, placeholder, clearLabel }: { value: string; onChange: (v: string) => void; placeholder: string; clearLabel: string }) {
  return (
    <div className="border-b border-border/70 p-2.5">
      <label className="relative flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label={clearLabel} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted">
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </label>
    </div>
  );
}

/**
 * The program's students as two columns, like its courses: "Enrolled"
 * (status, date, a link to the enrollment) and "People to add" (search,
 * ＋ enrolls straight away). For a new program (`draft`) the chosen people
 * are kept in the wizard and enrolled when the program is created.
 */
export function ProgramStudentsTab({
  program,
  students,
  loading,
  reload,
  draft,
  onChange,
}: {
  program: Program;
  students: Student[];
  loading: boolean;
  reload: () => Promise<void> | void;
  /** A new program: nothing is sent until it is created. */
  draft?: boolean;
  onChange?: (next: Student[]) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const f = useEnrollmentFormat();
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [users, setUsers] = useState<UserOption[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [addingMany, setAddingMany] = useState(false);
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  // Students and instructors, as before.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('load users failed');
        const data = await res.json();
        setUsers((Array.isArray(data) ? data : []).filter((u: UserOption) => isClientRole(u.role) || u.role === 'instructor'));
      } catch {
        setUsers([]);
        ui.current.toast({ title: ui.current.t('common.error', 'Error'), description: ui.current.t('admin.programs.students.usersError', "We couldn't load the people list"), variant: 'destructive' });
      }
    })();
  }, []);

  const shownEnrolled = useMemo(() => {
    const q = enrolledSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.user_name} ${s.user_email}`.toLowerCase().includes(q));
  }, [students, enrolledSearch]);

  const people = useMemo(() => (users ?? []).filter((u) => !students.some((s) => s.user_id === u.id)), [users, students]);
  const shownPeople = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return people;
    return people.filter((u) => `${personName(u)} ${u.email}`.toLowerCase().includes(q));
  }, [people, peopleSearch]);

  /** One click: enrolled now (or, for a new program, added to the list). */
  const add = async (u: UserOption) => {
    if (draft) {
      onChange?.([...students, { id: u.id, user_id: u.id, user_name: personName(u), user_email: u.email, status: 'active', enrolled_at: new Date().toISOString() }]);
      return;
    }
    setAdding(u.id);
    try {
      await enrollInProgram(program, u.id);
      toast({ title: t('lms.program_detail.toast_success', 'Success'), description: t('lms.program_detail.student_enrolled_success', 'Client enrolled successfully') });
      await reload();
    } catch (error) {
      toast({
        title: t('lms.program_detail.toast_error', 'Error'),
        description: error instanceof Error ? error.message : t('lms.program_detail.student_enroll_error', 'Failed to enroll client'),
        variant: 'destructive',
      });
    } finally {
      setAdding(null);
    }
  };

  const togglePick = (id: string) =>
    setPicked((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const pickedPeople = people.filter((u) => picked.has(u.id));

  /** Enrolls every ticked person, one after another, then shows the list once. */
  const addPicked = async () => {
    if (pickedPeople.length === 0) return;
    if (draft) {
      onChange?.([
        ...students,
        ...pickedPeople.map((u) => ({ id: u.id, user_id: u.id, user_name: personName(u), user_email: u.email, status: 'active', enrolled_at: new Date().toISOString() })),
      ]);
      setPicked(new Set());
      return;
    }
    setAddingMany(true);
    let failed = 0;
    for (const u of pickedPeople) {
      try {
        await enrollInProgram(program, u.id);
      } catch {
        failed += 1;
      }
    }
    setPicked(new Set());
    await reload();
    setAddingMany(false);
    toast(
      failed > 0
        ? {
            title: t('lms.program_detail.toast_error', 'Error'),
            description: t('admin.programs.multi.someFailed', '{n} of them were not enrolled. Try them again.').replace('{n}', String(failed)),
            variant: 'destructive',
          }
        : {
            title: t('lms.program_detail.toast_success', 'Success'),
            description: t('admin.programs.multi.enrolled', '{n} people enrolled').replace('{n}', String(pickedPeople.length)),
          },
    );
  };

  const enrolledPages = usePagedList(shownEnrolled, enrolledSearch, 10);
  const peoplePages = usePagedList(shownPeople, peopleSearch, 10);
  const footer = (pages: ReturnType<typeof usePagedList<unknown>>, total: number) =>
    pages.totalPages > 1 ? (
      <div className="border-t border-border/70 px-3 py-2">
        <ListFooter
          showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
            .replace('{from}', String(pages.start + 1))
            .replace('{to}', String(pages.start + pages.pageItems.length))
            .replace('{total}', String(total))}
          pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}').replace('{page}', String(pages.page)).replace('{pages}', String(pages.totalPages))}
          page={pages.page}
          totalPages={pages.totalPages}
          onPage={pages.setPage}
          prevLabel={t('admin.users.list.prevPage', 'Previous page')}
          nextLabel={t('admin.users.list.nextPage', 'Next page')}
          rtl={direction === 'rtl'}
        />
      </div>
    ) : null;

  const full = program.max_students != null && students.length >= program.max_students;
  const colHead = 'flex items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-3.5 py-2.5 text-sm font-bold';
  const clearLabel = t('admin.users.list.clearSearch', 'Clear search');
  const emptyText = (text: ReactNode) => <p className="px-6 py-8 text-center text-sm text-muted-foreground">{text}</p>;

  return (
    <div className="grid gap-3" dir={direction}>
      {full && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {t('admin.programs.students.full', 'The program is full ({n} places).').replace('{n}', String(program.max_students))}
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Enrolled */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label={t('lms.program_detail.students_title', 'Enrolled Clients')}>
          <div className={colHead}>
            <span>
              {t('admin.programs.students.enrolled', 'Enrolled')} ({students.length})
            </span>
          </div>
          {students.length > 5 && (
            <SmallSearch value={enrolledSearch} onChange={setEnrolledSearch} placeholder={t('admin.programs.students.search', 'Search a client')} clearLabel={clearLabel} />
          )}
          {loading && students.length === 0 ? (
            <ListSkeleton rows={3} />
          ) : students.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-bold">{t('lms.program_detail.students_empty', 'No clients enrolled in this program yet')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('admin.programs.students.emptyPick', 'Press + next to a person to enroll them.')}</p>
            </div>
          ) : shownEnrolled.length === 0 ? (
            emptyText(t('admin.programs.students.noMatch', 'No clients match'))
          ) : (
            <div>
              {enrolledPages.pageItems.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 last:border-b-0">
                  <Avatar name={s.user_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">{s.user_name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted-foreground">
                      {draft ? (
                        <span dir="ltr">{s.user_email}</span>
                      ) : (
                        <>
                          <StatusDot tone={STATUS_TONE[s.status] ?? 'grey'}>{f.statusLabel(s.status)}</StatusDot>
                          <span>{f.date(s.enrolled_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {draft ? (
                    <button
                      type="button"
                      onClick={() => onChange?.(students.filter((x) => x.id !== s.id))}
                      aria-label={t('admin.programs.students.removeOne', 'Remove {name}').replace('{name}', s.user_name)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : (
                    <Link
                      href={`/admin/enrollments?enrollment=${s.id}`}
                      className="inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                    >
                      {t('admin.programs.students.toEnrollment', 'Enrollment')} {direction === 'rtl' ? '←' : '→'}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          {footer(enrolledPages, shownEnrolled.length)}
        </section>

        {/* People to add */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label={t('admin.programs.students.toAdd', 'People to add')}>
          <div className={colHead}>
            <span>
              {t('admin.programs.students.toAdd', 'People to add')}
              {users ? ` (${people.length})` : ''}
            </span>
          </div>
          <SmallSearch value={peopleSearch} onChange={setPeopleSearch} placeholder={t('lms.program_detail.enroll_search_placeholder', 'Search by name or email...')} clearLabel={clearLabel} />
          {users !== null && (
            <MultiSelectBar
              count={pickedPeople.length}
              total={shownPeople.length}
              busy={addingMany}
              addLabel={t('admin.programs.multi.enrollMany', 'Enroll {n}').replace('{n}', String(pickedPeople.length))}
              onSelectAll={() => setPicked(new Set(shownPeople.map((u) => u.id)))}
              onClear={() => setPicked(new Set())}
              onAdd={() => void addPicked()}
            />
          )}
          <div>
            {users === null ? (
              <div className="grid place-items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : shownPeople.length === 0 ? (
              emptyText(t('lms.program_detail.enroll_no_users', 'No users found'))
            ) : (
              peoplePages.pageItems.map((u) => {
                const name = personName(u);
                return (
                  <div
                    key={u.id}
                    role="checkbox"
                    aria-checked={picked.has(u.id)}
                    tabIndex={0}
                    onClick={() => togglePick(u.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        togglePick(u.id);
                      }
                    }}
                    className={`flex cursor-pointer items-center gap-2.5 border-b border-border/70 px-3 py-2.5 last:border-b-0 hover:bg-muted/40 ${picked.has(u.id) ? 'bg-primary/[0.05]' : ''}`}
                  >
                    <TickBox on={picked.has(u.id)} />
                    <Avatar name={name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold">{name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 font-semibold text-foreground/75">
                          {isClientRole(u.role) ? t('lms.program_detail.enroll_role_student', 'Client') : t('lms.program_detail.enroll_role_instructor', 'Instructor')}
                        </span>
                        <span className="truncate" dir="ltr">
                          {u.email}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void add(u);
                      }}
                      disabled={adding !== null || addingMany}
                      aria-label={t('admin.programs.students.addOne', 'Enroll {name}').replace('{name}', name)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      {adding === u.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
          {footer(peoplePages, shownPeople.length)}
        </section>
      </div>
    </div>
  );
}
