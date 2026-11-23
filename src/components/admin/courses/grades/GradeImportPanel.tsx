'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { kitButton } from '@/components/admin/notifications/kit';
import { SidePanel, panelSecondary } from '@/components/admin/courses/builder/SidePanel';

type Preview = {
  change_count: number;
  error_count: number;
  changes: Array<{
    student_name?: string;
    grade_item_name?: string;
    before: { points_earned: number | null; is_excused: boolean } | null;
    after: { points_earned: number | null; is_excused: boolean };
  }>;
  errors: Array<{ row: number; student?: string; column?: string; message: string }>;
};

const SHOWN = 20;

/**
 * Import / export: export the gradebook as CSV (the ticked clients, else the
 * filtered ones, else everyone), download an empty template, and import a CSV
 * with a preview of the changes before they are applied.
 */
export function GradeImportPanel({
  open,
  courseId,
  exportIds,
  exportLabel,
  onClose,
  onImported,
}: {
  open: boolean;
  courseId: string;
  /** Clients to export; empty = everyone. */
  exportIds: string[];
  /** Says who the export holds, e.g. "3 ticked clients". */
  exportLabel: string;
  onClose: () => void;
  onImported: (changeCount: number) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(null);
    setError(null);
  }, [open]);

  const base = `/api/admin/lms/courses/${courseId}/grading/gradebook`;
  const exportHref = exportIds.length ? `${base}/export?student_ids=${exportIds.join(',')}` : `${base}/export`;

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (dryRun) fd.append('dry_run', '1');
      const res = await fetch(`${base}/import`, { method: 'POST', body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((json && typeof json.error === 'string' && json.error) || t('admin.grades.import.failed', "Couldn't read the file. Check that it's a CSV from this page."));
      if (dryRun) setPreview(json as Preview);
      else onImported(Number(json?.change_count) || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.grades.import.failed', "Couldn't read the file. Check that it's a CSV from this page."));
    } finally {
      setBusy(false);
    }
  };

  const show = (v: { points_earned: number | null; is_excused: boolean } | null) =>
    !v ? '—' : v.is_excused ? t('admin.grades.excused', 'Exempt') : v.points_earned ?? '—';

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      busy={busy}
      title={
        <span className="block">
          <span className="block text-[13px] font-semibold text-muted-foreground">{t('admin.grades.title', 'Grades')}</span>
          {t('admin.grades.import.title', 'Import / export')}
        </span>
      }
      footer={
        <button type="button" onClick={onClose} disabled={busy} className={panelSecondary}>
          {t('admin.grades.close', 'Close')}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2 rounded-2xl border border-border p-4">
          <h3 className="text-[15px] font-bold [font-family:inherit]">{t('admin.grades.import.exportTitle', 'Export to a file')}</h3>
          <p className="text-sm text-muted-foreground">{exportLabel}</p>
          <a href={exportHref} download className={`${kitButton.secondary} w-fit`}>
            <Download className="h-4 w-4" aria-hidden />
            {t('admin.grades.import.exportCsv', 'Download CSV')}
          </a>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <h3 className="text-[15px] font-bold [font-family:inherit]">{t('admin.grades.import.importTitle', 'Import from a file')}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              'admin.grades.import.help',
              'Upload a CSV exported from this page. Clients are matched by ID or email and assignments by column name. Empty cells are left as they are; "EXCUSED" marks the client exempt.',
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('admin.grades.import.templateHint', 'First time? Download the template: it has the right columns and a row for every client.')}{' '}
            <a href={`${base}/export?template=1`} download className="inline-flex min-h-[32px] items-center gap-1 font-semibold text-primary hover:underline">
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t('admin.grades.import.template', 'Download template')}
            </a>
          </p>

          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setError(null);
              e.target.value = '';
            }}
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className={kitButton.secondary}>
              <FileUp className="h-4 w-4" aria-hidden />
              {file ? t('admin.grades.import.chooseOther', 'Choose another file') : t('admin.grades.import.choose', 'Choose a file')}
            </button>
            <span className="min-w-0 truncate text-sm text-muted-foreground" dir="auto">
              {file ? file.name : t('admin.grades.import.noFile', 'No file chosen')}
            </span>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}

          {file && !preview && (
            <button type="button" onClick={() => void run(true)} disabled={busy} className={`${kitButton.primary} w-fit`}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('admin.grades.import.preview', 'Check the file')}
            </button>
          )}

          {preview && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                  {t('admin.grades.import.changeCount', '{n} changes').replace('{n}', String(preview.change_count))}
                </span>
                {preview.error_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    {t('admin.grades.import.errorCount', '{n} problems').replace('{n}', String(preview.error_count))}
                  </span>
                )}
              </div>

              {preview.errors.length > 0 && (
                <div>
                  <p className="text-[13px] font-bold text-red-600 dark:text-red-400">{t('admin.grades.import.errors', 'Problems (these rows will be skipped)')}</p>
                  <ul className="mt-1 space-y-1 text-[13px] text-muted-foreground">
                    {preview.errors.slice(0, SHOWN).map((e, i) => (
                      <li key={i}>
                        {e.row > 0 && <span>{t('admin.grades.import.row', 'Row {n}').replace('{n}', String(e.row))}: </span>}
                        {e.student && <span className="font-medium text-foreground">{e.student} · </span>}
                        {e.column && <span>[{e.column}] </span>}
                        {e.message}
                      </li>
                    ))}
                    {preview.errors.length > SHOWN && (
                      <li>{t('admin.grades.import.more', 'And {n} more').replace('{n}', String(preview.errors.length - SHOWN))}</li>
                    )}
                  </ul>
                </div>
              )}

              {preview.changes.length > 0 && (
                <div>
                  <p className="text-[13px] font-bold">{t('admin.grades.import.changes', 'Changes')}</p>
                  <ul className="mt-1 space-y-1 text-[13px]">
                    {preview.changes.slice(0, SHOWN).map((c, i) => (
                      <li key={i}>
                        <span className="font-medium">{c.student_name}</span> · <span className="text-muted-foreground">{c.grade_item_name}</span>:{' '}
                        <span className="text-muted-foreground line-through">{show(c.before)}</span> {direction === 'rtl' ? '←' : '→'}{' '}
                        <span className="font-semibold text-green-700 dark:text-green-400">{show(c.after)}</span>
                      </li>
                    ))}
                    {preview.changes.length > SHOWN && (
                      <li className="text-muted-foreground">{t('admin.grades.import.more', 'And {n} more').replace('{n}', String(preview.changes.length - SHOWN))}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void run(false)} disabled={busy || preview.change_count === 0} className={kitButton.primary}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {t('admin.grades.import.apply', 'Apply {n} changes').replace('{n}', String(preview.change_count))}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </SidePanel>
  );
}
