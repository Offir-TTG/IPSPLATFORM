'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAdminLanguage } from '@/context/AppContext';
import { SidePanel, panelPrimary, panelSecondary } from '@/components/admin/courses/builder/SidePanel';
import { errorBorder, fieldClass, type CourseScale, type GradeGroup, type GradeItemRow, type GradingConfig } from './types';

/** "Use the school's default scale" (the course's scale column is empty). */
const SCHOOL_DEFAULT = '__school_default__';
const PALETTE = ['#5b34a3', '#2f7d8c', '#c2410c', '#15803d', '#be185d', '#1d4ed8', '#a16207'];

type Scale = {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
  scale_type?: string | null;
  grade_ranges?: { grade_label: string; min_percentage: number; max_percentage: number; color_code?: string | null; display_order?: number | null }[];
};

type GroupDraft = {
  /** Local key; equals the id for saved groups. */
  key: string;
  id?: string;
  name: string;
  weight: string;
  drop: number;
  color: string;
};

const num = (s: string) => Number(String(s).replace(',', '.'));

/**
 * Grading settings: the scale, the pass mark, and weighting by groups.
 * Nothing is saved until "Save" in the panel.
 */
export function GradeSettingsPanel({
  open,
  courseId,
  scale,
  config,
  groups,
  items,
  onClose,
  onSaved,
}: {
  open: boolean;
  courseId: string;
  scale: CourseScale | null;
  config: GradingConfig;
  groups: GradeGroup[];
  items: GradeItemRow[];
  onClose: () => void;
  /** After saving (with a message when only part could be saved). */
  onSaved: (partialError?: string) => void;
}) {
  const { t } = useAdminLanguage();
  const [scales, setScales] = useState<Scale[]>([]);
  const [scaleSel, setScaleSel] = useState(SCHOOL_DEFAULT);
  const [pass, setPass] = useState('60');
  const [weighted, setWeighted] = useState(false);
  const [drafts, setDrafts] = useState<GroupDraft[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initialScale = scale?.scale_id && !scale.used_tenant_default ? scale.scale_id : SCHOOL_DEFAULT;

  useEffect(() => {
    if (!open) return;
    setScaleSel(initialScale);
    setPass(String(config.passing_percentage));
    setWeighted(config.use_weighted_categories);
    setDrafts(
      [...groups]
        .sort((a, b) => a.display_order - b.display_order)
        .map((g, i) => ({
          key: g.id,
          id: g.id,
          name: g.name,
          weight: String(Number(g.weight_percentage)),
          drop: Number(g.drop_lowest) || 0,
          color: g.color_code || PALETTE[i % PALETTE.length],
        })),
    );
    setDeleted([]);
    setErrors({});
    setError(null);
    let cancelled = false;
    fetch('/api/admin/grading/scales')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        const list: Scale[] = j.data ?? [];
        setScales(list.filter((s) => s.is_active));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = useMemo(() => drafts.reduce((a, d) => a + (Number.isFinite(num(d.weight)) ? num(d.weight) : 0), 0), [drafts]);
  const totalRounded = Math.round(total * 100) / 100;

  const schoolDefault = scales.find((s) => s.is_default);
  // One card per scale: its name, type and first grades. The school's default first.
  const typeName = (st?: string | null) =>
    st === 'letter'
      ? t('admin.grades.settings.typeLetter', 'Letter grades')
      : st === 'numeric'
        ? t('admin.grades.settings.typeNumeric', 'Numbers')
        : st === 'pass_fail'
          ? t('admin.grades.settings.typePassFail', 'Pass / fail')
          : st
            ? t('admin.grades.settings.typeCustom', 'Custom')
            : '';
  const rangesOf = (sc?: Scale) =>
    [...(sc?.grade_ranges ?? [])]
      .sort((a, b) => Number(b.min_percentage) - Number(a.min_percentage))
      .map((r) => ({ label: r.grade_label, min: Number(r.min_percentage), max: Number(r.max_percentage), color: r.color_code ?? null }));
  const SHOWN = 5;
  const scaleCards = [
    ...(schoolDefault || scale?.used_tenant_default
      ? [
          {
            value: SCHOOL_DEFAULT,
            name: `${t('admin.grades.settings.schoolDefault', "The school's default")}${schoolDefault ? ` · ${schoolDefault.name}` : scale?.scale_name ? ` · ${scale.scale_name}` : ''}`,
            type: typeName(schoolDefault?.scale_type),
            isDefault: true,
            ranges: rangesOf(schoolDefault).slice(0, SHOWN),
            more: Math.max(0, rangesOf(schoolDefault).length - SHOWN),
          },
        ]
      : []),
    ...scales
      .filter((sc) => !sc.is_default)
      .map((sc) => ({ value: sc.id, name: sc.name, type: typeName(sc.scale_type), isDefault: false, ranges: rangesOf(sc).slice(0, SHOWN), more: Math.max(0, rangesOf(sc).length - SHOWN) })),
    // The course's own scale stays choosable before the list loads.
    ...(scaleSel !== SCHOOL_DEFAULT && !scales.some((sc) => sc.id === scaleSel)
      ? [{ value: scaleSel, name: scale?.scale_name ?? '', type: '', isDefault: false, ranges: [], more: 0 }]
      : []),
  ];
  const editScaleId = scaleSel === SCHOOL_DEFAULT ? schoolDefault?.id ?? (scale?.used_tenant_default ? scale.scale_id : null) : scaleSel;

  const itemsIn = (groupId?: string) => (groupId ? items.filter((i) => i.category_id === groupId).length : 0);

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!e[k] && !e.total) return e;
      const n = { ...e };
      delete n[k];
      delete n.total;
      return n;
    });

  const update = (key: string, patch: Partial<GroupDraft>) => {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    if (patch.name !== undefined) clearError(`name-${key}`);
    if (patch.weight !== undefined) clearError(`weight-${key}`);
  };

  const move = (index: number, dir: -1 | 1) =>
    setDrafts((ds) => {
      const j = index + dir;
      if (j < 0 || j >= ds.length) return ds;
      const next = [...ds];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const addGroup = () =>
    setDrafts((ds) => [
      ...ds,
      { key: `new-${Date.now()}`, name: '', weight: String(Math.max(0, Math.round((100 - total) * 100) / 100)), drop: 0, color: PALETTE[ds.length % PALETTE.length] },
    ]);

  const removeGroup = (d: GroupDraft) => {
    setDrafts((ds) => ds.filter((x) => x.key !== d.key));
    if (d.id) setDeleted((x) => [...x, d.id!]);
    clearError(`name-${d.key}`);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const p = num(pass);
    if (!pass.trim() || !Number.isFinite(p) || p < 0 || p > 100) e.pass = t('admin.grades.settings.passInvalid', 'Write a number from 0 to 100');
    if (weighted) {
      for (const d of drafts) {
        if (!d.name.trim()) e[`name-${d.key}`] = t('admin.grades.settings.groupNameRequired', 'Write the group name');
        const w = num(d.weight);
        if (!d.weight.trim() || !Number.isFinite(w) || w < 0 || w > 100) e[`weight-${d.key}`] = t('admin.grades.settings.weightInvalid', 'Weight is a number from 0 to 100');
      }
      if (totalRounded > 100) e.total = t('admin.grades.settings.totalOver', 'The groups add up to more than 100%. Lower some weights.');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    const base = `/api/admin/lms/courses/${courseId}/grading`;
    const fail = t('admin.grades.settings.saveFailed', "Couldn't save the settings. Try again.");
    let wrote = false;
    const send = async (url: string, method: string, body?: unknown) => {
      const res = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.field === 'grading_scale_id' ? t('admin.grades.settings.needScale', 'Choose a grading scale first, then save again.') : fail);
      }
      wrote = true;
    };
    try {
      // 1. The scale, only when it changed.
      if (scaleSel !== initialScale) {
        await send(`${base}/scale`, 'PATCH', { grading_scale_id: scaleSel === SCHOOL_DEFAULT ? null : scaleSel });
      }

      // 2. Pass mark and weighting.
      const passNum = num(pass);
      if (passNum !== config.passing_percentage || weighted !== config.use_weighted_categories) {
        await send(`${base}/config`, 'PUT', { passing_percentage: passNum, use_weighted_categories: weighted });
      }

      // 3. The groups (only while weighting is on).
      if (weighted) {
        // Deleted groups: their assignments move to "No group" first.
        for (const id of deleted) {
          for (const it of items.filter((i) => i.category_id === id)) {
            await send(`${base}/items/${it.id}`, 'PUT', { category_id: null });
          }
          await send(`${base}/categories/${id}`, 'DELETE');
        }

        // Changed groups: lowered weights first, so the total never passes 100% on the way.
        const byId = new Map(groups.map((g) => [g.id, g]));
        const changed = drafts
          .map((d, i) => ({ d, order: i + 1, old: d.id ? byId.get(d.id) : undefined }))
          .filter(
            (x) =>
              x.old &&
              (x.old.name !== x.d.name.trim() ||
                Number(x.old.weight_percentage) !== num(x.d.weight) ||
                (Number(x.old.drop_lowest) || 0) !== x.d.drop ||
                x.old.display_order !== x.order ||
                (x.old.color_code ?? null) !== x.d.color),
          )
          .sort((a, b) => num(a.d.weight) - Number(a.old!.weight_percentage) - (num(b.d.weight) - Number(b.old!.weight_percentage)));
        for (const x of changed) {
          await send(`${base}/categories/${x.d.id}`, 'PUT', {
            name: x.d.name.trim(),
            weight: num(x.d.weight),
            drop_lowest: x.d.drop,
            display_order: x.order,
            color_code: x.d.color,
          });
        }

        // New groups.
        for (const [i, d] of drafts.entries()) {
          if (d.id) continue;
          await send(`${base}/categories`, 'POST', {
            course_id: courseId,
            name: d.name.trim(),
            weight: num(d.weight),
            drop_lowest: d.drop,
            display_order: i + 1,
            color_code: d.color,
          });
        }
      }
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : fail;
      // Part was already saved: close and show what the server has now.
      if (wrote) onSaved(msg);
      else setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const label = 'text-sm font-bold';
  const rowError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-[13px] font-medium text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  const totalBadge =
    totalRounded === 100
      ? { cls: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300', text: t('admin.grades.settings.totalOk', 'Total 100% ✓') }
      : totalRounded < 100
        ? { cls: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', text: t('admin.grades.settings.totalLeft', '{n}% left').replace('{n}', String(Math.round((100 - totalRounded) * 100) / 100)) }
        : { cls: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300', text: t('admin.grades.settings.totalOverBadge', '{n}% over 100').replace('{n}', String(Math.round((totalRounded - 100) * 100) / 100)) };

  const iconBtn =
    'grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      busy={saving}
      title={
        <span className="block">
          <span className="block text-[13px] font-semibold text-muted-foreground">{t('admin.grades.title', 'Grades')}</span>
          {t('admin.grades.settings.title', 'Grade settings')}
        </span>
      }
      footer={
        <>
          <button type="button" onClick={() => void save()} disabled={saving} className={panelPrimary}>
            {saving ? t('admin.grades.saving', 'Saving…') : t('admin.grades.save', 'Save')}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className={`${panelSecondary} flex-none`}>
            {t('admin.grades.cancel', 'Cancel')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <span id="grade-scale-label" className={label}>
            {t('admin.grades.settings.scale', 'Grading scale')}
          </span>
          <div role="radiogroup" aria-labelledby="grade-scale-label" className="grid gap-2">
            {scaleCards.map((c) => {
              const on = scaleSel === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setScaleSel(c.value)}
                  className={`flex w-full flex-col gap-1.5 rounded-xl border p-3 text-start transition-colors ${
                    on ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/60'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <b className="text-[15px]">{c.name}</b>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {c.isDefault && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                          {t('admin.grades.settings.defaultTag', 'Default')}
                        </span>
                      )}
                      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? 'border-primary' : 'border-border'}`} aria-hidden>
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                    </span>
                  </span>
                  {c.type && <span className="text-[13px] text-muted-foreground">{c.type}</span>}
                  {c.ranges.length > 0 && (
                    <span className="flex flex-wrap gap-1">
                      {c.ranges.map((r) => (
                        <span
                          key={r.label}
                          className="rounded-md px-1.5 py-0.5 text-[12px] font-semibold tabular-nums"
                          style={{ background: `${r.color ?? '#6b6480'}1f`, color: r.color ?? undefined }}
                        >
                          {r.label} · {r.min}–{r.max}
                        </span>
                      ))}
                      {c.more > 0 && <span className="px-1 text-[12px] text-muted-foreground">+{c.more}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {editScaleId && (
            <Link href={`/admin/grading/scales/${editScaleId}`} className="inline-flex min-h-[32px] w-fit items-center text-[13.5px] font-semibold text-primary hover:underline">
              {t('admin.grades.settings.editScale', 'Edit the scale →')}
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade-pass" className={label}>
            {t('admin.grades.settings.passMark', 'Pass mark')}
          </label>
          <span className="flex items-center gap-2">
            <input
              id="grade-pass"
              inputMode="decimal"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                clearError('pass');
              }}
              aria-invalid={!!errors.pass}
              className={`${fieldClass} w-28 ${errors.pass ? errorBorder : ''}`}
            />
            <span className="text-muted-foreground">%</span>
          </span>
          {rowError('pass')}
          <p className="text-[13px] text-muted-foreground">{t('admin.grades.settings.passHint', 'Below this the grade shows in red, and appears in the "Below pass" filter.')}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <b className="block text-[15px]">{t('admin.grades.settings.weighted', 'Weight by groups')}</b>
              <span className="text-[13px] text-muted-foreground">
                {t('admin.grades.settings.weightedHint', 'For example: tests 60%, assignments 40%. Off = all points count together.')}
              </span>
            </span>
            <Switch checked={weighted} onCheckedChange={setWeighted} aria-label={t('admin.grades.settings.weighted', 'Weight by groups')} />
          </div>

          {weighted && (
            <>
              {drafts.map((d, i) => (
                <div key={d.key} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
                    <input
                      value={d.name}
                      onChange={(e) => update(d.key, { name: e.target.value })}
                      aria-label={t('admin.grades.settings.groupName', 'Group name')}
                      placeholder={t('admin.grades.settings.groupNamePlaceholder', 'e.g. Tests')}
                      aria-invalid={!!errors[`name-${d.key}`]}
                      className={`${fieldClass} min-w-0 flex-1 ${errors[`name-${d.key}`] ? errorBorder : ''}`}
                    />
                    <input
                      value={d.weight}
                      inputMode="decimal"
                      onChange={(e) => update(d.key, { weight: e.target.value })}
                      aria-label={t('admin.grades.settings.weight', 'Weight')}
                      aria-invalid={!!errors[`weight-${d.key}`]}
                      className={`${fieldClass} w-[72px] text-center ${errors[`weight-${d.key}`] ? errorBorder : ''}`}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  {rowError(`name-${d.key}`)}
                  {rowError(`weight-${d.key}`)}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 text-[13.5px] text-foreground/80">
                      {t('admin.grades.settings.dropBefore', "Don't count the")}
                      <span className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => update(d.key, { drop: Math.max(0, d.drop - 1) })}
                          disabled={d.drop <= 0}
                          aria-label={t('admin.grades.settings.dropLess', 'Fewer')}
                          className="grid h-10 w-10 place-items-center hover:bg-muted disabled:opacity-35"
                        >
                          <Minus className="h-4 w-4" aria-hidden />
                        </button>
                        <b className="w-8 text-center tabular-nums" aria-live="polite">{d.drop}</b>
                        <button
                          type="button"
                          onClick={() => update(d.key, { drop: Math.min(Math.max(5, itemsIn(d.id)), d.drop + 1) })}
                          disabled={d.drop >= Math.max(5, itemsIn(d.id))}
                          aria-label={t('admin.grades.settings.dropMore', 'More')}
                          className="grid h-10 w-10 place-items-center hover:bg-muted disabled:opacity-35"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </span>
                      {t('admin.grades.settings.dropAfter', 'lowest grades')}
                    </span>
                    <span className="ms-auto flex gap-1.5">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('admin.grades.settings.moveUp', 'Move up')} className={iconBtn}>
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === drafts.length - 1}
                        aria-label={t('admin.grades.settings.moveDown', 'Move down')}
                        className={iconBtn}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGroup(d)}
                        aria-label={t('admin.grades.settings.deleteGroup', 'Delete group')}
                        className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={addGroup} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                  <Plus className="h-4 w-4" aria-hidden />
                  {t('admin.grades.settings.addGroup', 'Group')}
                </button>
                {drafts.length > 0 && <span className={`rounded-full px-3 py-1 text-[13.5px] font-bold tabular-nums ${totalBadge.cls}`}>{totalBadge.text}</span>}
              </div>
              {rowError('total')}
              <p className="text-[12.5px] text-muted-foreground">{t('admin.grades.settings.deleteNote', 'When you delete a group, its assignments move to "No group".')}</p>
            </>
          )}
        </div>
      </div>
    </SidePanel>
  );
}
