'use client';

import { useEffect, useMemo, useState } from 'react';

type Record_ = { id: string; attendance_date: string; status: string; notes: string | null; lesson_id: string | null; lesson_title: string | null };
type Filter = 'all' | 'present' | 'absent' | 'late' | 'excused';

const panel = 'bg-white rounded-[22px] shadow-[0_1px_0_#e9e3f1]';
const STATUS: Record<string, [string, string]> = {
  present: ['נוכח/ת', 'bg-[#e1f4ea] text-[#1a7a50]'],
  absent: ['נעדר/ת', 'bg-[#fbeceb] text-[#b3392f]'],
  late: ['איחור', 'bg-[#fbefd6] text-[#7a4f00]'],
  excused: ['היעדרות מוצדקת', 'bg-[#eef1fb] text-[#3f4c9a]'],
};
const day = (iso: string) => new Intl.DateTimeFormat('he-IL', { day: 'numeric' }).format(new Date(iso));
const month = (iso: string) => new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(new Date(iso));

/**
 * A course's attendance, as a tab of the course: the rate (excused sessions
 * aside), counts by status, and every recorded session. Clicking a session
 * opens its lesson. Data: GET /api/user/courses/[id]/attendance (all records).
 */
export function CourseAttendance({ courseId, accent, onOpenLesson }: { courseId: string; accent: string; onOpenLesson?: (lessonId: string) => void }) {
  const [rows, setRows] = useState<Record_[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetch(`/api/user/courses/${courseId}/attendance`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setRows(j?.data ?? []))
      .catch(() => setFailed(true));
  }, [courseId]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, present: 0, absent: 0, late: 0, excused: 0 };
    (rows ?? []).forEach((r) => {
      c.all += 1;
      if (r.status in c) c[r.status as Filter] += 1;
    });
    return c;
  }, [rows]);
  const counted = counts.all - counts.excused;
  const rate = counted ? Math.round(((counts.present + counts.late) / counted) * 100) : null;
  const list = (rows ?? []).filter((r) => filter === 'all' || r.status === filter);

  if (failed) return <div className={`${panel} p-8 text-center text-[#73698a]`}>לא הצלחנו לטעון את הנוכחות. נסו לרענן את העמוד.</div>;
  if (!rows) {
    return (
      <div className={`${panel} grid place-items-center min-h-[200px]`}>
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b3a8e]" aria-label="טוענים" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['אחוז נוכחות', rate === null ? '—' : `${rate}%`, accent],
          ['נוכחות', String(counts.present), '#1a7a50'],
          ['איחורים', String(counts.late), '#7a4f00'],
          ['היעדרויות', String(counts.absent), '#b3392f'],
          ['מוצדקות', String(counts.excused), '#3f4c9a'],
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
        <div role="group" aria-label="סוג הנוכחות" className="inline-flex self-start overflow-x-auto max-w-full rounded-full border border-[#e3dcef] bg-white [&>*+*]:border-s [&>*+*]:border-[#e9e3f1]">
          {(
            [
              ['all', 'הכול'],
              ['present', 'נוכח'],
              ['absent', 'נעדר'],
              ['late', 'איחור'],
              ['excused', 'מוצדק'],
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

        {list.length === 0 && <span className="py-6 text-center text-sm text-[#73698a]">{rows.length ? 'אין רשומות כאן.' : 'עוד לא נרשמה נוכחות בקורס.'}</span>}
        {list.map((r) => {
          const st = STATUS[r.status] ?? [r.status, 'bg-[#f1ebf8] text-[#5b3a8e]'];
          const body = (
            <>
              <span className="w-[52px] h-[52px] rounded-[14px] bg-white shadow-[inset_0_0_0_1px_#e3dcef] flex flex-col items-center justify-center leading-tight shrink-0">
                <b className="font-rubik text-lg">{day(r.attendance_date)}</b>
                <span className="text-[11px] text-[#73698a]">{month(r.attendance_date)}</span>
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-0.5 text-start">
                <b className="text-[15px] text-[#221a2e]">{r.lesson_title || 'מפגש'}</b>
                {r.notes && <span className="text-[12.5px] text-[#5f5675] italic line-clamp-2">הערה: {r.notes}</span>}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st[1]}`}>{st[0]}</span>
            </>
          );
          return r.lesson_id && onOpenLesson ? (
            <button key={r.id} type="button" onClick={() => onOpenLesson(r.lesson_id!)} className="flex items-center gap-3 lg:gap-3.5 px-3 lg:px-3.5 py-3 rounded-2xl bg-[#f8f5fc] border-0 hover:bg-[#f3eef9]">
              {body}
            </button>
          ) : (
            <div key={r.id} className="flex items-center gap-3 lg:gap-3.5 px-3 lg:px-3.5 py-3 rounded-2xl bg-[#f8f5fc]">
              {body}
            </div>
          );
        })}
      </section>
    </div>
  );
}
