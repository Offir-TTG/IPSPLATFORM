'use client';

import Link from 'next/link';
import { AlertTriangle, Loader2, Trash2, Users } from 'lucide-react';
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

/**
 * What Delete opens, from the drawer and the program page. While students
 * are still enrolled (active or waiting) it explains why the program can't
 * be deleted and leads to them; otherwise it asks to confirm.
 */
export function ProgramDeleteDialog({
  open,
  onOpenChange,
  programId,
  programName,
  blockedCount,
  deleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
  /** Enrollments still running; above 0 the program can't be deleted. */
  blockedCount: number;
  deleting: boolean;
  onConfirm: () => void;
}) {
  const { t, direction } = useAdminLanguage();
  const blocked = blockedCount > 0;
  return (
    <AlertDialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
      <AlertDialogContent dir={direction}>
        <AlertDialogHeader>
          <span
            className={`mb-1 grid h-12 w-12 place-items-center rounded-2xl ${blocked ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'}`}
            aria-hidden
          >
            {blocked ? <AlertTriangle className="h-6 w-6" /> : <Trash2 className="h-6 w-6" />}
          </span>
          <AlertDialogTitle className="[font-family:inherit]">
            {blocked ? t('admin.programs.delete.blockedTitle', "This program can't be deleted yet") : t('lms.programs.delete_dialog_title', 'Delete Program')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? t('admin.programs.delete.blocked', "Can't be deleted while {n} clients are enrolled (active or waiting). Cancel their enrollments first.").replace('{n}', String(blockedCount))
              : t('admin.programs.delete.confirm', 'Delete "{name}"? Its courses stay; they are only removed from the program. This cannot be undone.').replace('{name}', programName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {blocked ? (
            <>
              <AlertDialogCancel>{t('common.close', 'Close')}</AlertDialogCancel>
              <Link
                href={`/admin/lms/programs/${programId}?step=students`}
                onClick={() => onOpenChange(false)}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Users className="h-4 w-4" aria-hidden />
                {t('admin.programs.delete.seeStudents', 'See the clients')}
              </Link>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={deleting}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
                {t('common.delete', 'Delete')}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
