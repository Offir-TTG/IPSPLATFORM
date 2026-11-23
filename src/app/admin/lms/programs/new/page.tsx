'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { PageTitle } from '@/components/admin/notifications/kit';
import { ProgramSettingsForm } from '@/components/admin/programs/ProgramSettingsForm';
import { ProgramCoursesTab } from '@/components/admin/programs/ProgramCoursesTab';
import { ProgramStudentsTab, enrollInProgram } from '@/components/admin/programs/ProgramStudentsTab';
import type { Course, Program, ProgramCourse, Student } from '@/components/admin/programs/types';

/**
 * A new program, all in one wizard: details, courses, students, size and
 * status. The courses and students are kept here until Create; then the
 * program is saved, the courses are added in the chosen order and the
 * students are enrolled, and the program opens on the same step.
 */
export default function NewProgramPage() {
  const { t, direction } = useAdminLanguage();
  const Back = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/lms/courses');
        const data = await res.json();
        setAllCourses(data.success ? data.data || [] : []);
      } catch {
        setAllCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, []);

  /** Saves the chosen courses (in order) and enrolls the chosen students; returns how many failed. */
  const afterCreate = async (program: Program) => {
    let failed = 0;
    for (const [i, pc] of courses.entries()) {
      try {
        const res = await fetch(`/api/admin/programs/${program.id}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: pc.course.id, is_required: pc.is_required, order: i }),
        });
        if (!res.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }
    for (const s of students) {
      try {
        await enrollInProgram(program, s.user_id);
      } catch {
        failed += 1;
      }
    }
    return failed;
  };

  // The students step only needs a name for its texts until the program exists.
  const draftProgram: Program = { id: '', name: t('admin.programs.new', 'New program'), description: null, image_url: null, is_active: true, duration_weeks: null, max_students: null };

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <Link href="/admin/lms/programs" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Back className="h-4 w-4" aria-hidden />
          {t('lms.program_detail.back_to_programs', 'Back to Programs')}
        </Link>
        <PageTitle
          icon={BookOpen}
          title={t('lms.programs.create_dialog_title', 'Create New Program')}
          description={t('admin.programs.newIntroAll', 'Go through the steps and press Create at the end. The courses and clients you choose are added together with the program.')}
        />
        <ProgramSettingsForm
          program={null}
          extra={{
            courses: {
              label: `${t('lms.program_detail.tab_courses', 'Courses')}${courses.length ? ` (${courses.length})` : ''}`,
              node: <ProgramCoursesTab programId={null} courses={courses} loading={coursesLoading} allCourses={allCourses} onChange={setCourses} reload={() => undefined} />,
            },
            students: {
              label: `${t('lms.program_detail.tab_students', 'Clients')}${students.length ? ` (${students.length})` : ''}`,
              node: <ProgramStudentsTab program={draftProgram} students={students} loading={false} reload={() => undefined} draft onChange={setStudents} />,
            },
            afterCreate,
          }}
        />
      </div>
    </AdminLayout>
  );
}
