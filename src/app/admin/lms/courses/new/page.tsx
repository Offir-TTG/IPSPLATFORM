'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { PageTitle } from '@/components/admin/notifications/kit';
import { CourseSettingsForm } from '@/components/admin/courses/CourseSettingsForm';

/** A new course: the same form as a course's Settings tab. After saving, the course opens on its Structure tab. */
export default function NewCoursePage() {
  const { t, direction } = useAdminLanguage();
  const Back = direction === 'rtl' ? ChevronRight : ChevronLeft;
  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <Link href="/admin/lms/courses" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Back className="h-4 w-4" aria-hidden />
          {t('admin.courses.back', 'Back to Courses')}
        </Link>
        <PageTitle
          icon={BookOpen}
          title={t('admin.courses.new', 'New course')}
          description={t('admin.courses.newIntro', 'Fill in the details. After saving, you can build the modules and lessons.')}
        />
        <CourseSettingsForm course={null} />
      </div>
    </AdminLayout>
  );
}
