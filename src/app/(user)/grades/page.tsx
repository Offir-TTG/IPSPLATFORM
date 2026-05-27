'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useUserLanguage } from '@/context/AppContext';
import type { RecentGrade } from '@/hooks/useDashboard';

type GradeFilter = 'all' | 'graded' | 'pending' | 'excused';
const PAGE_SIZE = 10;

export default function GradesPage() {
  const { t, language, direction } = useUserLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = language === 'he';
  const locale = language === 'he' ? he : enUS;

  const [grades, setGrades] = useState<RecentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GradeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  // Course filter — `'all'` shows every course. The per-course
  // /courses/[id]/grades route redirects here with ?course=<id> so old
  // bookmarks land pre-filtered.
  const [courseFilter, setCourseFilter] = useState<string>(
    searchParams.get('course') ?? 'all',
  );
  // Toolbar — search (item name + course name) and grade range (0–100).
  // Empty string for either range bound means "no constraint on that
  // side" (so an empty filter shows everything).
  const [search, setSearch] = useState('');
  const [gradeMin, setGradeMin] = useState<string>('');
  const [gradeMax, setGradeMax] = useState<string>('');

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, courseFilter, search, gradeMin, gradeMax]);

  // Keep the URL in sync so the filter survives a refresh and can be
  // deep-linked. `scroll: false` prevents an annoying jump-to-top.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (courseFilter === 'all') params.delete('course');
    else params.set('course', courseFilter);
    const qs = params.toString();
    router.replace(qs ? `/grades?${qs}` : '/grades', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter]);

  async function fetchGrades() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/grades');
      if (!res.ok) throw new Error('Failed to load grades');
      const json = await res.json();
      setGrades(json.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load grades');
    } finally {
      setLoading(false);
    }
  }

  const isGraded = (g: RecentGrade) =>
    !g.is_excused && g.status === 'graded' && g.percentage != null;

  // Unique courses across the whole dataset feed the course-filter
  // dropdown. `.filter(Boolean)` drops any rows with a null course_id
  // (orphaned grade items — rare but real).
  const courseOptions = useMemo(() => {
    const seen = new Map<string, string>();
    grades.forEach((g) => {
      if (g.course_id && !seen.has(g.course_id)) {
        seen.set(g.course_id, g.course_name || g.course_id);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [grades]);

  // Apply ALL toolbar filters (course, search, grade range) BEFORE
  // counting + tab-filtering so the stats cards and tab badges always
  // reflect what's actually visible. The tab is the LAST filter
  // applied (Graded / Pending / Excused) so its counts represent
  // "what would match this tab WITHIN the active toolbar filters".
  const courseFilteredGrades = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = gradeMin === '' ? null : Number(gradeMin);
    const max = gradeMax === '' ? null : Number(gradeMax);

    return grades.filter((g) => {
      if (courseFilter !== 'all' && g.course_id !== courseFilter) return false;
      if (q) {
        const haystack = `${g.grade_item_name ?? ''} ${g.course_name ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Range filter applies to the row's percentage only. Ungraded /
      // excused rows (percentage = null) drop out of the filtered set
      // when EITHER bound is set, because there's no comparable value.
      if (min !== null || max !== null) {
        if (g.percentage == null) return false;
        const pct = Number(g.percentage);
        if (min !== null && pct < min) return false;
        if (max !== null && pct > max) return false;
      }
      return true;
    });
  }, [grades, courseFilter, search, gradeMin, gradeMax]);

  const counts = {
    all: courseFilteredGrades.length,
    graded: courseFilteredGrades.filter(isGraded).length,
    pending: courseFilteredGrades.filter((g) => !g.is_excused && !isGraded(g)).length,
    excused: courseFilteredGrades.filter((g) => g.is_excused).length,
  };

  // Average % across graded, non-excused items only — within the
  // current course filter.
  const avgPct = useMemo(() => {
    const gradedOnly = courseFilteredGrades.filter(isGraded);
    if (gradedOnly.length === 0) return null;
    const sum = gradedOnly.reduce((acc, g) => acc + Number(g.percentage ?? 0), 0);
    return Math.round(sum / gradedOnly.length);
  }, [courseFilteredGrades]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'graded':
        return courseFilteredGrades.filter(isGraded);
      case 'pending':
        return courseFilteredGrades.filter((g) => !g.is_excused && !isGraded(g));
      case 'excused':
        return courseFilteredGrades.filter((g) => g.is_excused);
      default:
        return courseFilteredGrades;
    }
  }, [courseFilteredGrades, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedGrades = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-screen pb-12 p-4 md:p-0" dir={direction}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir={direction}>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">
            {t('user.grades.errorTitle', 'Error loading grades')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {t('user.grades.errorMessage', 'Failed to load your grades. Please try again.')}
            </p>
            <Button variant="outline" size="sm" onClick={fetchGrades}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              {t('user.grades.retry', 'Retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 p-4 md:p-0" dir={direction}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
              }}
              suppressHydrationWarning
            >
              {t('user.grades.title', 'My Grades')}
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)',
              }}
              suppressHydrationWarning
            >
              {t('user.grades.subtitle', 'All your grades across every enrolled course')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats — Total / Graded / Average. Same icon-circle layout as
          notifications / attendance / calendar. */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.grades.stats.total', 'Total')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                }}
              >
                {counts.all}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            >
              <Award className="h-6 w-6" style={{ color: 'hsl(var(--accent-foreground))' }} />
            </div>
          </div>
        </Card>

        <Card
          className="p-4 ltr:border-l-4 rtl:border-r-4"
          style={{ borderColor: 'hsl(var(--success))' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.grades.stats.graded', 'Graded')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--success))',
                }}
              >
                {counts.graded}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}
            >
              <CheckCircle2 className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem',
                }}
                suppressHydrationWarning
              >
                {t('user.grades.stats.average', 'Average')}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--primary))',
                }}
              >
                {avgPct === null ? '—' : `${avgPct}%`}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
            >
              <TrendingUp className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grades list — underline tabs + content in a single Card. */}
      <Card>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as GradeFilter)}
          className="w-full"
          dir={direction}
        >
          {/* Filter toolbar — search + course + grade range. Sits
              above the tabs inside the same Card so all filters
              compose naturally. The tabs below filter WITHIN this
              toolbar's result set. */}
          <div className="px-6 pt-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap border-b border-border">
            <div className="relative flex-1 sm:max-w-sm">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                  isRtl ? 'right-3' : 'left-3'
                }`}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'user.grades.toolbar.searchPlaceholder',
                  'Search assignments or courses',
                )}
                className={isRtl ? 'pr-9' : 'pl-9'}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${
                    isRtl ? 'left-3' : 'right-3'
                  }`}
                  aria-label={t('common.clear', 'Clear')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {courseOptions.length > 0 && (
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('user.grades.filter.allCourses', 'All courses')}
                  </SelectItem>
                  {courseOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Grade range — dual-handle slider (0–100). Same component
                as the admin gradebook page so the visual rhythm holds
                across the platform. */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground shrink-0">
                {t('user.grades.toolbar.gradeRange', 'Grade')}
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
              <span
                className="text-xs tabular-nums text-muted-foreground shrink-0"
                dir="ltr"
              >
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
          </div>

          <div className="px-6 pt-4">
            <div className="-mx-6 px-6 overflow-x-auto">
              <UnderlineTabsList className="gap-6">
                <UnderlineTabsTrigger value="all">
                  <span>{t('user.grades.filter.all', 'All')}</span>
                  <TabCountBadge n={counts.all} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="graded">
                  <span>{t('user.grades.filter.graded', 'Graded')}</span>
                  <TabCountBadge n={counts.graded} />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="pending">
                  <span>{t('user.grades.filter.pending', 'Pending')}</span>
                  <TabCountBadge n={counts.pending} tone="alert" />
                </UnderlineTabsTrigger>
                <UnderlineTabsTrigger value="excused">
                  <span>{t('user.grades.filter.excused', 'Excused')}</span>
                  <TabCountBadge n={counts.excused} />
                </UnderlineTabsTrigger>
              </UnderlineTabsList>
            </div>
          </div>

          <TabsContent value={filter} className="p-6 space-y-4">
            {pagedGrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gradient-to-br from-amber-500/10 to-pink-500/10 p-6 mb-4">
                  <Award className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">
                  {t('user.grades.noRecords', 'No grades yet')}
                </h3>
              </div>
            ) : (
              <div className="grid gap-3">
                {pagedGrades.map((g) => {
                  const graded = g.graded_at ? parseISO(g.graded_at) : null;
                  const pct = g.percentage != null ? Number(g.percentage) : null;
                  const pending = !g.is_excused && !(g.status === 'graded' && pct !== null);
                  const statusColor = g.is_excused
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : pending
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
                  const StatusIcon = g.is_excused
                    ? AlertCircle
                    : pending
                      ? Clock
                      : CheckCircle2;

                  const inner = (
                    // Matches the dashboard Grades tab row exactly:
                    // [colored letter box] [title + meta] [status badge]
                    // — letter box sits at the start so it mirrors to
                    // the right edge in RTL, same as the dashboard.
                    <div className="flex items-center gap-3 p-4">
                      {/* Letter box — colored using the scale's
                          configured color_code (shipped as
                          letter_color). Falls back to the primary
                          gradient when the row has no letter. */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center border px-1 text-center ${
                            g.letter_grade
                              ? ''
                              : 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/10'
                          }`}
                          style={
                            g.letter_grade && g.letter_color
                              ? {
                                  backgroundColor: `${g.letter_color}1A`,
                                  borderColor: `${g.letter_color}66`,
                                  color: g.letter_color,
                                }
                              : undefined
                          }
                          dir="auto"
                        >
                          {g.letter_grade ? (
                            <span
                              className={`font-bold leading-tight ${
                                g.letter_grade.length === 1
                                  ? 'text-2xl tabular-nums'
                                  : g.letter_grade.length <= 3
                                    ? 'text-base'
                                    : 'text-xs'
                              }`}
                            >
                              {g.letter_grade}
                            </span>
                          ) : pct !== null ? (
                            <span className="text-base font-bold leading-tight tabular-nums">
                              {Math.round(pct)}%
                            </span>
                          ) : (
                            <Award className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Middle: title + one folded meta line (course,
                          category, points, graded date). */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-sm text-foreground line-clamp-1"
                          dir="auto"
                        >
                          {g.grade_item_name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                          <span className="line-clamp-1" dir="auto">
                            {g.course_name}
                          </span>
                          {g.category_name && (
                            <span className="inline-flex items-center gap-1 shrink-0" dir="auto">
                              <span aria-hidden="true">·</span>
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: g.category_color || 'currentColor' }}
                              />
                              {g.category_name}
                            </span>
                          )}
                          {g.points_earned != null && g.max_points != null && (
                            <span className="tabular-nums shrink-0" dir="ltr">
                              · {Number(g.points_earned)} / {Number(g.max_points)}
                            </span>
                          )}
                          {pct !== null && g.letter_grade && (
                            <span className="tabular-nums shrink-0" dir="ltr">
                              · {Math.round(pct)}%
                            </span>
                          )}
                          {graded && (
                            <span className="shrink-0" dir="auto">
                              · {format(graded, 'MMM d', { locale })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge — far end. */}
                      <div className="flex-shrink-0">
                        <Badge className={`flex items-center gap-1.5 ${statusColor} border`}>
                          <StatusIcon className="h-3 w-3" />
                          {g.is_excused
                            ? t('user.dashboard.grades.status.excused', 'Excused')
                            : pending
                              ? t('user.dashboard.grades.status.submitted', 'Pending')
                              : t('user.dashboard.grades.status.graded', 'Graded')}
                        </Badge>
                      </div>
                    </div>
                  );

                  return (
                    <Card
                      key={g.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/20"
                    >
                      {g.course_id ? (
                        <Link
                          href={`/courses/${g.course_id}/grades`}
                          className="block cursor-pointer"
                        >
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {filtered.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
