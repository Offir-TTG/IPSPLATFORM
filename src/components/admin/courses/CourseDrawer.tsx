'use client';

import Link from 'next/link';
import { Copy, Eye, EyeOff, ImageIcon, Pencil, Power } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DrawerDetails,
  DrawerLead,
  DrawerSection,
  DrawerShell,
  DrawerStat,
  DrawerQuickEdit,
  saveDrawerEdit,
  type DrawerEditValues,
  drawerButton,
  drawerPrimary,
} from '@/components/admin/drawer-kit';
import { COURSE_TYPE_FALLBACK, courseStatus, dateRange, personName, type AdminCourse } from './types';

export type CourseQuickAction = 'active' | 'published' | 'duplicate';

/**
 * A short look at one course, from the Courses list: type, dates, status,
 * program and instructor, description, and quick actions: open the course,
 * turn it on or off, show or hide it from students, and duplicate it.
 */
export function CourseDrawer({
  course,
  busy,
  onClose,
  onAction,
  onUpdated,
}: {
  course: AdminCourse | null;
  /** The quick action that is saving right now, if any. */
  busy: CourseQuickAction | null;
  onClose: () => void;
  onAction: (course: AdminCourse, action: CourseQuickAction) => void;
  /** The description was saved: the list shows the new text. */
  onUpdated?: (course: AdminCourse) => void;
}) {
  const { t, language } = useAdminLanguage();
  const { toast } = useToast();

  const saveEdit = async (values: DrawerEditValues) => {
    if (!course) return false;
    try {
      const saved = await saveDrawerEdit({
        values,
        currentImageUrl: course.image_url,
        uploadUrl: '/api/lms/courses/upload-image',
        uploadIdField: 'courseId',
        itemId: course.id,
        patchUrl: `/api/lms/courses/${course.id}`,
        nameField: 'title',
      });
      onUpdated?.({ ...course, title: saved.name, description: saved.description, image_url: saved.image_url });
      toast({ title: t('common.success', 'Success'), description: t('lms.msg.update_success', 'Updated successfully') });
      return true;
    } catch (error) {
      const reason = error instanceof Error ? ` (${error.message})` : '';
      toast({ title: t('common.error', 'Error'), description: `${t('admin.courses.drawer.saveError', 'The change was not saved. Try again.')}${reason}`, variant: 'destructive' });
      return false;
    }
  };
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const c = course;

  const st = c ? courseStatus(c) : 'inactive';
  const statusText =
    st === 'published' ? t('lms.course.published', 'Published') : st === 'draft' ? t('lms.course.draft', 'Draft') : t('lms.courses.inactive', 'Inactive');
  const statusTone =
    st === 'published' ? 'text-green-700 dark:text-green-400' : st === 'draft' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground';
  const typeText = c?.course_type
    ? t(`lms.course.type_${c.course_type}`, COURSE_TYPE_FALLBACK[c.course_type as keyof typeof COURSE_TYPE_FALLBACK] ?? c.course_type)
    : t('products.type.course', 'Course');
  const dates = c ? dateRange(c.start_date, c.end_date, locale) : '';
  const yes = t('admin.products.drawer.yes', 'Yes');
  const no = t('admin.products.drawer.no', 'No');

  return (
    <DrawerShell
      open={!!c}
      onClose={onClose}
      status={`${typeText} · ${statusText}`}
      statusDot={st === 'published' ? 'bg-green-500' : st === 'draft' ? 'bg-amber-500' : 'bg-slate-400'}
      lead={<DrawerLead imageUrl={c?.image_url} icon={<ImageIcon className="h-5 w-5" />} />}
      title={c?.title ?? ''}
      description={t('admin.courses.drawer.description', 'Course summary')}
      stats={
        c && (
          <>
            <DrawerStat label={t('admin.courses.filter.type', 'Type')} value={typeText} small />
            <DrawerStat label={t('admin.courses.drawer.starts', 'Starts')} value={dates ? dates.split(' – ')[0] : '—'} small />
            <DrawerStat label={t('admin.payments.products.status', 'Status')} value={statusText} small className={statusTone} />
          </>
        )
      }
      footer={
        c && (
          <>
            <Link href={`/admin/lms/courses/${c.id}`} className={drawerPrimary}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t('admin.courses.drawer.open', 'Open course')}
            </Link>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onAction(c, 'active')} disabled={busy !== null} className={drawerButton}>
                <Power className="h-4 w-4" aria-hidden />
                {c.is_active ? t('admin.courses.drawer.deactivate', 'Turn off') : t('admin.courses.drawer.activate', 'Turn on')}
              </button>
              <button
                type="button"
                onClick={() => onAction(c, 'published')}
                disabled={busy !== null || !c.is_active}
                title={!c.is_active ? t('admin.courses.drawer.turnOnFirst', 'Turn the course on first') : undefined}
                className={drawerButton}
              >
                {c.is_published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                {c.is_published ? t('admin.courses.drawer.hide', 'Hide') : t('admin.courses.drawer.publish', 'Publish')}
              </button>
              <button type="button" onClick={() => onAction(c, 'duplicate')} disabled={busy !== null} className={drawerButton}>
                <Copy className="h-4 w-4" aria-hidden />
                {t('admin.courses.duplicate', 'Duplicate')}
              </button>
            </div>
          </>
        )
      }
    >
      {c && (
        <>
          <DrawerSection title={t('admin.notifications.drawer.details', 'Details')}>
            <DrawerDetails
              rows={[
                { label: t('lms.courses.program', 'Program'), value: c.program?.name || t('admin.courses.noProgram', 'No program') },
                { label: t('admin.courses.drawer.instructor', 'Instructor'), value: personName(c.instructor) || '—' },
                { label: t('admin.courses.col.dates', 'Dates'), value: dates || '—' },
                { label: t('admin.courses.drawer.visible', 'Clients can see it'), value: c.is_active && c.is_published ? yes : no },
                { label: t('admin.courses.standaloneChip', 'Standalone'), value: c.is_standalone ? yes : no },
              ]}
            />
          </DrawerSection>
          <DrawerQuickEdit
            key={c.id}
            title={t('admin.products.drawer.about', 'Description')}
            nameLabel={t('lms.courses.course_title', 'Course Title')}
            name={c.title}
            imageUrl={c.image_url}
            html={c.description ?? ''}
            maxImageBytes={20 * 1024 * 1024}
            onSave={saveEdit}
          />
        </>
      )}
    </DrawerShell>
  );
}
