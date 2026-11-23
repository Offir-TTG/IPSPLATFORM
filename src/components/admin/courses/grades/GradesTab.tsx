'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Download, Plus, Search, Settings, Users, X } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { ListSearch, QuickPills, SaveBar, kitButton, saveBarText, useLeaveGuard, usePagedList } from '@/components/admin/notifications/kit';
import { computeFinalGrade, type FinalGrade, type FinalGradeRange, type FinalGradeScore } from '@/lib/grading/finalGrade';
import { GradeItemPanel } from './GradeItemPanel';
import { GradeSettingsPanel } from './GradeSettingsPanel';
import { GradeImportPanel } from './GradeImportPanel';
import {
  cellKey,
  parseCell,
  readableOn,
  sameValue,
  savedToRaw,
  savedToValue,
  type CellValue,
  type Client,
  type CourseScale,
  type GradeGroup,
  type GradeItemRow,
  type GradingConfig,
  type SavedGrade,
  type TFn,
} from './types';

const PAGE_SIZE = 25;
type Filter = 'all' | 'missing' | 'below';

const DEFAULT_CONFIG: GradingConfig = { passing_percentage: 60, use_weighted_categories: false };

/**
 * The course's Grades tab (inside the course builder): numbers, search and
 * filters, the gradebook (a row per client, a column per assignment, the final
 * grade), and side panels for an assignment, the grade settings and
 * import / export. Grades are saved together from the floating save bar.
 */
export function GradesTab({ courseId }: { courseId: string }) {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';
  const text = saveBarText(t);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<GradeItemRow[]>([]);
  const [groups, setGroups] = useState<GradeGroup[]>([]);
  const [config, setConfig] = useState<GradingConfig>(DEFAULT_CONFIG);
  const [scale, setScale] = useState<CourseScale | null>(null);
  const [saved, setSaved] = useState<Record<string, SavedGrade>>({});
  /** What was typed in each touched cell. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [itemPanel, setItemPanel] = useState<{ open: boolean; item: GradeItemRow | null }>({ open: false, item: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const base = `/api/admin/lms/courses/${courseId}`;

  // ─── Loading ────────────────────────────────────────────────────────

  const loadItemsAndGroups = useCallback(async () => {
    const [itemsRes, groupsRes] = await Promise.all([fetch(`${base}/grading/items`), fetch(`${base}/grading/categories`)]);
    if (!itemsRes.ok) throw new Error('items');
    const itemsJson = await itemsRes.json();
    const groupsJson = groupsRes.ok ? await groupsRes.json() : { data: [] };
    setItems(
      ((itemsJson.data ?? []) as GradeItemRow[]).map((i) => ({ ...i, max_points: Number(i.max_points), display_order: Number(i.display_order) || 0 })),
    );
    setGroups(
      ((groupsJson.data ?? []) as GradeGroup[]).map((g) => ({
        ...g,
        weight_percentage: Number(g.weight_percentage) || 0,
        drop_lowest: Number(g.drop_lowest) || 0,
        display_order: Number(g.display_order) || 0,
      })),
    );
  }, [base]);

  const loadGrades = useCallback(async () => {
    const res = await fetch(`${base}/grading/grades`);
    if (!res.ok) throw new Error('grades');
    const json = await res.json();
    const map: Record<string, SavedGrade> = {};
    for (const g of (json.data ?? []) as SavedGrade[]) {
      map[cellKey(g.student_id, g.grade_item_id)] = {
        id: g.id,
        grade_item_id: g.grade_item_id,
        student_id: g.student_id,
        points_earned: g.points_earned == null ? null : Number(g.points_earned),
        is_excused: !!g.is_excused,
      };
    }
    setSaved(map);
  }, [base]);

  const loadSettings = useCallback(async () => {
    const [scaleRes, configRes] = await Promise.all([fetch(`${base}/grading/scale`), fetch(`${base}/grading/config`)]);
    const scaleJson = scaleRes.ok ? await scaleRes.json() : null;
    const configJson = configRes.ok ? await configRes.json() : null;
    setScale(
      scaleJson
        ? {
            scale_id: scaleJson.scale_id ?? null,
            scale_name: scaleJson.scale_name ?? null,
            used_tenant_default: !!scaleJson.used_tenant_default,
            ranges: scaleJson.ranges ?? [],
          }
        : null,
    );
    if (configJson?.data) {
      setConfig({
        passing_percentage: Number(configJson.data.passing_percentage),
        use_weighted_categories: !!configJson.data.use_weighted_categories,
      });
    }
  }, [base]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const clientsRes = fetch(`${base}/students`).then(async (r) => {
        if (!r.ok) throw new Error('clients');
        const j = await r.json();
        setClients(j.data ?? []);
      });
      await Promise.all([clientsRes, loadItemsAndGroups(), loadGrades(), loadSettings()]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [base, loadItemsAndGroups, loadGrades, loadSettings]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ─── Derived ────────────────────────────────────────────────────────

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.display_order - b.display_order), [items]);
  const weighted = config.use_weighted_categories;
  const groupName = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups]);
  const ranges: FinalGradeRange[] = useMemo(
    () => (scale?.ranges ?? []).map((r) => ({ grade_label: r.label, min_percentage: r.min, max_percentage: r.max, color_code: r.color })),
    [scale],
  );

  /** The cell's value now: what was typed, else what is saved. A cell with a wrong number counts as its saved value. */
  const valueOf = useCallback(
    (key: string, max: number): CellValue => {
      const raw = drafts[key];
      if (raw === undefined) return savedToValue(saved[key]);
      const v = parseCell(raw, max);
      return v.kind === 'invalid' ? savedToValue(saved[key]) : v;
    },
    [drafts, saved],
  );

  const { changedKeys, invalidKeys } = useMemo(() => {
    const maxOf = new Map(items.map((i) => [i.id, i.max_points]));
    const changed: string[] = [];
    const invalid = new Set<string>();
    for (const [key, raw] of Object.entries(drafts)) {
      const itemId = key.split(':')[1];
      const max = maxOf.get(itemId);
      if (max === undefined) continue;
      const v = parseCell(raw, max);
      if (v.kind === 'invalid') {
        invalid.add(key);
        changed.push(key);
      } else if (!sameValue(v, savedToValue(saved[key]))) changed.push(key);
    }
    return { changedKeys: changed, invalidKeys: invalid };
  }, [drafts, saved, items]);
  const changedSet = useMemo(() => new Set(changedKeys), [changedKeys]);
  const dirty = changedKeys.length > 0;

  const finals = useMemo(() => {
    const m = new Map<string, FinalGrade>();
    for (const c of clients) {
      const scores: Record<string, FinalGradeScore> = {};
      for (const it of items) {
        const v = valueOf(cellKey(c.id, it.id), it.max_points);
        scores[it.id] = v.kind === 'excused' ? { points: null, excused: true } : { points: v.kind === 'points' ? v.points : null };
      }
      m.set(
        c.id,
        computeFinalGrade({
          items: items.map((i) => ({ id: i.id, max_points: i.max_points, category_id: i.category_id, is_extra_credit: i.is_extra_credit })),
          scores,
          categories: groups.map((g) => ({ id: g.id, weight_percentage: g.weight_percentage, drop_lowest: g.drop_lowest })),
          weighted,
          passMark: config.passing_percentage,
          ranges,
        }),
      );
    }
    return m;
  }, [clients, items, groups, weighted, config.passing_percentage, ranges, valueOf]);

  /** Published assignments with no score that aren't exempt, per client. */
  const missingByClient = useMemo(() => {
    const m = new Map<string, number>();
    const published = items.filter((i) => i.is_published);
    for (const c of clients) {
      let n = 0;
      for (const it of published) if (valueOf(cellKey(c.id, it.id), it.max_points).kind === 'empty') n++;
      m.set(c.id, n);
    }
    return m;
  }, [clients, items, valueOf]);

  const stats = useMemo(() => {
    const withGrade = clients.map((c) => finals.get(c.id)).filter((f): f is FinalGrade => !!f && f.percent != null);
    const avg = withGrade.length ? Math.round(withGrade.reduce((a, f) => a + (f.percent ?? 0), 0) / withGrade.length) : null;
    const passing = withGrade.filter((f) => f.passing).length;
    let missing = 0;
    missingByClient.forEach((n) => (missing += n));
    return { avg, passing, graded: withGrade.length, missing };
  }, [clients, finals, missingByClient]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [clients, search]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      missing: searched.filter((c) => (missingByClient.get(c.id) ?? 0) > 0).length,
      below: searched.filter((c) => finals.get(c.id)?.passing === false).length,
    }),
    [searched, missingByClient, finals],
  );

  const filtered = useMemo(() => {
    if (filter === 'missing') return searched.filter((c) => (missingByClient.get(c.id) ?? 0) > 0);
    if (filter === 'below') return searched.filter((c) => finals.get(c.id)?.passing === false);
    return searched;
  }, [searched, filter, missingByClient, finals]);

  const { page, setPage, totalPages, pageItems } = usePagedList(filtered, `${search}|${filter}`, PAGE_SIZE);

  // ─── Editing and saving ─────────────────────────────────────────────

  const guard = useLeaveGuard(dirty, text.leave);

  const setCell = (key: string, raw: string) => setDrafts((d) => ({ ...d, [key]: raw }));

  const discard = () => setDrafts({});

  const save = async () => {
    if (invalidKeys.size > 0) {
      toast({
        title: t('admin.grades.invalidTitle', 'Some grades are not right'),
        description: t('admin.grades.invalidBody', 'The cells marked in red have a number that is not allowed (below 0 or above the max). Fix them or clear them, then save.'),
        variant: 'destructive',
      });
      return;
    }
    const maxOf = new Map(items.map((i) => [i.id, i.max_points]));
    const grades = changedKeys.map((key) => {
      const [studentId, itemId] = key.split(':');
      const max = maxOf.get(itemId) ?? 0;
      const v = parseCell(drafts[key] ?? '', max);
      const old = saved[key];
      const points = v.kind === 'points' ? v.points : null;
      return {
        ...(old?.id ? { id: old.id } : {}),
        grade_item_id: itemId,
        student_id: studentId,
        points_earned: points,
        percentage: points != null && max > 0 ? (points / max) * 100 : null,
        status: v.kind === 'excused' ? 'excused' : points != null ? 'graded' : 'not_submitted',
        is_excused: v.kind === 'excused',
      };
    });
    setSaving(true);
    try {
      const res = await fetch(`${base}/grading/grades/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades }),
      });
      if (!res.ok) throw new Error('save');
      await loadGrades();
      setDrafts({});
      toast({ title: t('admin.grades.saved', 'Grades saved') });
    } catch {
      toast({ title: t('admin.grades.saveFailed', "Couldn't save the grades. Try again."), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Panels ─────────────────────────────────────────────────────────

  const openItem = (item: GradeItemRow | null) => setItemPanel({ open: true, item });
  const closeItem = () => setItemPanel((p) => ({ ...p, open: false }));
  const nextOrder = items.reduce((m, i) => Math.max(m, i.display_order), 0) + 1;
  const gradeCountFor = (itemId: string) => Object.values(saved).filter((g) => g.grade_item_id === itemId).length;

  const afterItemSaved = async () => {
    closeItem();
    try {
      await loadItemsAndGroups();
    } catch {
      /* the table keeps the last list */
    }
    toast({ title: t('admin.grades.item.saved', 'Assignment saved') });
  };

  const afterItemDeleted = async (itemId: string) => {
    closeItem();
    setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k.split(':')[1] !== itemId)));
    try {
      await loadItemsAndGroups();
    } catch {
      /* ignore */
    }
    toast({ title: t('admin.grades.item.deleted', 'Assignment deleted') });
  };

  const afterSettingsSaved = async (partialError?: string) => {
    setSettingsOpen(false);
    try {
      await Promise.all([loadItemsAndGroups(), loadSettings()]);
    } catch {
      /* ignore */
    }
    if (partialError) toast({ title: partialError, variant: 'destructive' });
    else toast({ title: t('admin.grades.settings.saved', 'Settings saved') });
  };

  const afterImport = async (n: number) => {
    setImportOpen(false);
    try {
      await loadGrades();
    } catch {
      /* ignore */
    }
    toast({ title: t('admin.grades.import.applied', '{n} grades updated from the file').replace('{n}', String(n)) });
  };

  // Export: the ticked clients, else the filtered ones, else everyone.
  const exportInfo = useMemo(() => {
    if (selected.size > 0) {
      return { ids: Array.from(selected), label: t('admin.grades.import.exportSelected', 'The {n} clients you ticked.').replace('{n}', String(selected.size)) };
    }
    if (filtered.length > 0 && filtered.length !== clients.length) {
      return { ids: filtered.map((c) => c.id), label: t('admin.grades.import.exportFiltered', 'The {n} clients in the current search and filter.').replace('{n}', String(filtered.length)) };
    }
    return { ids: [] as string[], label: t('admin.grades.import.exportAll', 'All {n} clients in the course.').replace('{n}', String(clients.length)) };
  }, [selected, filtered, clients.length, t]);

  // ─── Selection ──────────────────────────────────────────────────────

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const someFilteredSelected = filtered.some((c) => selected.has(c.id));
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected]);

  const toggleAll = (on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      filtered.forEach((c) => (on ? next.add(c.id) : next.delete(c.id)));
      return next;
    });
  const toggleOne = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // ─── Render ─────────────────────────────────────────────────────────

  const outOf = (it: GradeItemRow) => {
    const g = weighted && it.category_id ? groupName.get(it.category_id) : null;
    return `${t('admin.grades.outOf', 'out of {n}').replace('{n}', String(it.max_points))}${g ? ` · ${g}` : ''}`;
  };

  const cellProps = (c: Client, it: GradeItemRow) => {
    const key = cellKey(c.id, it.id);
    const raw = drafts[key] ?? savedToRaw(saved[key]);
    return {
      raw,
      value: drafts[key] !== undefined ? parseCell(drafts[key], it.max_points) : savedToValue(saved[key]),
      changed: changedSet.has(key),
      invalid: invalidKeys.has(key),
      max: it.max_points,
      label: t('admin.grades.cellLabel', '{item} grade for {client}').replace('{item}', it.name).replace('{client}', c.full_name || c.email),
      onChange: (v: string) => setCell(key, v),
      t,
    };
  };

  const noRanges = !!scale?.scale_id && scale.ranges.length === 0;
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-[18px]" dir={direction}>
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-extrabold [font-family:inherit]">{t('admin.grades.title', 'Grades')}</h2>
          <p className="mt-1 text-[14.5px] text-muted-foreground">
            {t('admin.grades.subtitle', 'Click a cell and type a grade. Click an assignment name to edit it.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSettingsOpen(true)} disabled={loading} className={kitButton.secondary}>
            <Settings className="h-[17px] w-[17px]" aria-hidden />
            {t('admin.grades.settingsButton', 'Grade settings')}
          </button>
          <button type="button" onClick={() => setImportOpen(true)} disabled={loading} className={kitButton.secondary}>
            <Download className="h-[17px] w-[17px]" aria-hidden />
            {t('admin.grades.importExport', 'Import / export')}
          </button>
          <button type="button" onClick={() => openItem(null)} disabled={loading} className={kitButton.primary}>
            <Plus className="h-[17px] w-[17px]" aria-hidden />
            {t('admin.grades.newItem', 'New assignment')}
          </button>
        </div>
      </div>

      {noRanges && (
        <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {t('admin.grades.noRanges', 'The scale "{name}" has no grade ranges yet, so clients will see only a percentage, with no letter.').replace('{name}', scale?.scale_name ?? '')}
            </p>
            <Link href={`/admin/grading/scales/${scale?.scale_id}`} className="mt-1 inline-flex min-h-[32px] items-center font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-300">
              {t('admin.grades.noRangesLink', 'Set up the ranges →')}
            </Link>
          </div>
        </div>
      )}

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Tile value={stats.avg == null ? '—' : String(stats.avg)} label={t('admin.grades.tiles.average', 'Course average')} />
        <Tile
          value={`${stats.passing} / ${stats.graded}`}
          label={t('admin.grades.tiles.passing', 'Passing (pass mark {n})').replace('{n}', String(config.passing_percentage))}
        />
        <Tile value={String(stats.missing)} label={t('admin.grades.tiles.missing', 'Missing grades')} amber={stats.missing > 0} />
        <Tile value={String(items.length)} label={t('admin.grades.tiles.items', 'Assignments')} />
      </div>

      {/* Toolbar + gradebook */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-3">
          <div className="min-w-0 flex-1 basis-60 sm:max-w-xs">
            <ListSearch value={search} onChange={setSearch} placeholder={t('admin.grades.search', 'Search by name or email')} clearLabel={t('admin.grades.clearSearch', 'Clear search')} />
          </div>
          <div className="max-w-full overflow-x-auto">
            <QuickPills<Filter>
              label={t('admin.grades.filter', 'Filter')}
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: t('admin.grades.filterAll', 'All'), count: counts.all },
                { value: 'missing', label: t('admin.grades.filterMissing', 'Missing a grade'), count: counts.missing },
                { value: 'below', label: t('admin.grades.filterBelow', 'Below pass'), count: counts.below },
              ]}
            />
          </div>
          <span className="ms-auto text-[13.5px] text-muted-foreground">{t('admin.grades.perPage', '{n} clients per page').replace('{n}', String(PAGE_SIZE))}</span>
        </div>

        {loading ? (
          <div className="space-y-2 border-t border-border p-4" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : loadError ? (
          <Empty
            icon={AlertTriangle}
            title={t('admin.grades.loadFailed', "Couldn't load the grades")}
            action={
              <button type="button" onClick={() => void loadAll()} className={kitButton.secondary}>
                {t('admin.grades.retry', 'Try again')}
              </button>
            }
          />
        ) : clients.length === 0 ? (
          <Empty icon={Users} title={t('admin.grades.emptyClients', 'No clients are enrolled in this course yet')} text={t('admin.grades.emptyClientsText', 'When clients enroll, they appear here.')} />
        ) : items.length === 0 ? (
          <Empty
            icon={ClipboardList}
            title={t('admin.grades.emptyItems', 'No assignments yet')}
            text={t('admin.grades.emptyItemsText', 'Add the first assignment, and then you can enter grades.')}
            action={
              <button type="button" onClick={() => openItem(null)} className={kitButton.primary}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('admin.grades.newItem', 'New assignment')}
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <Empty icon={Search} title={t('admin.grades.noMatch', 'No client matches the search')} />
        ) : (
          <>
            {/* Wide screens: the gradebook */}
            <div className="hidden overflow-x-auto border-t border-border sm:block">
              <table className="w-full min-w-[860px] border-collapse text-[14.5px]">
                <thead>
                  <tr className="bg-muted/40">
                    <th scope="col" className="sticky start-0 z-10 w-12 bg-card px-3.5 py-3 text-start">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        aria-label={t('admin.grades.selectAll', 'Select all')}
                        checked={allFilteredSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="h-5 w-5 cursor-pointer accent-primary"
                      />
                    </th>
                    <th scope="col" className="sticky start-12 z-10 min-w-[200px] bg-card px-3.5 py-3 text-start font-bold">
                      {t('admin.grades.client', 'Client')}
                    </th>
                    {sortedItems.map((it) => (
                      <th key={it.id} scope="col" className="px-3 py-2.5 text-start font-semibold">
                        <button
                          type="button"
                          onClick={() => openItem(it)}
                          className="flex min-h-[44px] max-w-[180px] flex-col items-start justify-center gap-0.5 rounded-lg text-start hover:text-primary"
                        >
                          <span className="font-bold [overflow-wrap:anywhere]" dir="auto">
                            {it.name}
                          </span>
                          <span className="text-[12.5px] font-medium text-muted-foreground">{outOf(it)}</span>
                        </button>
                      </th>
                    ))}
                    <th scope="col" className="px-3.5 py-3 text-start font-bold">
                      {t('admin.grades.final', 'Final grade')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c) => (
                    <tr key={c.id} className="border-t border-border/70">
                      <td className="sticky start-0 z-10 bg-card px-3.5 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={t('admin.grades.selectClient', 'Select {name}').replace('{name}', c.full_name || c.email)}
                          checked={selected.has(c.id)}
                          onChange={(e) => toggleOne(c.id, e.target.checked)}
                          className="h-5 w-5 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="sticky start-12 z-10 bg-card px-3.5 py-2.5">
                        <div className="font-bold" dir="auto">
                          {c.full_name || c.email}
                        </div>
                        <div className="text-[12.5px] text-muted-foreground" dir="ltr">
                          {c.email}
                        </div>
                      </td>
                      {sortedItems.map((it) => (
                        <td key={it.id} className="px-3 py-2">
                          <GradeCell {...cellProps(c, it)} />
                        </td>
                      ))}
                      <td className="px-3.5 py-2.5">
                        <FinalBadge final={finals.get(c.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone: a card per client */}
            <ul className="divide-y divide-border border-t border-border sm:hidden">
              {pageItems.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={t('admin.grades.selectClient', 'Select {name}').replace('{name}', c.full_name || c.email)}
                      checked={selected.has(c.id)}
                      onChange={(e) => toggleOne(c.id, e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold" dir="auto">
                        {c.full_name || c.email}
                      </div>
                      <div className="truncate text-[12.5px] text-muted-foreground" dir="ltr">
                        {c.email}
                      </div>
                    </div>
                    <FinalBadge final={finals.get(c.id)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {sortedItems.map((it) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <button type="button" onClick={() => openItem(it)} className="min-h-[44px] min-w-0 flex-1 text-start">
                          <span className="block truncate text-sm font-semibold" dir="auto">
                            {it.name}
                          </span>
                          <span className="block text-[12.5px] text-muted-foreground">{outOf(it)}</span>
                        </button>
                        <GradeCell {...cellProps(c, it)} />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            {/* Legend and pages */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13.5px] text-muted-foreground">
              <span>{t('admin.grades.legend', 'Yellow cell = changed and not saved yet · Type "EX" in a cell to mark the client exempt')}</span>
              <span className="flex items-center gap-2">
                <span>
                  {t('admin.grades.pageOf', 'Page {page} of {total}').replace('{page}', String(page)).replace('{total}', String(totalPages))}
                </span>
                {totalPages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      aria-label={t('admin.grades.prevPage', 'Previous page')}
                      className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Prev className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      aria-label={t('admin.grades.nextPage', 'Next page')}
                      className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Next className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* The floating save bar, only while grades are changed. It sits above
          the course page's own bar so the two never cover each other. */}
      {(dirty || saving) && (
        <div className="[&>div]:bottom-16">
          <SaveBar
            isNew={false}
            dirty={dirty}
            saving={saving}
            onSave={() => void save()}
            onDiscard={discard}
            saveLabel={t('admin.grades.save', 'Save')}
            text={{
              ...text.bar,
              dirty:
                changedKeys.length === 1
                  ? t('admin.grades.changedOne', '1 grade changed')
                  : t('admin.grades.changedMany', '{n} grades changed').replace('{n}', String(changedKeys.length)),
              discard: t('admin.grades.discard', 'Discard changes'),
            }}
          />
        </div>
      )}
      {guard.dialog}

      <GradeItemPanel
        open={itemPanel.open}
        courseId={courseId}
        item={itemPanel.item}
        groups={[...groups].sort((a, b) => a.display_order - b.display_order)}
        weighted={weighted}
        nextOrder={nextOrder}
        gradeCount={itemPanel.item ? gradeCountFor(itemPanel.item.id) : 0}
        onClose={closeItem}
        onSaved={() => void afterItemSaved()}
        onDeleted={(id) => void afterItemDeleted(id)}
      />
      <GradeSettingsPanel
        open={settingsOpen}
        courseId={courseId}
        scale={scale}
        config={config}
        groups={groups}
        items={items}
        onClose={() => setSettingsOpen(false)}
        onSaved={(err) => void afterSettingsSaved(err)}
      />
      <GradeImportPanel
        open={importOpen}
        courseId={courseId}
        exportIds={exportInfo.ids}
        exportLabel={exportInfo.label}
        onClose={() => setImportOpen(false)}
        onImported={(n) => void afterImport(n)}
      />
    </div>
  );
}

// ─── Pieces ───────────────────────────────────────────────────────────

function Tile({ value, label, amber }: { value: string; label: string; amber?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        amber ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-border bg-card'
      }`}
    >
      <div className={`text-[26px] font-extrabold leading-tight tabular-nums ${amber ? 'text-amber-800 dark:text-amber-300' : ''}`}>{value}</div>
      <div className={`text-[13.5px] ${amber ? 'text-amber-800/90 dark:text-amber-300/90' : 'text-muted-foreground'}`}>{label}</div>
    </div>
  );
}

function Empty({ icon: Icon, title, text, action }: { icon: typeof Users; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 border-t border-border px-6 py-12 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-primary/10 text-primary" aria-hidden>
        <Icon className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <h3 className="mt-1.5 text-lg font-extrabold [font-family:inherit]">{title}</h3>
      {text && <p className="max-w-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function GradeCell({
  raw,
  value,
  changed,
  invalid,
  max,
  label,
  onChange,
  t,
}: {
  raw: string;
  value: CellValue;
  changed: boolean;
  invalid: boolean;
  max: number;
  label: string;
  onChange: (v: string) => void;
  t: TFn;
}) {
  if (value.kind === 'excused') {
    return (
      <span
        className={`inline-flex h-11 items-center gap-1 rounded-full ps-3 pe-1 text-[12.5px] font-bold ${
          changed ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400 dark:bg-amber-950/50 dark:text-amber-200' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
        }`}
      >
        {t('admin.grades.excused', 'Exempt')}
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('admin.grades.unexcuse', 'Remove exemption: {label}').replace('{label}', label)}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    );
  }
  return (
    <input
      value={raw}
      onChange={(e) => onChange(e.target.value)}
      inputMode="decimal"
      placeholder="—"
      aria-label={label}
      aria-invalid={invalid || undefined}
      title={invalid ? t('admin.grades.cellInvalid', 'A number from 0 to {max}, or "EX" for exempt').replace('{max}', String(max)) : undefined}
      className={`h-11 w-[72px] rounded-[10px] border text-center font-semibold tabular-nums outline-none focus:ring-2 ${
        invalid
          ? 'border-red-500 bg-red-50 text-red-800 focus:ring-red-500/30 dark:bg-red-950/40 dark:text-red-200'
          : changed
            ? 'border-amber-400 bg-amber-50 focus:ring-amber-400/40 dark:bg-amber-950/40'
            : `border-border focus:border-primary focus:ring-primary/20 ${raw === '' ? 'bg-muted/40' : 'bg-card'}`
      }`}
    />
  );
}

function FinalBadge({ final }: { final: FinalGrade | undefined }) {
  if (!final || final.percent == null) return <span className="text-muted-foreground">—</span>;
  const failing = final.passing === false;
  const color = final.letterColor;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <b className={`text-base tabular-nums ${failing ? 'text-red-600 dark:text-red-400' : ''}`}>{Math.round(final.percent)}</b>
      {final.letter && (
        <span
          className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${
            color
              ? ''
              : failing
                ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                : 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300'
          }`}
          style={color ? { background: color, color: readableOn(color) } : undefined}
        >
          {final.letter}
        </span>
      )}
    </span>
  );
}
