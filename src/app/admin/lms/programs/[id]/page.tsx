'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, ImageIcon, Link2, Loader2, Settings2, Trash2, Users } from 'lucide-react';
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
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLanguage } from '@/context/AppContext';
import { ListState, StatusDot, kitButton } from '@/components/admin/notifications/kit';
import { ProgramCoursesTab } from '@/components/admin/programs/ProgramCoursesTab';
import { ProgramStudentsTab } from '@/components/admin/programs/ProgramStudentsTab';
import { ProgramSettingsForm } from '@/components/admin/programs/ProgramSettingsForm';
import { ProgramDeleteDialog } from '@/components/admin/programs/ProgramDeleteDialog';
import { stripHtml, type Course, type Program, type ProgramCourse, type Student } from '@/components/admin/programs/types';


/**
 * One program: a header with its picture, status, "View page" and Delete,
 * then three tabs — Courses (order by dragging, required/optional, add,
 * remove), Students (enroll, open an enrollment) and Settings (the
 * program's details, saved with the floating bar). The tab is in the
 * address (?tab=), so a reload or a shared link opens the same tab.
 */
export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';

  // Which step opens first (?step=courses after creating; old ?tab= links still work).
  const initialStep = searchParams.get('step') ?? ({ courses: 'courses', students: 'students', settings: 'basics' } as Record<string, string>)[searchParams.get('tab') ?? ''] ?? null;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [productId, setProductId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // `t` and `toast` change on every render, so they're read through a ref.
  const ui = useRef({ t, toast });
  ui.current = { t, toast };

  const loadProgram = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error('load failed');
      setProgram(await res.json());
    } catch {
      ui.current.toast({
        title: ui.current.t('lms.program_detail.toast_error', 'Error'),
        description: ui.current.t('lms.program_detail.load_error', 'Failed to load program'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [programId]);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses`);
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data.filter((pc: ProgramCourse) => pc.course) : []);
    } catch {
      ui.current.toast({ title: ui.current.t('common.error', 'Error'), description: ui.current.t('admin.programs.courses.loadError', "We couldn't load the courses"), variant: 'destructive' });
    } finally {
      setCoursesLoading(false);
    }
  }, [programId]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/admin/enrollments?program_id=${programId}`);
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setStudents(data.enrollments || []);
    } catch {
      setStudents([]);
      ui.current.toast({ title: ui.current.t('common.error', 'Error'), description: ui.current.t('admin.programs.students.loadError', "We couldn't load the clients"), variant: 'destructive' });
    } finally {
      setStudentsLoading(false);
    }
  }, [programId]);

  // Everything loads at once, so both tab counts are right straight away.
  useEffect(() => {
    void loadProgram();
    void loadCourses();
    void loadStudents();
    void (async () => {
      try {
        const res = await fetch('/api/lms/courses');
        const data = await res.json();
        setAllCourses(data.success ? data.data || [] : []);
      } catch {
        setAllCourses([]);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/products?type=program');
        const data = await res.json();
        const product = (data.success ? data.data || [] : []).find((p: any) => p.program_id === programId);
        setProductId(product?.id ?? null);
      } catch {
        setProductId(null);
      }
    })();
  }, [programId, loadProgram, loadCourses, loadStudents]);

  // Enrollments still running (active or pending) stop a delete.
  const running = students.filter((s) => s.status === 'active' || s.status === 'pending').length;

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' });
      const result = await res.json().catch(() => ({}));
      if (res.status === 409 && result.error === 'has_active_enrollments') {
        // Someone enrolled meanwhile: show the up-to-date list and the reason.
        setConfirmDelete(false);
        void loadStudents();
        throw new Error(
          t('admin.programs.delete.blocked', "Can't be deleted while {n} clients are enrolled (active or waiting). Cancel their enrollments first.").replace('{n}', String(result.active_count)),
        );
      }
      if (!res.ok || !result.success) throw new Error(result.error || t('lms.programs.delete_error', 'Failed to delete program'));
      toast({ title: t('common.success', 'Success'), description: t('lms.programs.deleted', 'Program deleted successfully') });
      router.push('/admin/lms/programs');
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('lms.programs.delete_error', 'Failed to delete program'),
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const Back = rtl ? ChevronRight : ChevronLeft;
  const backLink = (
    <Link href="/admin/lms/programs" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline">
      <Back className="h-4 w-4" aria-hidden />
      {t('lms.program_detail.back_to_programs', 'Back to Programs')}
    </Link>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction} aria-busy="true">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <span className="h-20 w-28 animate-pulse rounded-xl bg-muted" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3 w-24 animate-pulse rounded bg-muted" />
              <span className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !program) {
    return (
      <AdminLayout>
        <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
          {backLink}
          <div className="rounded-2xl border border-border bg-card">
            <ListState
              icon={BookOpen}
              tone="grey"
              title={t('lms.program_detail.program_not_found', 'Program not found')}
              action={
                notFound ? undefined : (
                  <button type="button" onClick={() => void loadProgram()} className={kitButton.primary}>
                    {t('admin.list.retry', 'Try again')}
                  </button>
                )
              }
            />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const description = stripHtml(program.description);
  const meta = [
    program.is_active ? t('lms.programs.active', 'Active') : t('lms.programs.inactive', 'Inactive'),
    program.duration_weeks ? `${program.duration_weeks} ${t('lms.programs.weeks', 'weeks')}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        {backLink}

        {/* Header */}
        <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">
            {program.image_url ? (
              <img src={program.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1 basis-56">
            <span className="text-[13px]">
              <StatusDot tone={program.is_active ? 'green' : 'grey'}>
                <span className={program.is_active ? 'font-semibold text-green-700 dark:text-green-400' : 'text-muted-foreground'}>{meta}</span>
              </StatusDot>
            </span>
            <h1 className="mt-0.5 text-2xl font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere] sm:text-[26px]">{program.name}</h1>
            {description && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {productId && (
              // The program's enrollment link (the old product page now goes
              // straight into the enrollment, so it is copied, not opened).
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/enroll/product/${productId}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast({ title: t('admin.payments.products.linkCopied', 'Link copied'), description: url });
                  } catch {
                    toast({ title: t('admin.payments.products.linkCopyFailed', 'Failed to copy link'), variant: 'destructive' });
                  }
                }}
                className={kitButton.secondary}
              >
                <Link2 className="h-4 w-4" aria-hidden />
                {t('admin.products.copyEnrollLink', 'Copy enrollment link')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-card px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('common.delete', 'Delete')}
            </button>
          </div>
        </header>

        <ProgramSettingsForm
          program={program}
          onSaved={setProgram}
          initialStep={initialStep}
          extra={{
            courses: {
              label: `${t('lms.program_detail.tab_courses', 'Courses')}${coursesLoading ? '' : ` (${courses.length})`}`,
              node: (
                <ProgramCoursesTab
                  programId={programId}
                  courses={courses}
                  loading={coursesLoading}
                  allCourses={allCourses}
                  onChange={setCourses}
                  reload={loadCourses}
                />
              ),
            },
            students: {
              label: `${t('lms.program_detail.tab_students', 'Clients')}${studentsLoading ? '' : ` (${students.length})`}`,
              node: <ProgramStudentsTab program={program} students={students} loading={studentsLoading} reload={loadStudents} />,
            },
          }}
        />
      </div>

      <ProgramDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        programId={program.id}
        programName={program.name}
        blockedCount={running}
        deleting={deleting}
        onConfirm={() => void remove()}
      />
    </AdminLayout>
  );
}
