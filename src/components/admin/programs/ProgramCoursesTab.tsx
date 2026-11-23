'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImageIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { ListFooter, ListSkeleton, usePagedList } from '@/components/admin/notifications/kit';
import { COURSE_TYPE_FALLBACK, dateRange } from '@/components/admin/courses/types';
import { stripHtml, type Course, type ProgramCourse } from './types';

/** Above a list you can tick: "Select all", or "3 selected · Add 3 · Clear". */
export function MultiSelectBar({
  count,
  total,
  busy,
  addLabel,
  onSelectAll,
  onClear,
  onAdd,
}: {
  count: number;
  total: number;
  busy: boolean;
  addLabel: string;
  onSelectAll: () => void;
  onClear: () => void;
  onAdd: () => void;
}) {
  const { t } = useAdminLanguage();
  if (total === 0 && count === 0) return null;
  return (
    <div className={`flex min-h-[44px] flex-wrap items-center gap-2 border-b border-border/70 px-3 py-1.5 text-sm ${count ? 'bg-primary/[0.06]' : ''}`}>
      {count === 0 ? (
        <button type="button" onClick={onSelectAll} className="min-h-9 font-semibold text-primary hover:underline">
          {t('admin.programs.multi.selectAll', 'Select all ({n})').replace('{n}', String(total))}
        </button>
      ) : (
        <>
          <span className="font-semibold">{t('admin.programs.multi.selected', '{n} selected').replace('{n}', String(count))}</span>
          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="ms-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {addLabel}
          </button>
          <button type="button" onClick={onClear} disabled={busy} className="min-h-9 rounded-lg px-2 font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60">
            {t('admin.programs.multi.clear', 'Clear')}
          </button>
        </>
      )}
    </div>
  );
}

/** A tick box drawn like the rest of the admin (the row itself is the click target). */
export function TickBox({ on }: { on: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 text-[12px] font-extrabold ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}
      aria-hidden
    >
      {on ? '✓' : ''}
    </span>
  );
}

/** The course's small picture, or an icon. */
function Thumb({ url }: { url?: string | null }) {
  return (
    <span className="grid h-[34px] w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary" aria-hidden>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />}
    </span>
  );
}

function InProgramRow({
  pc,
  index,
  info,
  typeLabel,
  onToggleRequired,
  onRemove,
  busy,
}: {
  pc: ProgramCourse;
  index: number;
  /** The full course (picture, type), from the course list. */
  info?: Course;
  typeLabel: (type?: string | null) => string;
  onToggleRequired: (pc: ProgramCourse) => void;
  onRemove: (pc: ProgramCourse) => void;
  busy: boolean;
}) {
  const { t } = useAdminLanguage();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: pc.id, disabled: busy });
  const type = typeLabel(info?.course_type);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-2.5 border-b border-border/70 bg-card px-3 py-2.5 last:border-b-0 ${
        isDragging ? 'z-10 rounded-xl border border-dashed border-primary shadow-xl' : ''
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t('admin.programs.courses.dragLabel', 'Move {title}').replace('{title}', pc.course.title)}
        disabled={busy}
        className="grid h-9 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing disabled:opacity-40"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-5 shrink-0 text-center font-extrabold tabular-nums text-primary">{index + 1}</span>
      <Thumb url={info?.image_url} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold" title={pc.course.title}>
          {pc.course.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
          {type && <span className="rounded-full bg-muted px-2 font-semibold text-foreground/75">{type}</span>}
          {!pc.is_required && <span>{t('lms.program_detail.course_optional', 'Optional')}</span>}
        </div>
      </div>
      <Switch
        checked={pc.is_required}
        onCheckedChange={() => onToggleRequired(pc)}
        disabled={busy}
        aria-label={pc.is_required ? t('lms.program_detail.course_required', 'Required') : t('lms.program_detail.course_optional', 'Optional')}
        title={pc.is_required ? t('lms.program_detail.course_required', 'Required') : t('lms.program_detail.course_optional', 'Optional')}
      />
      <button
        type="button"
        onClick={() => onRemove(pc)}
        disabled={busy}
        aria-label={t('admin.programs.courses.removeLabel', 'Remove {title} from the program').replace('{title}', pc.course.title)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/40"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * The program's courses as two columns: "In the program" (drag to order,
 * required/optional, remove) and "Available courses" (search, ＋ adds a
 * course straight away). For a new program (`programId` null) nothing is
 * sent: the list is kept in the wizard and saved when the program is created.
 */
export function ProgramCoursesTab({
  programId,
  courses,
  loading,
  allCourses,
  onChange,
  reload,
}: {
  programId: string | null;
  courses: ProgramCourse[];
  loading: boolean;
  allCourses: Course[];
  onChange: (next: ProgramCourse[]) => void;
  reload: () => Promise<void> | void;
}) {
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [addingMany, setAddingMany] = useState(false);
  const [search, setSearch] = useState('');
  const [toRemove, setToRemove] = useState<ProgramCourse | null>(null);
  const [removing, setRemoving] = useState(false);
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fail = (key: string, fallback: string) =>
    ui.current.toast({ title: ui.current.t('common.error', 'Error'), description: ui.current.t(key, fallback), variant: 'destructive' });

  const byId = useMemo(() => new Map(allCourses.map((c) => [c.id, c])), [allCourses]);
  const typeLabel = (type?: string | null) =>
    type ? t(`lms.course.type_${type}`, COURSE_TYPE_FALLBACK[type as keyof typeof COURSE_TYPE_FALLBACK] ?? type) : '';

  const available = useMemo(() => allCourses.filter((c) => !courses.some((pc) => pc.course.id === c.id)), [allCourses, courses]);
  const shownAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter((c) => c.title.toLowerCase().includes(q) || stripHtml(c.description).toLowerCase().includes(q));
  }, [available, search]);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = courses.findIndex((c) => c.id === active.id);
    const to = courses.findIndex((c) => c.id === over.id);
    if (from < 0 || to < 0) return;
    const before = courses;
    const next = arrayMove(courses, from, to).map((c, i) => ({ ...c, order: i }));
    onChange(next);
    if (!programId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOrders: next.map((c) => ({ course_id: c.course.id, order: c.order })) }),
      });
      if (!res.ok) throw new Error('reorder failed');
    } catch {
      onChange(before);
      fail('admin.programs.courses.reorderError', "The new order wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRequired = async (pc: ProgramCourse) => {
    const before = courses;
    onChange(courses.map((c) => (c.id === pc.id ? { ...c, is_required: !c.is_required } : c)));
    if (!programId) return;
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses/${pc.course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_required: !pc.is_required }),
      });
      if (!res.ok) throw new Error('update failed');
    } catch {
      onChange(before);
      fail('lms.program_detail.course_update_error', 'Failed to update course');
    }
  };

  /** One click: the course goes to the end of the program. */
  const add = async (course: Course) => {
    if (!programId) {
      onChange([...courses, { id: course.id, order: courses.length, is_required: true, created_at: '', course }]);
      return;
    }
    setAdding(course.id);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id, is_required: true }),
      });
      if (!res.ok) throw new Error('add failed');
      await reload();
    } catch {
      fail('lms.program_detail.course_add_error', 'Failed to add courses');
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

  /** Adds every ticked course, in list order, then shows the saved list once. */
  const addPicked = async () => {
    const chosen = available.filter((c) => picked.has(c.id));
    if (chosen.length === 0) return;
    if (!programId) {
      onChange([...courses, ...chosen.map((c, i) => ({ id: c.id, order: courses.length + i, is_required: true, created_at: '', course: c }))]);
      setPicked(new Set());
      return;
    }
    setAddingMany(true);
    let failed = 0;
    for (const c of chosen) {
      try {
        const res = await fetch(`/api/admin/programs/${programId}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: c.id, is_required: true }),
        });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    setPicked(new Set());
    await reload();
    setAddingMany(false);
    if (failed > 0) fail('lms.program_detail.course_add_error', 'Failed to add courses');
    else
      toast({
        title: t('lms.program_detail.toast_success', 'Success'),
        description: t('lms.program_detail.courses_added', '{count} course(s) added to program').replace('{count}', String(chosen.length)),
      });
  };

  /** A new program: straight back to the available list. An existing one asks first. */
  const askRemove = (pc: ProgramCourse) => {
    if (!programId) {
      onChange(courses.filter((c) => c.id !== pc.id).map((c, i) => ({ ...c, order: i })));
      return;
    }
    setToRemove(pc);
  };

  const remove = async () => {
    if (!toRemove || !programId) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses/${toRemove.course.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('remove failed');
      toast({ title: t('lms.program_detail.toast_success', 'Success'), description: t('lms.program_detail.course_removed', 'Course removed from program') });
      setToRemove(null);
      await reload();
    } catch {
      fail('lms.program_detail.course_remove_error', 'Failed to remove course');
    } finally {
      setRemoving(false);
    }
  };

  const colHead = 'flex items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-3.5 py-2.5 text-sm font-bold';

  // Pages of 10 for both columns; the available list goes back to page 1 when the search changes.
  const inPages = usePagedList(courses, 'in', 10);
  const availPages = usePagedList(shownAvailable, search, 10);
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

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2" dir={direction}>
      {/* In the program */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label={t('lms.program_detail.courses_title', 'Program Courses')}>
        <div className={colHead}>
          <span>
            {t('admin.programs.courses.inProgram', 'In the program')} ({courses.length})
          </span>
          <span className="text-[12.5px] font-normal text-muted-foreground">{t('admin.programs.courses.dragShort', 'Drag to change the order')}</span>
        </div>
        {loading && courses.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : courses.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="font-bold">{t('lms.program_detail.courses_empty', 'No courses added to this program yet')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('admin.programs.courses.emptyPick', 'Press ＋ next to a course to add it.')}</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
            <SortableContext items={inPages.pageItems.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {inPages.pageItems.map((pc, i) => (
                <InProgramRow
                  key={pc.id}
                  pc={pc}
                  index={inPages.start + i}
                  info={byId.get(pc.course.id)}
                  typeLabel={typeLabel}
                  busy={busy}
                  onToggleRequired={(x) => void toggleRequired(x)}
                  onRemove={askRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        {footer(inPages, courses.length)}
      </section>

      {/* Available courses */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label={t('admin.programs.courses.available', 'Available courses')}>
        <div className={colHead}>
          <span>
            {t('admin.programs.courses.available', 'Available courses')} ({available.length})
          </span>
        </div>
        <div className="border-b border-border/70 p-2.5">
          <label className="relative flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only">{t('admin.programs.courses.search', 'Search a course')}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.programs.courses.search', 'Search a course')}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label={t('admin.users.list.clearSearch', 'Clear search')} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted">
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </label>
        </div>
        <MultiSelectBar
          count={[...picked].filter((id) => available.some((c) => c.id === id)).length}
          total={shownAvailable.length}
          busy={addingMany}
          addLabel={t('admin.programs.multi.addCourses', 'Add {n}').replace('{n}', String([...picked].filter((id) => available.some((c) => c.id === id)).length))}
          onSelectAll={() => setPicked(new Set(shownAvailable.map((c) => c.id)))}
          onClear={() => setPicked(new Set())}
          onAdd={() => void addPicked()}
        />
        <div>
          {shownAvailable.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              {search ? t('lms.program_detail.no_courses_found', 'No courses found matching your search') : t('lms.program_detail.no_available_courses', 'No available courses to add')}
            </p>
          ) : (
            availPages.pageItems.map((c) => {
              const type = typeLabel(c.course_type);
              const dates = dateRange(c.start_date ?? null, c.end_date ?? null, locale);
              return (
                <div
                  key={c.id}
                  role="checkbox"
                  aria-checked={picked.has(c.id)}
                  tabIndex={0}
                  onClick={() => togglePick(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      togglePick(c.id);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-2.5 border-b border-border/70 px-3 py-2.5 last:border-b-0 hover:bg-muted/40 ${picked.has(c.id) ? 'bg-primary/[0.05]' : ''}`}
                >
                  <TickBox on={picked.has(c.id)} />
                  <Thumb url={c.image_url} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold" title={c.title}>
                      {c.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
                      {type && <span className="rounded-full bg-muted px-2 font-semibold text-foreground/75">{type}</span>}
                      <span>{dates || t('admin.programs.courses.noDate', 'No date')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void add(c);
                    }}
                    disabled={adding !== null || addingMany}
                    aria-label={t('admin.programs.courses.addOne', 'Add {title} to the program').replace('{title}', c.title)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    {adding === c.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              );
            })
          )}
        </div>
        {footer(availPages, shownAvailable.length)}
      </section>

      {/* Remove a course from an existing program */}
      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && !removing && setToRemove(null)}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lms.program_detail.remove_course_title', 'Remove Course?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'lms.program_detail.remove_course_description',
                'Are you sure you want to remove "{title}" from this program? The course itself will not be deleted.',
              ).replace('{title}', toRemove?.course.title || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t('lms.program_detail.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
              disabled={removing}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {removing && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
              {t('lms.program_detail.remove_course_button', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
