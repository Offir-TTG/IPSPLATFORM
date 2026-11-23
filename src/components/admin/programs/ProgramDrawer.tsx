'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ImageIcon, Loader2, Pencil, Power, Trash2, Users } from 'lucide-react';
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
import type { Program } from './types';
import { ProgramDeleteDialog } from './ProgramDeleteDialog';

/**
 * A short look at one program, from the Programs list: status, students,
 * courses, its details and description, and quick actions: open the
 * program, turn it on or off, jump to its courses or students.
 */
export function ProgramDrawer({
  program,
  busy,
  onClose,
  onToggleActive,
  onUpdated,
  onDelete,
}: {
  program: Program | null;
  /** True while the on/off change is saving. */
  busy: boolean;
  onClose: () => void;
  onToggleActive: (program: Program) => void;
  /** The description was saved: the list shows the new text. */
  onUpdated?: (program: Program) => void;
  /** Deletes the program; resolves true when it was deleted. */
  onDelete?: (program: Program) => Promise<boolean>;
}) {
  const { t, language, direction } = useAdminLanguage();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveEdit = async (values: DrawerEditValues) => {
    if (!program) return false;
    try {
      const saved = await saveDrawerEdit({
        values,
        currentImageUrl: program.image_url,
        uploadUrl: '/api/programs/upload-image',
        uploadIdField: 'programId',
        itemId: program.id,
        patchUrl: `/api/programs/${program.id}`,
        nameField: 'name',
      });
      onUpdated?.({ ...program, name: saved.name, description: saved.description, image_url: saved.image_url });
      toast({ title: t('common.success', 'Success'), description: t('lms.programs.updated', 'Program updated successfully') });
      return true;
    } catch (error) {
      const reason = error instanceof Error ? ` (${error.message})` : '';
      toast({ title: t('common.error', 'Error'), description: `${t('admin.courses.drawer.saveError', 'The change was not saved. Try again.')}${reason}`, variant: 'destructive' });
      return false;
    }
  };
  const p = program;
  const num = (n: number) => n.toLocaleString();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const statusText = p?.is_active ? t('lms.programs.active', 'Active') : t('lms.programs.inactive', 'Inactive');
  const students = p?.student_count ?? 0;

  return (
    <DrawerShell
      open={!!p}
      onClose={onClose}
      status={`${t('products.type.program', 'Program')} · ${statusText}`}
      statusDot={p?.is_active ? 'bg-green-500' : 'bg-slate-400'}
      lead={<DrawerLead imageUrl={p?.image_url} icon={<ImageIcon className="h-5 w-5" />} />}
      title={p?.name ?? ''}
      description={t('admin.programs.drawer.description', 'Program summary')}
      stats={
        p && (
          <>
            <DrawerStat
              label={t('lms.program_detail.tab_students', 'Clients')}
              value={p.max_students ? `${num(students)} / ${num(p.max_students)}` : num(students)}
            />
            <DrawerStat label={t('lms.program_detail.tab_courses', 'Courses')} value={num(p.course_count ?? 0)} />
            <DrawerStat
              label={t('admin.payments.products.status', 'Status')}
              value={statusText}
              small
              className={p.is_active ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}
            />
          </>
        )
      }
      footer={
        p && (
          <>
            <Link href={`/admin/lms/programs/${p.id}`} className={drawerPrimary}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t('admin.programs.drawer.open', 'Open program')}
            </Link>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onToggleActive(p)} disabled={busy} className={drawerButton}>
                <Power className="h-4 w-4" aria-hidden />
                {p.is_active ? t('admin.programs.drawer.deactivate', 'Turn off') : t('admin.programs.drawer.activate', 'Turn on')}
              </button>
              <Link href={`/admin/lms/programs/${p.id}?step=courses`} className={drawerButton}>
                <BookOpen className="h-4 w-4" aria-hidden />
                {t('lms.program_detail.tab_courses', 'Courses')}
              </Link>
              <Link href={`/admin/lms/programs/${p.id}?step=students`} className={drawerButton}>
                <Users className="h-4 w-4" aria-hidden />
                {t('lms.program_detail.tab_students', 'Clients')}
              </Link>
            </div>
            {onDelete && (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-card px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t('lms.programs.delete_dialog_title', 'Delete Program')}
                </button>
                <ProgramDeleteDialog
                  open={confirmDelete}
                  onOpenChange={setConfirmDelete}
                  programId={p.id}
                  programName={p.name}
                  blockedCount={p.active_count ?? 0}
                  deleting={deleting}
                  onConfirm={async () => {
                    setDeleting(true);
                    const ok = await onDelete(p);
                    setDeleting(false);
                    if (ok) setConfirmDelete(false);
                  }}
                />
              </>
            )}
          </>
        )
      }
    >
      {p && (
        <>
          <DrawerSection title={t('admin.notifications.drawer.details', 'Details')}>
            <DrawerDetails
              rows={[
                {
                  label: t('admin.programs.col.duration', 'Duration'),
                  value: p.duration_weeks ? `${p.duration_weeks} ${t('lms.programs.weeks', 'weeks')}` : '—',
                },
                {
                  label: t('lms.programs.max_students', 'Max Clients'),
                  value: p.max_students ? num(p.max_students) : t('admin.programs.noLimit', 'no limit'),
                },
                {
                  label: t('admin.programs.drawer.placesLeft', 'Places left'),
                  value: p.max_students ? num(Math.max(0, p.max_students - students)) : '—',
                },
                ...(p.created_at
                  ? [
                      {
                        label: t('admin.programs.drawer.created', 'Created'),
                        value: new Date(p.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
                      },
                    ]
                  : []),
                {
                  label: t('admin.programs.drawer.offered', 'Offered to new clients'),
                  value: p.is_active ? t('admin.products.drawer.yes', 'Yes') : t('admin.products.drawer.no', 'No'),
                },
              ]}
            />
          </DrawerSection>
          <DrawerQuickEdit
            key={p.id}
            title={t('admin.products.drawer.about', 'Description')}
            nameLabel={t('lms.programs.name', 'Program Name')}
            name={p.name}
            imageUrl={p.image_url}
            html={p.description ?? ''}
            maxImageBytes={5 * 1024 * 1024}
            onSave={saveEdit}
          />
        </>
      )}
    </DrawerShell>
  );
}
