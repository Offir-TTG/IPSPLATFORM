'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAdminLanguage } from '@/context/AppContext';
import { InlineConfirm, SidePanel, panelPrimary, panelSecondary } from '@/components/admin/courses/builder/SidePanel';
import { errorBorder, fieldClass, toDateInput, type GradeGroup, type GradeItemRow } from './types';

type Form = {
  name: string;
  max_points: string;
  due_date: string;
  category_id: string;
  description: string;
  is_published: boolean;
  is_extra_credit: boolean;
  available_from: string;
  available_until: string;
  allow_late_submission: boolean;
};

const emptyForm: Form = {
  name: '',
  max_points: '100',
  due_date: '',
  category_id: '',
  description: '',
  is_published: true,
  is_extra_credit: false,
  available_from: '',
  available_until: '',
  allow_late_submission: true,
};

function fromItem(item: GradeItemRow | null): Form {
  if (!item) return emptyForm;
  return {
    name: item.name,
    max_points: String(Number(item.max_points)),
    due_date: toDateInput(item.due_date),
    category_id: item.category_id ?? '',
    description: item.description ?? '',
    is_published: !!item.is_published,
    is_extra_credit: !!item.is_extra_credit,
    available_from: toDateInput(item.available_from),
    available_until: toDateInput(item.available_until),
    allow_late_submission: item.allow_late_submission ?? true,
  };
}

/**
 * The assignment side panel: create, edit or delete one grade item.
 * Opened from "New assignment" or from a column title in the gradebook.
 */
export function GradeItemPanel({
  open,
  courseId,
  item,
  groups,
  weighted,
  nextOrder,
  gradeCount,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  courseId: string;
  /** null = a new assignment. */
  item: GradeItemRow | null;
  groups: GradeGroup[];
  /** The group field shows only when weighting by groups is on. */
  weighted: boolean;
  nextOrder: number;
  /** How many grades this assignment already has (it can't be deleted then). */
  gradeCount: number;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: (itemId: string) => void;
}) {
  const { t } = useAdminLanguage();
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(fromItem(item));
    setErrors({});
    setError(null);
    setAskDelete(false);
  }, [open, item]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k] && !(k === 'available_from' && e.available_until)) return e;
      const next = { ...e };
      delete next[k];
      if (k === 'available_from') delete next.available_until;
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('admin.grades.item.nameRequired', 'Write the assignment name');
    const max = Number(form.max_points.replace(',', '.'));
    if (!form.max_points.trim() || !Number.isFinite(max) || max <= 0) {
      e.max_points = t('admin.grades.item.maxRequired', 'Write a number bigger than 0');
    }
    if (form.available_from && form.available_until && form.available_until < form.available_from) {
      e.available_until = t('admin.grades.item.untilBeforeFrom', '"Until" can\'t be before "Available from"');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      max_points: Number(form.max_points.replace(',', '.')),
      due_date: form.due_date || null,
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      is_published: form.is_published,
      is_extra_credit: form.is_extra_credit,
      allow_late_submission: form.allow_late_submission,
    };
    // The group is only changed while weighting is on; otherwise it stays as it was.
    if (weighted) body.category_id = form.category_id || null;
    try {
      const res = item
        ? await fetch(`/api/admin/lms/courses/${courseId}/grading/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/lms/courses/${courseId}/grading/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, course_id: courseId, category_id: weighted ? form.category_id || null : null, display_order: nextOrder }),
          });
      if (!res.ok) throw new Error(t('admin.grades.item.saveFailed', "Couldn't save the assignment. Try again."));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.grades.item.saveFailed', "Couldn't save the assignment. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!item) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lms/courses/${courseId}/grading/items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(
          res.status === 400
            ? t('admin.grades.item.hasGrades', "This assignment already has grades, so it can't be deleted. To hide it from clients, turn off \"Shown to clients\".")
            : t('admin.grades.item.deleteFailed', "Couldn't delete the assignment. Try again."),
        );
      }
      setAskDelete(false);
      onDeleted(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.grades.item.deleteFailed', "Couldn't delete the assignment. Try again."));
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting;
  const label = 'text-sm font-bold';
  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-[13px] font-medium text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      busy={busy}
      title={
        <span className={`block ${item ? 'pe-28' : ''}`}>
          <span className="block text-[13px] font-semibold text-muted-foreground">{t('admin.grades.item.eyebrow', 'Assignment')}</span>
          {item ? form.name || item.name : t('admin.grades.item.newTitle', 'New assignment')}
        </span>
      }
      top={
        item ? (
          <>
            <button
              type="button"
              onClick={() => setAskDelete(true)}
              disabled={busy}
              className="absolute end-14 top-3 inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-card px-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('admin.grades.item.delete', 'Delete')}
            </button>
            {askDelete &&
              (gradeCount > 0 ? (
                <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-semibold">
                    {t('admin.grades.item.hasGrades', "This assignment already has grades, so it can't be deleted. To hide it from clients, turn off \"Shown to clients\".")}
                  </p>
                  <button type="button" onClick={() => setAskDelete(false)} className="mt-2 min-h-[40px] rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted">
                    {t('admin.grades.item.ok', 'OK')}
                  </button>
                </div>
              ) : (
                <InlineConfirm
                  text={t('admin.grades.item.deleteConfirm', 'Delete "{name}"? This cannot be undone.').replace('{name}', item.name)}
                  confirmLabel={deleting ? t('admin.grades.item.deleting', 'Deleting…') : t('admin.grades.item.deleteYes', 'Yes, delete')}
                  cancelLabel={t('admin.grades.cancel', 'Cancel')}
                  onConfirm={() => void remove()}
                  onCancel={() => setAskDelete(false)}
                  busy={deleting}
                />
              ))}
          </>
        ) : undefined
      }
      footer={
        <>
          <button type="button" onClick={() => void save()} disabled={busy} className={panelPrimary}>
            {saving ? t('admin.grades.saving', 'Saving…') : t('admin.grades.save', 'Save')}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className={`${panelSecondary} flex-none`}>
            {t('admin.grades.cancel', 'Cancel')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade-item-name" className={label}>
            {t('admin.grades.item.name', 'Assignment name')} *
          </label>
          <input
            id="grade-item-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={!!errors.name}
            className={`${fieldClass} ${errors.name ? errorBorder : ''}`}
          />
          {fieldError('name')}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grade-item-max" className={label}>
              {t('admin.grades.item.maxPoints', 'Max points')} *
            </label>
            <input
              id="grade-item-max"
              inputMode="decimal"
              value={form.max_points}
              onChange={(e) => set('max_points', e.target.value)}
              aria-invalid={!!errors.max_points}
              className={`${fieldClass} ${errors.max_points ? errorBorder : ''}`}
            />
            {fieldError('max_points')}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grade-item-due" className={label}>
              {t('admin.grades.item.dueDate', 'Due date')}
            </label>
            <input id="grade-item-due" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} className={fieldClass} />
          </div>
        </div>

        {weighted && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grade-item-group" className={label}>
              {t('admin.grades.item.group', 'Group')}
            </label>
            <select id="grade-item-group" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={fieldClass}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {Number(g.weight_percentage)}%
                </option>
              ))}
              <option value="">{t('admin.grades.noGroup', 'No group')}</option>
            </select>
            <p className="text-[13px] text-muted-foreground">{t('admin.grades.item.groupHint', 'Shown only when weighting by groups is on in the settings.')}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade-item-desc" className={label}>
            {t('admin.grades.item.description', 'Description')}{' '}
            <span className="font-medium text-muted-foreground">{t('admin.grades.item.optional', '(optional)')}</span>
          </label>
          <textarea
            id="grade-item-desc"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <SwitchBox
            title={t('admin.grades.item.published', 'Shown to clients')}
            hint={t('admin.grades.item.publishedHint', 'Off = draft, only the staff see it')}
            checked={form.is_published}
            onChange={(v) => set('is_published', v)}
          />
          <SwitchBox
            title={t('admin.grades.item.extraCredit', 'Bonus grade')}
            hint={t('admin.grades.item.extraCreditHint', "Adds to the grade, doesn't hurt those who didn't submit")}
            checked={form.is_extra_credit}
            onChange={(v) => set('is_extra_credit', v)}
          />
        </div>

        <details className="rounded-xl border border-border px-3.5 py-3" open={!!errors.available_until || undefined}>
          <summary className="min-h-[28px] cursor-pointer text-sm font-bold">{t('admin.grades.item.availability', 'Availability and late submission')}</summary>
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label htmlFor="grade-item-from" className="text-[13.5px] font-semibold">
                  {t('admin.grades.item.availableFrom', 'Available from')}
                </label>
                <input id="grade-item-from" type="date" value={form.available_from} onChange={(e) => set('available_from', e.target.value)} className={fieldClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="grade-item-until" className="text-[13.5px] font-semibold">
                  {t('admin.grades.item.availableUntil', 'Until')}
                </label>
                <input
                  id="grade-item-until"
                  type="date"
                  value={form.available_until}
                  min={form.available_from || undefined}
                  onChange={(e) => set('available_until', e.target.value)}
                  aria-invalid={!!errors.available_until}
                  className={`${fieldClass} ${errors.available_until ? errorBorder : ''}`}
                />
              </div>
            </div>
            {fieldError('available_until')}
            <label className="flex min-h-[44px] items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.allow_late_submission}
                onChange={(e) => set('allow_late_submission', e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              {t('admin.grades.item.allowLate', 'Late submission allowed')}
            </label>
          </div>
        </details>
      </div>
    </SidePanel>
  );
}

function SwitchBox({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3">
      <span className="min-w-0">
        <b className="block text-sm">{title}</b>
        <span className="text-[13px] text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
