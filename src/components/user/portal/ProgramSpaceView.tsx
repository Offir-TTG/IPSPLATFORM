'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProgramSpace } from '@/lib/portal/spaces';
import { SpaceHero, SpaceTab } from './SpaceHero';

type Tab = 'courses' | 'grades' | 'cert';
type CourseStats = { grade: number | null; letter: string | null; attended: number; total: number };

const panel = 'bg-white rounded-[22px] p-4 lg:p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold';

/** Grades and attendance per course, from the same endpoints the course page uses. */
function useCourseStats(courseIds: string[], enabled: boolean) {
  const [stats, setStats] = useState<Record<string, CourseStats> | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    Promise.all(
      courseIds.map(async (id) => {
        const [g, a] = await Promise.all([
          fetch(`/api/user/courses/${id}/grade-summary`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/user/courses/${id}/attendance/stats`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        const gd = g?.data;
        const ad = a?.data;
        const attended = Number(ad?.present_count ?? 0) + Number(ad?.late_count ?? 0);
        return [
          id,
          {
            grade: gd && Number(gd.total_points_possible) > 0 ? Math.round(Number(gd.overall_grade)) : null,
            letter: gd?.letter_grade ?? null,
            attended,
            total: Number(ad?.total_sessions ?? 0),
          },
        ] as const;
      })
    ).then((rows) => setStats(Object.fromEntries(rows)));
  }, [enabled, courseIds]);
  return stats;
}

export function ProgramSpaceView({ space }: { space: ProgramSpace }) {
  const [tab, setTab] = useState<Tab>('courses');
  const ids = useMemo(() => space.courses.map((x) => x.id), [space]);
  const stats = useCourseStats(ids, tab !== 'courses');
  const c = space.color;

  return (
    <div className="flex flex-col gap-5">
      <SpaceHero
        color={c}
        kicker={space.kicker}
        title={space.name}
        sub={space.lead ? `מנחה ראשית: ${space.lead}` : null}
        side={
          <div className="lg:min-w-[260px] flex flex-col gap-1.5">
            <div className="flex justify-between text-[13.5px]">
              <span className="opacity-85">{space.doneLine}</span>
              <b>{space.overall}%</b>
            </div>
            <span className="block h-2 rounded-full bg-white/25 overflow-hidden">
              <span className="block h-full rounded-[inherit] bg-[#e9b44c]" style={{ width: `${space.overall}%` }} />
            </span>
          </div>
        }
        tabs={
          <>
            <SpaceTab on={tab === 'courses'} onClick={() => setTab('courses')}>הקורסים</SpaceTab>
            <SpaceTab on={tab === 'grades'} onClick={() => setTab('grades')}>ציונים ונוכחות</SpaceTab>
            <SpaceTab on={tab === 'cert'} onClick={() => setTab('cert')}>הדרך לתעודה</SpaceTab>
          </>
        }
      />

      {tab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          <section className={`${panel} gap-2.5`}>
            <div className="flex justify-between items-baseline px-1">
              <h2 className={`${h2} text-[17px] lg:text-[19px]`}>הקורסים בתוכנית</h2>
              <span className="hidden lg:inline text-[#73698a] text-[13px]">לפי הסדר שנקבע בתוכנית</span>
            </div>
            {space.courses.map((x) => (
              <Link
                key={x.id}
                href={`/courses/${x.id}`}
                className="grid grid-cols-[40px_1fr_auto] lg:grid-cols-[40px_1fr_150px_auto] gap-3 lg:gap-3.5 items-center px-3 lg:px-3.5 py-[13px] rounded-2xl bg-[#f6f3fb] no-underline text-[#221a2e] hover:bg-[#f1ecf9]"
              >
                <span
                  className="w-10 h-10 rounded-xl grid place-items-center font-rubik font-bold text-[15px]"
                  style={
                    x.state === 'done'
                      ? { background: '#1f8a5b', color: '#fff' }
                      : x.state === 'active'
                      ? { background: c, color: '#fff' }
                      : { background: '#fff', color: '#73698a', boxShadow: 'inset 0 0 0 1px #ddd4ea' }
                  }
                >
                  {x.state === 'done' ? '✓' : x.n}
                </span>
                <span className="min-w-0">
                  <b className="block text-[15px] lg:text-[15.5px]">{x.title}</b>
                  <span className="text-[13px] text-[#73698a]">{x.line}</span>
                </span>
                <span className="hidden lg:flex flex-col gap-1 items-end text-[12.5px] text-[#73698a]">
                  {x.state === 'done' ? 'הושלם' : x.pct > 0 ? `${x.pct}%` : 'טרם התחיל'}
                  <span className="block w-full h-[5px] rounded-full bg-[#e4ddf3] overflow-hidden">
                    <span className="block h-full rounded-[inherit]" style={{ width: `${x.pct}%`, background: x.state === 'done' ? '#1f8a5b' : c }} />
                  </span>
                </span>
                <span className="font-semibold text-[13.5px] whitespace-nowrap" style={{ color: c }}>
                  {x.action} ←
                </span>
              </Link>
            ))}
            {space.courses.length === 0 && <span className="text-[#73698a] text-sm p-2">הקורסים של התוכנית יופיעו כאן.</span>}
          </section>

          <div className="flex flex-col gap-4">
            {space.next && (
              <section className="rounded-[22px] p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col gap-2.5" style={{ background: 'linear-gradient(135deg, #ece7f8, #ffffff)' }}>
                <h2 className={`${h2} text-[17px]`}>המפגש הבא בתוכנית</h2>
                <div className="font-rubik font-bold text-[22px] leading-[1.2]">{space.next.when}</div>
                <span className="text-[#73698a] text-sm">
                  {space.next.title} · {space.next.sub}
                </span>
                <Link href={`/courses/${space.next.courseId}`} className="self-start text-white no-underline font-semibold text-sm px-4 py-[11px] rounded-xl" style={{ background: c }}>
                  לעמוד הקורס
                </Link>
              </section>
            )}
            {space.news.length > 0 && (
              <section className={`${panel} gap-2.5`}>
                <h2 className={`${h2} text-[17px]`}>מה חדש בקורסים</h2>
                {space.news.map((n) => (
                  <Link key={n.key} href={n.href} className="block px-3 py-[11px] rounded-[13px] bg-[#f6f3fb] no-underline text-[#221a2e] hover:bg-[#f1ecf9]">
                    <b className="block text-sm">{n.title}</b>
                    <span className="text-[12.5px] text-[#73698a]">{n.sub}</span>
                  </Link>
                ))}
              </section>
            )}
            {space.payment && (
              <Link href="/billing" className="flex justify-between px-4 py-3.5 rounded-[18px] bg-white shadow-[0_1px_0_#e9e3f1] no-underline text-[#221a2e] text-sm hover:bg-[#faf8fd]">
                <span>{space.payment.label}</span>
                <b>{space.payment.sum} ←</b>
              </Link>
            )}
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <section className={`${panel} gap-2.5`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-baseline gap-1">
            <h2 className={`${h2} text-[17px] lg:text-[19px]`}>ציונים ונוכחות מכל הקורסים</h2>
            <span className="text-[#73698a] text-[13px]">הציונים מוזנים בכל קורס, וכאן רואים את כולם יחד</span>
          </div>
          <div className="hidden lg:grid grid-cols-[1fr_120px_140px_110px] gap-2.5 px-3.5 text-[#73698a] text-[12.5px] font-semibold">
            <span>קורס</span>
            <span>ממוצע</span>
            <span>נוכחות</span>
            <span />
          </div>
          {!stats && <span className="text-[#73698a] text-sm p-2">טוען…</span>}
          {stats &&
            space.courses.map((x) => {
              const s = stats[x.id];
              return (
                <div key={x.id} className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_120px_140px_110px] gap-x-2.5 gap-y-1 items-center px-3.5 py-[13px] rounded-[14px] bg-[#f6f3fb]">
                  <b className="text-[15px]">{x.title}</b>
                  <span className="font-rubik font-semibold text-base">
                    {s?.grade != null ? `${s.grade}${s.letter ? ` · ${s.letter}` : ''}` : x.state === 'todo' ? '—' : 'בתהליך'}
                  </span>
                  <span className="text-sm text-[#5f5675] lg:text-[#221a2e]">{s?.total ? `נוכחות ${s.attended} מתוך ${s.total}` : 'עוד אין נוכחות'}</span>
                  <Link href={`/courses/${x.id}/grades`} className="font-semibold text-[13.5px] no-underline justify-self-end lg:justify-self-start" style={{ color: c }}>
                    לפירוט ←
                  </Link>
                </div>
              );
            })}
        </section>
      )}

      {tab === 'cert' && (
        <section className={`${panel} gap-3 max-w-[860px]`}>
          <h2 className={`${h2} text-[17px] lg:text-[19px]`}>הדרך לתעודה</h2>
          {(() => {
            const req = space.courses.filter((x) => x.required);
            const done = req.filter((x) => x.state === 'done').length;
            const all = stats ? Object.values(stats) : [];
            const attended = all.reduce((a, s) => a + s.attended, 0);
            const total = all.reduce((a, s) => a + s.total, 0);
            const graded = all.filter((s) => s.grade != null);
            const avg = graded.length ? Math.round(graded.reduce((a, s) => a + (s.grade ?? 0), 0) / graded.length) : null;
            const rows = [
              { title: 'קורסי חובה', value: `${done} מתוך ${req.length}`, pct: req.length ? (done / req.length) * 100 : 0, color: c },
              { title: 'נוכחות במפגשים', value: stats ? (total ? `${attended} מתוך ${total}` : 'עוד אין נוכחות') : '…', pct: total ? (attended / total) * 100 : 0, color: '#1f8a5b' },
              { title: 'ממוצע ציונים', value: stats ? (avg != null ? String(avg) : 'עוד אין ציונים') : '…', pct: avg ?? 0, color: '#1f8a5b' },
            ];
            return rows.map((r) => (
              <div key={r.title} className="flex flex-col gap-1.5 p-3.5 rounded-[14px] bg-[#f6f3fb]">
                <div className="flex justify-between">
                  <b className="text-[15px]">{r.title}</b>
                  <span className="text-[13.5px] text-[#5f5675]">{r.value}</span>
                </div>
                <span className="block h-1.5 rounded-full bg-[#e2dbf0] overflow-hidden">
                  <span className="block h-full rounded-[inherit]" style={{ width: `${Math.round(r.pct)}%`, background: r.color }} />
                </span>
              </div>
            ));
          })()}
          <span className="text-[#73698a] text-[13.5px]">כשכל קורסי החובה מסתיימים, צוות בית הספר מנפיק את התעודה.</span>
        </section>
      )}
    </div>
  );
}
