'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, SearchX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { QuickPills, kitButton, ListState } from '@/components/admin/notifications/kit';
import {
  LEVELS,
  LEVEL_TONE,
  attendancePct,
  downloadCsv,
  levelLabel,
  levelOf,
  searchBox,
  type Level,
  type Translate,
} from './shared';

interface ReportRow {
  student_id: string;
  student_name: string;
  student_email: string;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
}

interface Row {
  id: string;
  name: string;
  email: string;
  p: number;
  l: number;
  a: number;
  e: number;
  pct: number | null;
  level: Level | null;
}

/** The summary: four numbers, then a row per client with their counts, % and level. */
export function SummaryView({ courseId, meetingsHeld, t }: { courseId: string; meetingsHeld: number; t: Translate }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | Level>('all');
  const [sort, setSort] = useState<{ by: 'name' | 'pct'; desc: boolean }>({ by: 'pct', desc: true });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/lms/courses/${courseId}/attendance/reports`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data: ReportRow[] = json.data || [];
        if (!alive) return;
        setRows(
          data.map((r) => {
            const p = Number(r.present_count) || 0;
            const l = Number(r.late_count) || 0;
            const a = Number(r.absent_count) || 0;
            const e = Number(r.excused_count) || 0;
            const pct = attendancePct(p, l, a);
            return { id: r.student_id, name: r.student_name, email: r.student_email, p, l, a, e, pct, level: pct == null ? null : levelOf(pct) };
          }),
        );
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId]);

  const all = rows ?? [];
  const withPct = all.filter((r) => r.pct != null);
  const average = withPct.length ? Math.round(withPct.reduce((s, r) => s + (r.pct ?? 0), 0) / withPct.length) : 0;
  const excellent = withPct.filter((r) => (r.pct ?? 0) >= 90).length;
  const attention = withPct.filter((r) => (r.pct ?? 0) < 75).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter(
      (r) => (level === 'all' || r.level === level) && (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
    );
    const dir = sort.desc ? -1 : 1;
    return list.sort((x, y) =>
      sort.by === 'name' ? dir * x.name.localeCompare(y.name) : dir * ((x.pct ?? -1) - (y.pct ?? -1)),
    );
  }, [all, search, level, sort]);

  const toggleSort = (by: 'name' | 'pct') =>
    setSort((s) => (s.by === by ? { by, desc: !s.desc } : { by, desc: by === 'pct' }));
  const arrow = (by: 'name' | 'pct') => (sort.by === by ? (sort.desc ? ' ↓' : ' ↑') : ' ↕');

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadCsv(`/api/admin/lms/courses/${courseId}/attendance/reports/export`, 'attendance-summary.csv');
    } catch {
      toast({ variant: 'destructive', title: t('admin.attendanceTab.exportFailed', "Couldn't export. Please try again.") });
    } finally {
      setExporting(false);
    }
  };

  const tile = 'rounded-2xl border border-border bg-card px-4 py-3.5';

  if (failed) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ListState icon={BarChart3} tone="red" title={t('admin.attendanceTab.summaryLoadFailed', "Couldn't load the summary. Please refresh the page.")} />
      </div>
    );
  }
  if (rows == null) {
    return (
      <div className="flex justify-center py-16" aria-busy="true">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div className={tile}>
          <div className="text-[26px] font-extrabold tabular-nums">{average}%</div>
          <div className="text-[13.5px] text-muted-foreground">{t('admin.attendanceTab.tile.average', 'Average attendance')}</div>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full bg-primary" style={{ width: `${average}%` }} />
          </span>
        </div>
        <div className={tile}>
          <div className="text-[26px] font-extrabold tabular-nums">{meetingsHeld}</div>
          <div className="text-[13.5px] text-muted-foreground">{t('admin.attendanceTab.tile.held', 'Meetings held')}</div>
        </div>
        <div className={tile}>
          <div className="text-[26px] font-extrabold tabular-nums text-green-700 dark:text-green-400">{excellent}</div>
          <div className="text-[13.5px] text-muted-foreground">{t('admin.attendanceTab.tile.excellent', 'Excellent (90% and up)')}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900 dark:bg-red-950/30">
          <div className="text-[26px] font-extrabold tabular-nums text-red-700 dark:text-red-300">{attention}</div>
          <div className="text-[13.5px] text-red-800 dark:text-red-200">{t('admin.attendanceTab.tile.attention', 'Need attention (under 75%)')}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2.5 p-3.5">
          <label className="min-w-0 flex-[1_1_220px] sm:max-w-[300px]">
            <span className="sr-only">{t('admin.attendanceTab.search', 'Search client')}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.attendanceTab.search', 'Search client')}
              className={searchBox}
            />
          </label>
          <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
            <QuickPills
              label={t('admin.attendanceTab.levelFilter', 'Filter by level')}
              value={level}
              onChange={setLevel}
              options={[
                { value: 'all' as const, label: t('admin.attendanceTab.level.all', 'All'), count: all.length },
                ...LEVELS.map((l) => ({ value: l, label: levelLabel(l, t), count: all.filter((r) => r.level === l).length })),
              ]}
            />
          </div>
          <button type="button" onClick={onExport} disabled={exporting} className={`${kitButton.secondary} sm:ms-auto`}>
            {t('admin.attendanceTab.export', 'Export')}
          </button>
        </div>

        {all.length === 0 ? (
          <ListState
            icon={BarChart3}
            title={t('admin.attendanceTab.summaryEmpty', 'No attendance marked yet')}
            text={t('admin.attendanceTab.summaryEmptyText', 'Once you mark attendance for a meeting, the summary shows here.')}
          />
        ) : shown.length === 0 ? (
          <ListState icon={SearchX} tone="grey" title={t('admin.attendanceTab.noMatch', 'No client matches your search')} />
        ) : (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[820px] border-collapse text-[14.5px]">
              <thead>
                <tr className="bg-muted/40">
                  <th scope="col" className="px-3.5 py-3 text-start">
                    <button type="button" onClick={() => toggleSort('name')} className="min-h-[44px] font-bold">
                      {t('admin.attendanceTab.client', 'Client')}
                      {arrow('name')}
                    </button>
                  </th>
                  <th scope="col" className="px-2.5 py-3 text-start font-semibold text-green-700 dark:text-green-400">
                    {t('admin.attendanceTab.status.present', 'Present')}
                  </th>
                  <th scope="col" className="px-2.5 py-3 text-start font-semibold text-amber-700 dark:text-amber-400">
                    {t('admin.attendanceTab.status.late', 'Late')}
                  </th>
                  <th scope="col" className="px-2.5 py-3 text-start font-semibold text-red-700 dark:text-red-400">
                    {t('admin.attendanceTab.status.absent', 'Absent')}
                  </th>
                  <th scope="col" className="px-2.5 py-3 text-start font-semibold text-blue-700 dark:text-blue-400">
                    {t('admin.attendanceTab.status.excused', 'Excused')}
                  </th>
                  <th scope="col" className="px-3.5 py-3 text-start">
                    <button type="button" onClick={() => toggleSort('pct')} className="min-h-[44px] font-bold">
                      {t('admin.attendanceTab.attendance', 'Attendance')}
                      {arrow('pct')}
                    </button>
                  </th>
                  <th scope="col" className="px-3.5 py-3 text-start font-bold">
                    {t('admin.attendanceTab.levelColumn', 'Level')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t border-border/70">
                    <td className="px-3.5 py-2.5">
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[12.5px] text-muted-foreground" dir="ltr">
                        {r.email}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 tabular-nums">{r.p}</td>
                    <td className="px-2.5 py-2.5 tabular-nums">{r.l}</td>
                    <td className="px-2.5 py-2.5 tabular-nums">{r.a}</td>
                    <td className="px-2.5 py-2.5 tabular-nums">{r.e}</td>
                    <td className="min-w-[160px] px-3.5 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <b className="w-11 tabular-nums">{r.pct == null ? '—' : `${r.pct}%`}</b>
                        <span className="h-[7px] flex-1 overflow-hidden rounded-full bg-muted">
                          {r.level && <span className={`block h-full ${LEVEL_TONE[r.level].bar}`} style={{ width: `${r.pct}%` }} />}
                        </span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      {r.level && (
                        <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${LEVEL_TONE[r.level].badge}`}>{levelLabel(r.level, t)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
