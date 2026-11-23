'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Translate } from './types';

interface Preview {
  lessons: number;
  topics: number;
  meetings: number;
  attendance: number;
  held_with_attendance: number;
  other_modules: { id: string; title: string }[];
}

type Choice = 'move' | 'delete';

/** The move target that means "a new module, named here". */
const NEW = '__new__';

/**
 * Delete a module. An empty module only asks to confirm. A module with
 * lessons asks what happens to them: move them to another module of the
 * course (the default), or delete them too, with a list of exactly what
 * goes. When it's the course's only module, moving isn't possible.
 */
export function ModuleDeleteDialog({
  module,
  onClose,
  onDeleted,
  t,
  direction,
}: {
  /** The module to delete; null = closed. `prevId` is the module above it, the default place to move lessons. */
  module: { id: string; title: string; prevId?: string | null } | null;
  onClose: () => void;
  /** After a successful delete, with the message to show. */
  onDeleted: (message: string) => void;
  t: Translate;
  direction: 'ltr' | 'rtl';
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [target, setTarget] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ui = useRef(t);
  ui.current = t;

  useEffect(() => {
    setPreview(null);
    setLoadError(false);
    setChoice(null);
    setTarget('');
    setNewTitle('');
    setError(null);
    if (!module) return;
    let live = true;
    void (async () => {
      try {
        const res = await fetch(`/api/lms/modules/${module.id}/delete-preview`);
        const json = await res.json();
        if (!live) return;
        if (!json.success) return setLoadError(true);
        const p: Preview = json.data;
        setPreview(p);
        // Moving is the default; with no other module, into a new one named here.
        setChoice('move');
        setTarget(p.other_modules.length === 0 ? NEW : p.other_modules.some((m) => m.id === module.prevId) ? (module.prevId as string) : p.other_modules[0].id);
      } catch {
        if (live) setLoadError(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [module]);

  const n = preview?.lessons ?? 0;
  const hasOthers = (preview?.other_modules.length ?? 0) > 0;
  const toNew = target === NEW;
  const name = module?.title ?? '';

  const confirm = async () => {
    if (!module || busy) return;
    if (n > 0 && !choice) {
      setError(ui.current('admin.courses.builder.deleteModule.chooseFirst', 'Choose what to do with the lessons.'));
      return;
    }
    if (n > 0 && choice === 'move' && toNew && !newTitle.trim()) {
      setError(ui.current('admin.courses.builder.deleteModule.newNameRequired', 'Write a name for the new module.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lms/modules/${module.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          n > 0
            ? choice === 'move'
              ? toNew
                ? { lessons: 'move', new_module_title: newTitle.trim() }
                : { lessons: 'move', target_module_id: target }
              : { lessons: 'delete' }
            : {},
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) {
        setError(
          json.error === 'lesson_delete_failed'
            ? ui.current('admin.courses.builder.deleteModule.partial', 'Only {done} of {total} lessons were deleted, so the module was kept. Try again.')
                .replace('{done}', String(json.deleted ?? 0))
                .replace('{total}', String(json.total ?? n))
            : ui.current('lms.module.delete_failed', 'Failed to delete module'),
        );
        return;
      }
      const targetName = toNew ? newTitle.trim() : (preview?.other_modules.find((m) => m.id === target)?.title ?? '');
      onDeleted(
        n > 0 && choice === 'move'
          ? ui.current('admin.courses.builder.deleteModule.movedDone', 'The module was deleted. Its lessons moved to "{module}".').replace('{module}', targetName)
          : ui.current('lms.module.deleted_success', 'Module deleted successfully'),
      );
    } catch {
      setError(ui.current('lms.module.delete_failed', 'Failed to delete module'));
    } finally {
      setBusy(false);
    }
  };

  const option = (value: Choice, danger: boolean, disabled: boolean, title: string, hint: string, children?: React.ReactNode) => {
    const on = choice === value;
    return (
      <div
        className={`rounded-xl border p-3 transition-colors ${
          on ? (danger ? 'border-red-500 bg-red-50 ring-1 ring-red-500 dark:bg-red-950/30' : 'border-primary bg-primary/5 ring-1 ring-primary') : 'border-border'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <label className={`flex items-start gap-2.5 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="radio"
            name="module-lessons"
            className={`mt-1 h-4 w-4 shrink-0 ${danger ? 'accent-red-600' : 'accent-primary'}`}
            checked={on}
            disabled={disabled || busy}
            onChange={() => {
              setChoice(value);
              setError(null);
            }}
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">{title}</span>
            <span className="block text-[13px] text-muted-foreground">{hint}</span>
          </span>
        </label>
        {on && children && <div className="mt-3 space-y-2">{children}</div>}
      </div>
    );
  };

  const countRow = (label: string, value: number) =>
    value > 0 ? (
      <li className="flex justify-between gap-3 text-[13px] text-foreground">
        <span>{label}</span>
        <span className="font-bold tabular-nums">{value}</span>
      </li>
    ) : null;

  return (
    <AlertDialog open={!!module} onOpenChange={(o) => !o && !busy && onClose()}>
      <AlertDialogContent dir={direction} className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="text-start sm:text-start">
          <span className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" aria-hidden>
            <Trash2 className="h-6 w-6" />
          </span>
          <AlertDialogTitle className="[font-family:inherit]">
            {t('admin.courses.builder.deleteModule.title', 'Delete the module "{name}"?').replace('{name}', name)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!preview
              ? loadError
                ? t('admin.courses.builder.deleteModule.loadError', 'Could not check the module. Close and try again.')
                : t('admin.courses.builder.deleteModule.checking', 'Checking the lessons in this module...')
              : n === 0
                ? t('admin.courses.builder.deleteModule.empty', 'It has no lessons. This cannot be undone.')
                : (n === 1
                    ? t('admin.courses.builder.deleteModule.hasOne', 'It has 1 lesson. What should happen to it?')
                    : t('admin.courses.builder.deleteModule.hasMany', 'It has {n} lessons. What should happen to them?').replace('{n}', String(n)))}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!preview && !loadError && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}

        {preview && n > 0 && (
          <div className="space-y-2.5" role="radiogroup" aria-label={t('admin.courses.builder.deleteModule.whatToDo', 'What to do with the lessons')}>
            {option(
              'move',
              false,
              false,
              t('admin.courses.builder.deleteModule.move', 'Move the lessons to another module'),
              hasOthers
                ? t('admin.courses.builder.deleteModule.moveHint', 'Lessons, topics, meetings and attendance stay as they are.')
                : t('admin.courses.builder.deleteModule.noOtherNew', 'There is no other module in this course, so a new one is created in its place.'),
              <>
                {hasOthers && (
                  <>
                    <Label htmlFor="move-target" className="sr-only">
                      {t('admin.courses.builder.deleteModule.moveTo', 'Move to')}
                    </Label>
                    <Select
                      value={target}
                      onValueChange={(v) => {
                        setTarget(v);
                        setError(null);
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger id="move-target" dir={direction} className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir={direction}>
                        {preview.other_modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW} className="font-semibold text-primary">
                          {t('admin.courses.builder.deleteModule.newOption', '+ A new module')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {toNew && (
                  <div className="space-y-1.5">
                    <Label htmlFor="move-new-title">{t('admin.courses.builder.deleteModule.newName', 'Name of the new module')} *</Label>
                    <Input
                      id="move-new-title"
                      value={newTitle}
                      maxLength={200}
                      autoFocus
                      disabled={busy}
                      aria-invalid={!!error && !newTitle.trim()}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        setError(null);
                      }}
                      placeholder={t('lms.builder.module_title_placeholder', 'e.g., Introduction to Parenting')}
                      className="bg-card"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {toNew
                    ? t('admin.courses.builder.deleteModule.newEnd', 'The new module goes where this one was, with the lessons in the same order.')
                    : t('admin.courses.builder.deleteModule.moveEnd', 'They are added at the end of that module, in the same order.')}
                </p>
              </>,
            )}
            {option(
              'delete',
              true,
              false,
              t('admin.courses.builder.deleteModule.deleteToo', 'Delete the lessons too'),
              choice === 'delete'
                ? t('admin.courses.builder.deleteModule.willGo', 'This is deleted for good:')
                : (n === 1
                    ? t('admin.courses.builder.deleteModule.oneGoes', '1 lesson will be deleted for good.')
                    : t('admin.courses.builder.deleteModule.manyGo', '{n} lessons will be deleted for good.').replace('{n}', String(n))),
              <>
                <ul className="space-y-1">
                  {countRow(t('admin.courses.builder.deleteModule.cLessons', 'Lessons'), preview.lessons)}
                  {countRow(t('admin.courses.builder.deleteModule.cTopics', 'Topics inside the lessons'), preview.topics)}
                  {countRow(t('admin.courses.builder.deleteModule.cMeetings', 'Video meetings, cancelled in Zoom or Daily too'), preview.meetings)}
                  {countRow(t('admin.courses.builder.deleteModule.cAttendance', 'Attendance records'), preview.attendance)}
                </ul>
                {preview.held_with_attendance > 0 && (
                  <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[13px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {t('admin.courses.builder.deleteModule.heldWarn', '{n} lessons already have attendance. To keep it, move the lessons instead.').replace(
                      '{n}',
                      String(preview.held_with_attendance),
                    )}
                  </p>
                )}
              </>,
            )}
          </div>
        )}

        {error && <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{error}</p>}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={busy}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          {preview && (
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy || (n > 0 && !choice)}
              className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${
                n > 0 && choice === 'move' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {n === 0 || !choice
                ? t('common.delete', 'Delete')
                : choice === 'move'
                  ? t('admin.courses.builder.deleteModule.moveAndDelete', 'Move and delete the module')
                  : n === 1
                    ? t('admin.courses.builder.deleteModule.deleteOne', 'Delete the module and 1 lesson')
                    : t('admin.courses.builder.deleteModule.deleteMany', 'Delete the module and {n} lessons').replace('{n}', String(n))}
            </button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
