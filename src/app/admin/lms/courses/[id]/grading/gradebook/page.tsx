'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Upload,
  Calculator,
  Save,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { GradingTabsNav } from '@/components/admin/grading/GradingTabsNav';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useHelp } from '@/hooks/useHelp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TabPagination } from '@/components/admin/users/activity/TabPagination';
import { Slider } from '@/components/ui/slider';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface GradeItem {
  id: string;
  name: string;
  max_points: number;
  category_id: string | null;
  category_name?: string;
  display_order: number;
}

interface StudentGrade {
  id?: string;
  grade_item_id: string;
  student_id: string;
  points_earned: number | null;
  percentage: number | null;
  status: string;
  is_excused: boolean;
}

const PAGE_SIZE = 25;

export default function GradebookPage() {
  useHelp('gradebook');
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [students, setStudents] = useState<Student[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [grades, setGrades] = useState<Map<string, StudentGrade>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());

  // Search/filter/pagination state. Resetting `page` to 1 whenever the
  // filtered population changes keeps the user on a valid page.
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  // Grade filter — bounds the student's total percentage. Both inputs
  // are optional: empty = no constraint on that side. Filters on the
  // raw number so it doesn't depend on the tenant's grading scale.
  const [gradeMin, setGradeMin] = useState<string>('');
  const [gradeMax, setGradeMax] = useState<string>('');
  const [page, setPage] = useState(1);
  // Selective export — admin ticks individual student rows; when at
  // least one row is selected the Export button passes ?student_ids=…
  // and exports only those. Empty selection exports everyone.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Import dialog state.
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  // Hidden file input that the custom "Choose file" button triggers.
  // Replaces the native control whose "Choose file" / "No file chosen"
  // labels are owned by the browser locale and can't be translated.
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPreview, setImportPreview] = useState<{
    change_count: number;
    error_count: number;
    changes: Array<any>;
    errors: Array<any>;
  } | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  useEffect(() => {
    loadGradebookData();
  }, [courseId]);

  // Reset page when filters trim the student list.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, gradeMin, gradeMax]);

  async function loadGradebookData() {
    try {
      setLoading(true);

      const studentsRes = await fetch(`/api/admin/lms/courses/${courseId}/students`);
      if (!studentsRes.ok) throw new Error('Failed to load students');
      const studentsData = await studentsRes.json();

      const itemsRes = await fetch(`/api/admin/lms/courses/${courseId}/grading/items`);
      if (!itemsRes.ok) throw new Error('Failed to load grade items');
      const itemsData = await itemsRes.json();

      const gradesRes = await fetch(`/api/admin/lms/courses/${courseId}/grading/grades`);
      if (!gradesRes.ok) throw new Error('Failed to load grades');
      const gradesData = await gradesRes.json();

      setStudents(studentsData.data || []);
      setGradeItems(itemsData.data || []);

      const gradesMap = new Map<string, StudentGrade>();
      (gradesData.data || []).forEach((grade: StudentGrade) => {
        const key = `${grade.student_id}-${grade.grade_item_id}`;
        gradesMap.set(key, grade);
      });
      setGrades(gradesMap);
    } catch (error) {
      console.error('Error loading gradebook data:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.grading.gradebook.error.load', 'Failed to load gradebook data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleGradeChange(studentId: string, gradeItemId: string, value: string) {
    const key = `${studentId}-${gradeItemId}`;
    const gradeItem = gradeItems.find((item) => item.id === gradeItemId);
    if (!gradeItem) return;

    const pointsEarned = value === '' ? null : parseFloat(value);
    const percentage =
      pointsEarned !== null ? (pointsEarned / gradeItem.max_points) * 100 : null;

    const existingGrade = grades.get(key);
    const updatedGrade: StudentGrade = {
      ...existingGrade,
      grade_item_id: gradeItemId,
      student_id: studentId,
      points_earned: pointsEarned,
      percentage,
      status: pointsEarned !== null ? 'graded' : 'not_submitted',
      is_excused: existingGrade?.is_excused || false,
    };

    const newGrades = new Map(grades);
    newGrades.set(key, updatedGrade);
    setGrades(newGrades);

    const newEditedCells = new Set(editedCells);
    newEditedCells.add(key);
    setEditedCells(newEditedCells);
  }

  async function handleSaveGrades() {
    if (editedCells.size === 0) {
      toast({
        title: t('common.info', 'Info'),
        description: t('admin.grading.gradebook.noChanges', 'No changes to save'),
      });
      return;
    }

    try {
      setSaving(true);
      const gradesToSave = Array.from(editedCells)
        .map((key) => grades.get(key))
        .filter(Boolean);

      const response = await fetch(`/api/admin/lms/courses/${courseId}/grading/grades/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToSave }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save grades');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.grading.gradebook.success.saved', 'Grades saved successfully'),
      });

      setEditedCells(new Set());
      loadGradebookData();
    } catch (error: any) {
      console.error('Error saving grades:', error);
      toast({
        title: t('common.error', 'Error'),
        description:
          error.message || t('admin.grading.gradebook.error.save', 'Failed to save grades'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function calculateStudentTotal(studentId: string): {
    earned: number;
    possible: number;
    percentage: number;
  } {
    let totalEarned = 0;
    let totalPossible = 0;

    gradeItems.forEach((item) => {
      const key = `${studentId}-${item.id}`;
      const grade = grades.get(key);

      if (grade?.points_earned !== null && grade?.points_earned !== undefined) {
        totalEarned += grade.points_earned;
      }
      totalPossible += item.max_points;
    });

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    return { earned: totalEarned, possible: totalPossible, percentage };
  }

  // Visible grade items honor the category filter so the table doesn't
  // also need to render irrelevant columns when the admin is focused on
  // one category.
  const visibleItems = useMemo(() => {
    const sorted = [...gradeItems].sort((a, b) => a.display_order - b.display_order);
    if (categoryFilter === 'all') return sorted;
    if (categoryFilter === 'uncategorized') return sorted.filter((i) => !i.category_id);
    return sorted.filter((i) => i.category_id === categoryFilter);
  }, [gradeItems, categoryFilter]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    gradeItems.forEach((i) => {
      if (i.category_id && i.category_name) map.set(i.category_id, i.category_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [gradeItems]);

  // Search applies to both name and email so an admin can paste either.
  // Grade min/max bound the student's total percentage; either side
  // empty = no constraint. An empty student total counts as 0 for the
  // filter — students with no graded items don't pass any range that
  // excludes 0.
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = gradeMin === '' ? null : Number(gradeMin);
    const max = gradeMax === '' ? null : Number(gradeMax);
    const minOk = (n: number) => min === null || Number.isNaN(min) || n >= min;
    const maxOk = (n: number) => max === null || Number.isNaN(max) || n <= max;
    return students.filter((s) => {
      if (q && !s.full_name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) {
        return false;
      }
      if (min !== null || max !== null) {
        const pct = calculateStudentTotal(s.id).percentage;
        if (!minOk(pct) || !maxOk(pct)) return false;
      }
      return true;
    });
    // calculateStudentTotal closes over grades/gradeItems — re-evaluate
    // when either changes so the filter stays consistent with the cells.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, search, gradeMin, gradeMax, grades, gradeItems]);

  const pagedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, page]);

  function handleExport() {
    // Export always respects the active filters — the admin sees N
    // students after search/category/grade-range, the CSV holds those
    // same N. Explicit row selection overrides the filter view (so the
    // admin can tick a handful and export just those). When neither
    // filter nor selection is active, the full course exports.
    const base = `/api/admin/lms/courses/${courseId}/grading/gradebook/export`;
    let idsToExport: string[];
    if (selectedIds.size > 0) {
      idsToExport = Array.from(selectedIds);
    } else if (filteredStudents.length !== students.length) {
      idsToExport = filteredStudents.map((s) => s.id);
    } else {
      idsToExport = [];
    }
    const url = idsToExport.length > 0
      ? `${base}?student_ids=${idsToExport.join(',')}`
      : base;
    window.location.href = url;
  }

  async function runImport(dryRun: boolean) {
    if (!importFile) return;
    setImportBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      if (dryRun) fd.append('dry_run', '1');
      const res = await fetch(
        `/api/admin/lms/courses/${courseId}/grading/gradebook/import`,
        { method: 'POST', body: fd },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Import failed');

      if (dryRun) {
        setImportPreview(json);
      } else {
        toast({
          title: t('common.success', 'Success'),
          description: t(
            'admin.grading.gradebook.import.applied',
            '{{n}} grade changes applied',
          ).replace('{{n}}', String(json.change_count)),
        });
        setImportOpen(false);
        setImportFile(null);
        setImportPreview(null);
        loadGradebookData();
      }
    } catch (e: any) {
      toast({
        title: t('common.error', 'Error'),
        description: e?.message ?? 'Import failed',
        variant: 'destructive',
      });
    } finally {
      setImportBusy(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl p-4 md:p-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-4 md:p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/lms/courses/${courseId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Calculator className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                {t('admin.grading.gradebook.title', 'Gradebook')}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {t('admin.grading.gradebook.subtitle', 'Manage student grades for this course')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>
                {selectedIds.size > 0
                  ? t('admin.grading.gradebook.exportSelected', 'Export ({{n}})').replace(
                      '{{n}}',
                      String(selectedIds.size),
                    )
                  : t('admin.grading.gradebook.export', 'Export')}
              </span>
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{t('admin.grading.gradebook.import', 'Import')}</span>
            </Button>
            <Button onClick={handleSaveGrades} disabled={saving || editedCells.size === 0}>
              <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>
                {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}{' '}
                {editedCells.size > 0 && `(${editedCells.size})`}
              </span>
            </Button>
          </div>
        </div>

        <GradingTabsNav courseId={courseId} active="gradebook" />

        {/* Toolbar — search + category + grade range slider + count,
            all on one row at >= sm. The slider is compact (160px) so
            it fits next to the other filters; clicking either thumb
            lets the admin drag, arrow-key, or mouse-wheel scroll. */}
        {students.length > 0 && gradeItems.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRtl ? 'right-3' : 'left-3'}`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.grading.gradebook.searchPlaceholder', 'Search students by name or email')}
                className={isRtl ? 'pr-9' : 'pl-9'}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRtl ? 'left-3' : 'right-3'}`}
                  aria-label={t('common.clear', 'Clear')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('admin.grading.gradebook.allCategories', 'All categories')}
                  </SelectItem>
                  <SelectItem value="uncategorized">
                    {t('admin.grading.gradebook.uncategorized', 'Uncategorized')}
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground shrink-0">
                {t('admin.grading.gradebook.gradeRange', 'Grade')}
              </span>
              <Slider
                value={[
                  gradeMin === '' ? 0 : Number(gradeMin),
                  gradeMax === '' ? 100 : Number(gradeMax),
                ]}
                onValueChange={([lo, hi]) => {
                  setGradeMin(lo === 0 ? '' : String(lo));
                  setGradeMax(hi === 100 ? '' : String(hi));
                }}
                min={0}
                max={100}
                step={1}
                className="w-40"
              />
              <span className="text-xs tabular-nums text-muted-foreground shrink-0" dir="ltr">
                {gradeMin === '' ? '0' : gradeMin}–{gradeMax === '' ? '100' : gradeMax}
              </span>
              {(gradeMin !== '' || gradeMax !== '') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGradeMin('');
                    setGradeMax('');
                  }}
                  aria-label={t('common.clear', 'Clear')}
                  className="h-7 w-7 p-0 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground tabular-nums sm:ms-auto">
              {t('admin.grading.gradebook.studentCount', '{{n}} students').replace(
                '{{n}}',
                String(filteredStudents.length),
              )}
              {filteredStudents.length !== students.length && (
                <span> · {t('common.of', 'of')} {students.length}</span>
              )}
            </div>
          </div>
        )}

        {/* Gradebook table */}
        {students.length === 0 || gradeItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('admin.grading.gradebook.empty.title', 'No Data Available')}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? t(
                      'admin.grading.gradebook.empty.noStudents',
                      'No students enrolled in this course',
                    )
                  : t(
                      'admin.grading.gradebook.empty.noItems',
                      'No grade items created for this course',
                    )}
              </p>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {t('admin.grading.gradebook.noMatches', 'No students match your search')}
            </CardContent>
          </Card>
        ) : (
          <>
            <ResponsiveTable>
              <ResponsiveTable.Desktop>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="sticky left-0 z-20 bg-muted p-2 border-r w-10 text-center">
                              {/* Select-all checkbox — ticks every
                                  student in the currently-filtered set
                                  (across pages), so the admin can
                                  filter, select-all, and export. */}
                              <input
                                type="checkbox"
                                aria-label={t('admin.grading.gradebook.selectAll', 'Select all')}
                                checked={
                                  filteredStudents.length > 0 &&
                                  filteredStudents.every((s) => selectedIds.has(s.id))
                                }
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (e.target.checked) {
                                    filteredStudents.forEach((s) => next.add(s.id));
                                  } else {
                                    filteredStudents.forEach((s) => next.delete(s.id));
                                  }
                                  setSelectedIds(next);
                                }}
                                className="h-4 w-4 cursor-pointer accent-primary"
                              />
                            </th>
                            <th className="sticky z-20 bg-muted p-3 text-start font-semibold border-r min-w-[200px] text-xs uppercase tracking-wider text-muted-foreground" style={{ [isRtl ? 'right' : 'left']: '2.5rem' } as any}>
                              {t('admin.grading.gradebook.student', 'Student')}
                            </th>
                            {visibleItems.map((item) => (
                              <th
                                key={item.id}
                                className="p-3 text-center font-semibold border-r min-w-[120px]"
                              >
                                {/* dir="auto" so Hebrew/English titles
                                    flow correctly in mixed-locale
                                    gradebooks. `/max` lives on its own
                                    LTR line so digits never bidi-wrap. */}
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs truncate max-w-[120px]" title={item.name} dir="auto">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground tabular-nums" dir="ltr">
                                    /{item.max_points}
                                  </span>
                                  {item.category_name && (
                                    <span className="text-[10px] text-muted-foreground/80 truncate max-w-[120px]" dir="auto">
                                      {item.category_name}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th className="sticky right-0 z-20 bg-muted p-3 text-center font-semibold min-w-[120px] text-xs uppercase tracking-wider text-muted-foreground">
                              {t('admin.grading.gradebook.grade', 'Grade')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedStudents.map((student) => {
                            const total = calculateStudentTotal(student.id);
                            const isSelected = selectedIds.has(student.id);
                            return (
                              <tr key={student.id} className="border-t hover:bg-muted/30">
                                <td className="sticky left-0 z-10 bg-background p-2 border-r text-center">
                                  <input
                                    type="checkbox"
                                    aria-label={t('admin.grading.gradebook.selectStudent', 'Select student')}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const next = new Set(selectedIds);
                                      if (e.target.checked) next.add(student.id);
                                      else next.delete(student.id);
                                      setSelectedIds(next);
                                    }}
                                    className="h-4 w-4 cursor-pointer accent-primary"
                                  />
                                </td>
                                <td className="sticky z-10 bg-background p-3 border-r" style={{ [isRtl ? 'right' : 'left']: '2.5rem' } as any}>
                                  <div>
                                    <p className="font-medium text-sm truncate" dir="auto">
                                      {student.full_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate" dir="ltr">
                                      {student.email}
                                    </p>
                                  </div>
                                </td>
                                {visibleItems.map((item) => {
                                  const key = `${student.id}-${item.id}`;
                                  const grade = grades.get(key);
                                  const isEdited = editedCells.has(key);

                                  return (
                                    <td key={item.id} className="p-2 border-r">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={item.max_points}
                                        value={grade?.points_earned ?? ''}
                                        onChange={(e) =>
                                          handleGradeChange(student.id, item.id, e.target.value)
                                        }
                                        className={`text-center tabular-nums h-9 ${
                                          isEdited
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                            : ''
                                        }`}
                                        placeholder="—"
                                      />
                                      {grade?.percentage !== null &&
                                        grade?.percentage !== undefined && (
                                          <p className="text-[10px] text-center text-muted-foreground mt-1 tabular-nums">
                                            {grade.percentage.toFixed(1)}%
                                          </p>
                                        )}
                                    </td>
                                  );
                                })}
                                <td className="sticky right-0 z-10 bg-background p-3 text-center border-l">
                                  <div className="flex flex-col items-center gap-1">
                                    <p className="font-semibold text-sm tabular-nums">
                                      {total.earned.toFixed(1)} / {total.possible.toFixed(1)}
                                    </p>
                                    <Badge
                                      variant={total.percentage >= 60 ? 'default' : 'destructive'}
                                      className="text-xs tabular-nums"
                                    >
                                      {total.percentage.toFixed(1)}%
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </ResponsiveTable.Desktop>

              <ResponsiveTable.Mobile className="space-y-3">
                {pagedStudents.map((student) => {
                  const total = calculateStudentTotal(student.id);
                  return (
                    <Card key={student.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate" dir="auto">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" dir="ltr">
                            {student.email}
                          </p>
                        </div>
                        <div className="space-y-2 border-t pt-3">
                          {visibleItems.map((item) => {
                            const key = `${student.id}-${item.id}`;
                            const grade = grades.get(key);
                            const isEdited = editedCells.has(key);
                            return (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    /{item.max_points}
                                    {grade?.percentage !== null &&
                                      grade?.percentage !== undefined && (
                                        <span className={isRtl ? 'mr-2' : 'ml-2'}>
                                          ({grade.percentage.toFixed(1)}%)
                                        </span>
                                      )}
                                  </p>
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={item.max_points}
                                  value={grade?.points_earned ?? ''}
                                  onChange={(e) =>
                                    handleGradeChange(student.id, item.id, e.target.value)
                                  }
                                  className={`w-24 text-center shrink-0 tabular-nums ${
                                    isEdited
                                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                      : ''
                                  }`}
                                  placeholder="—"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between border-t pt-3">
                          <p className="text-sm font-semibold tabular-nums">
                            {total.earned.toFixed(1)} / {total.possible.toFixed(1)}
                          </p>
                          <Badge
                            variant={total.percentage >= 60 ? 'default' : 'destructive'}
                            className="tabular-nums"
                          >
                            {total.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ResponsiveTable.Mobile>
            </ResponsiveTable>

            <TabPagination
              page={page}
              total={filteredStudents.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              loading={loading}
            />
          </>
        )}

        {/* Import dialog — file pick → dry-run preview → commit. */}
        <Dialog
          open={importOpen}
          onOpenChange={(open) => {
            setImportOpen(open);
            if (!open) {
              setImportFile(null);
              setImportPreview(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('admin.grading.gradebook.import.title', 'Import grades from CSV')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'admin.grading.gradebook.import.help',
                  'Upload a CSV exported from this gradebook. The importer matches students by Student ID or Email and grade items by column name. Empty cells are left alone; "EXCUSED" marks the grade as excused.',
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                {/* Native file input is offscreen — we render our own
                    translated label + button + filename next to it. */}
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportPreview(null);
                  }}
                  disabled={importBusy}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => importFileInputRef.current?.click()}
                    disabled={importBusy}
                  >
                    {t('admin.grading.gradebook.import.chooseFile', 'Choose file')}
                  </Button>
                  <span className="text-xs text-muted-foreground truncate max-w-[260px]" dir="auto">
                    {importFile
                      ? importFile.name
                      : t('admin.grading.gradebook.import.noFileChosen', 'No file chosen')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t(
                    'admin.grading.gradebook.import.templateHint',
                    "First time? Download the template — it's pre-filled with the right columns and one row per enrolled student.",
                  )}{' '}
                  <a
                    href={`/api/admin/lms/courses/${courseId}/grading/gradebook/export?template=1`}
                    className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    {t('admin.grading.gradebook.import.downloadTemplate', 'Download template')}
                  </a>
                </p>
              </div>

              {importPreview && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto rounded-lg border p-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {t(
                        'admin.grading.gradebook.import.changeCount',
                        '{{n}} changes',
                      ).replace('{{n}}', String(importPreview.change_count))}
                    </span>
                    {importPreview.error_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {t(
                          'admin.grading.gradebook.import.errorCount',
                          '{{n}} issues',
                        ).replace('{{n}}', String(importPreview.error_count))}
                      </span>
                    )}
                  </div>

                  {importPreview.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-destructive">
                        {t('admin.grading.gradebook.import.errors', 'Issues')}
                      </p>
                      <ul className="text-xs space-y-1">
                        {importPreview.errors.slice(0, 20).map((e, i) => (
                          <li key={i} className="text-muted-foreground">
                            {e.row > 0 && (
                              <span className="font-mono">row {e.row}: </span>
                            )}
                            {e.student && (
                              <span className="font-medium">{e.student} — </span>
                            )}
                            {e.column && (
                              <span className="text-muted-foreground/80">[{e.column}] </span>
                            )}
                            {e.message}
                          </li>
                        ))}
                        {importPreview.errors.length > 20 && (
                          <li className="text-muted-foreground italic">
                            … and {importPreview.errors.length - 20} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importPreview.changes.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">
                        {t('admin.grading.gradebook.import.changes', 'Changes')}
                      </p>
                      <ul className="text-xs space-y-1">
                        {importPreview.changes.slice(0, 20).map((c, i) => (
                          <li key={i}>
                            <span className="font-medium">{c.student_name}</span> ·{' '}
                            <span className="text-muted-foreground">{c.grade_item_name}</span>
                            {': '}
                            <span className="text-muted-foreground line-through">
                              {c.before
                                ? c.before.is_excused
                                  ? 'EXCUSED'
                                  : c.before.points_earned ?? '—'
                                : '—'}
                            </span>{' '}
                            →{' '}
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {c.after.is_excused
                                ? 'EXCUSED'
                                : c.after.points_earned}
                            </span>
                          </li>
                        ))}
                        {importPreview.changes.length > 20 && (
                          <li className="text-muted-foreground italic">
                            … and {importPreview.changes.length - 20} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => setImportOpen(false)}
                disabled={importBusy}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              {!importPreview ? (
                <Button
                  variant="outline"
                  onClick={() => runImport(true)}
                  disabled={!importFile || importBusy}
                >
                  {importBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('admin.grading.gradebook.import.preview', 'Preview changes')
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportPreview(null);
                    }}
                    disabled={importBusy}
                  >
                    {t('admin.grading.gradebook.import.choose', 'Choose different file')}
                  </Button>
                  <Button
                    onClick={() => runImport(false)}
                    disabled={importBusy || importPreview.change_count === 0}
                  >
                    {importBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('admin.grading.gradebook.import.apply', 'Apply {{n}} changes').replace(
                        '{{n}}',
                        String(importPreview.change_count),
                      )
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

