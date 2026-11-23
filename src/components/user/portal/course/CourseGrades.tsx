'use client';

import { useEffect, useMemo, useState } from 'react';

type Grade = {
  id: string;
  grade_item_name: string;
  course_id: string | null;
  points_earned: number | null;
  max_points: number | null;
  percentage: number | null;
  letter_grade: string | null;
  letter_color: string | null;
  status: string | null;
  is_excused: boolean;
  graded_at: string | null;
  category_name: string | null;
  category_color: string | null;
};
type Filter = 'all' | 'graded' | 'pending' | 'excused';

const panel = 'bg-white rounded-[22px] shadow-[0_1px_0_#e9e3f1]';
const dateOf = (iso: string) => new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit' }).format(new Date(iso));
const kindOf = (g: Grade): Exclude<Filter, 'all'> => (g.is_excused ? 'excused' : g.status === 'graded' && g.percentage != null ? 'graded' : 'pending');
const STATUS: Record<Exclude<Filter, 'all'>, [string, string]> = {
  graded: ['נבדק', 'bg-[#e1f4ea] text-[#1a7a50]'],
  pending: ['ממתין לבדיקה', 'bg-[#fbefd6] text-[#7a4f00]'],
  excused: ['פטור', 'bg-[#eef1fb] text-[#3f4c9a]'],
};

/**
 * A course's grades, as a tab of the course: the average, counts by status,
 * search, and every graded item with its letter from the course's grading
 * scale. Data: GET /api/user/grades (letters worked out by the server).
 */
export function CourseGrades({ courseId, accent }: { courseId: string; accent: string }) {
  const [rows, setRows] = useState<Grade[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/user/grades', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setRows(((j?.data ?? []) as Grade[]).filter((g) => g.course_id === courseId)))
      .catch(() => setFailed(true));
  }, [courseId]);

  const searched = useMemo(() => (rows ?? []).filter((g) => !q.trim() || g.grade_item_name.includes(q.trim())), [rows, q]);
  const counts = useMemo(() => {
    const c = { all: searched.length, graded: 0, pending: 0, excused: 0 };
    searched.forEach((g) => (c[kindOf(g)] += 1));
    return c;
  }, [searched]);
  const graded = searched.filter((g) => kindOf(g) === 'graded');
  const avg = graded.length ? Math.round(graded.reduce((a, g) => a + (g.percentage ?? 0), 0) / graded.length) : null;
  const list = searched.filter((g) => filter === 'all' || kindOf(g) === filter);

  if (failed) return <div className={`${panel} p-8 text-center text-[#73698a]`}>לא הצלחנו לטעון את הציונים. נסו לרענן את העמוד.</div>;
  if (!rows) {
    return (
      <div className={`${panel} grid place-items-center min-h-[200px]`}>
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b3a8e]" aria-label="טוענים" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['ממוצע', avg === null ? '—' : String(avg), accent],
          ['נבדקו', String(counts.graded), '#1a7a50'],
          ['ממתינים לבדיקה', String(counts.pending), '#7a4f00'],
          ['פטור', String(counts.excused), '#3f4c9a'],
        ].map(([label, value, color]) => (
          <div key={label} className={`${panel} px-4 py-3.5 flex flex-col gap-1`}>
            <span className="text-[13px] text-[#5f5675]">{label}</span>
            <b className="font-rubik text-[26px] leading-none" style={{ color }}>
              {value}
            </b>
          </div>
        ))}
      </div>

      <section className={`${panel} p-3 lg:p-4 flex flex-col gap-2.5`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div role="group" aria-label="סוג הציונים" className="inline-flex self-start overflow-x-auto max-w-full rounded-full border border-[#e3dcef] bg-white [&>*+*]:border-s [&>*+*]:border-[#e9e3f1]">
            {(
              [
                ['all', 'הכול'],
                ['graded', 'נבדקו'],
                ['pending', 'ממתינים'],
                ['excused', 'פטור'],
              ] as [Filter, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={`shrink-0 whitespace-nowrap border-0 px-3.5 py-2 text-sm font-semibold ${filter === k ? 'text-white' : 'bg-white text-[#221a2e] hover:bg-[#faf8fd]'}`}
                style={filter === k ? { background: accent } : undefined}
              >
                {label} · {counts[k]}
              </button>
            ))}
          </div>
          <label className="flex-1 flex items-center gap-2 min-h-[42px] px-3.5 rounded-xl bg-[#f6f3fa] border border-[#e9e3f1]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#73698a" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש מטלה" className="border-0 bg-transparent text-sm w-full outline-none text-[#221a2e]" />
          </label>
        </div>

        {list.length === 0 && <span className="py-6 text-center text-sm text-[#73698a]">{rows.length ? 'אין ציונים שמתאימים לחיפוש.' : 'עוד אין ציונים בקורס.'}</span>}
        {list.map((g) => {
          const k = kindOf(g);
          const lc = g.letter_color || null;
          return (
            <div key={g.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto] sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] gap-3 lg:gap-3.5 items-center px-3 lg:px-3.5 py-3 rounded-2xl bg-[#f8f5fc]">
              <span
                className="w-[52px] h-[52px] rounded-[14px] grid place-items-center font-rubik font-bold text-lg"
                style={lc ? { color: lc, background: `${lc}1a`, boxShadow: `inset 0 0 0 1px ${lc}33` } : { color: '#73698a', background: '#fff', boxShadow: 'inset 0 0 0 1px #e3dcef' }}
              >
                {g.letter_grade || (g.percentage != null ? Math.round(g.percentage) : '—')}
              </span>
              <span className="min-w-0 flex flex-col gap-0.5">
                <b className="text-[15px]">{g.grade_item_name}</b>
                <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#73698a]">
                  {g.category_name && (
                    <>
                      <i className="inline-block w-2 h-2 rounded-full" style={{ background: g.category_color || '#cfc4e2' }} />
                      {g.category_name}
                      {g.max_points != null && ' · '}
                    </>
                  )}
                  {g.max_points != null && (
                    <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                      {g.points_earned ?? '—'} / {g.max_points}
                    </span>
                  )}
                  {g.letter_grade && g.percentage != null && <span>· {Math.round(g.percentage)}%</span>}
                </span>
              </span>
              <span className="hidden sm:block text-[12.5px] text-[#73698a] whitespace-nowrap">{g.graded_at ? `נבדק ${dateOf(g.graded_at)}` : ''}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS[k][1]}`}>{STATUS[k][0]}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
