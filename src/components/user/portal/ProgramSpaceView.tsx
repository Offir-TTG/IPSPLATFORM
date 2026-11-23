'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProgramSpace } from '@/lib/portal/spaces';
import { SpaceHero, SpaceTab } from './SpaceHero';
import { CourseWorkspace, courseFileCount, useCourse, type CoursePart } from './course/CourseWorkspace';
import { HeroProgress } from './course/HeroProgress';
import { CourseIntro } from './course/CourseIntro';

type Tab = 'courses' | 'grades' | 'cert';
type CourseStats = { grade: number | null; letter: string | null; attended: number; total: number };

/** The program's description cut to one short line for its header. */
const shortAbout = (about: string | null) => {
  const first = about?.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 2).join(' · ');
  if (!first) return null;
  return first.length > 150 ? `${first.slice(0, 147).trimEnd()}…` : first;
};

const panel = 'bg-white rounded-[22px] p-4 lg:p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold';

/** Grades and attendance per course, from the same endpoints the course content uses. */
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

/**
 * A program, all in one page: its courses, and each course opened right
 * here (lessons, files, details) with the way back to the list and the
 * previous and next course. ?course= and ?lesson= open them directly.
 */
export function ProgramSpaceView({ space }: { space: ProgramSpace }) {
  const search = useSearchParams();
  const [tab, setTab] = useState<Tab>('courses');
  const [courseId, setCourseId] = useState<string | null>(search?.get('course') ?? null);
  const [part, setPart] = useState<CoursePart>((search?.get('part') as CoursePart) || 'lessons');
  const [lessonId, setLessonId] = useState<string | null>(search?.get('lesson') ?? null);
  const ids = useMemo(() => space.courses.map((x) => x.id), [space]);
  // Grades / attendance show only for the courses that use them (Course → Settings).
  const anyGrades = space.courses.some((x) => x.features?.grades !== false);
  const anyAttendance = space.courses.some((x) => x.features?.attendance !== false);
  const stats = useCourseStats(ids, tab !== 'courses');
  const course = useCourse(courseId);
  // Progress as it is now: each course opened here keeps its live numbers (lessons marked
  // done or not) for as long as the page is open, over what the page loaded with.
  const [livePct, setLivePct] = useState<Record<string, number>>({});
  useEffect(() => {
    if (courseId && course.data && course.total) setLivePct((m) => (m[courseId] === course.pct ? m : { ...m, [courseId]: course.pct }));
  }, [courseId, course.data, course.total, course.pct]);
  const courses = useMemo(
    () =>
      space.courses.map((x) => {
        const pct = livePct[x.id];
        if (pct === undefined) return x;
        const state: typeof x.state = pct === 100 ? 'done' : pct > 0 ? 'active' : x.state === 'done' ? 'todo' : x.state;
        return { ...x, pct, state };
      }),
    [space.courses, livePct],
  );
  const requiredCourses = courses.filter((x) => x.required);
  const overall = requiredCourses.length ? Math.round(requiredCourses.reduce((a, x) => a + x.pct, 0) / requiredCourses.length) : 0;
  const doneLine = `${requiredCourses.filter((x) => x.state === 'done').length} מתוך ${requiredCourses.length} קורסי חובה הושלמו`;
  const c = space.color;

  // Keeps the address in step, so a course or lesson can be reopened or shared.
  const syncUrl = (cid: string | null, lid: string | null, p: CoursePart = 'lessons') => {
    const q = new URLSearchParams();
    if (cid) q.set('course', cid);
    if (cid && lid) q.set('lesson', lid);
    if (cid && p !== 'lessons') q.set('part', p);
    window.history.replaceState(null, '', `${window.location.pathname}${q.toString() ? `?${q}` : ''}`);
  };
  const openCourse = (cid: string | null, lid: string | null = null, p: CoursePart = 'lessons') => {
    setTab('courses');
    setCourseId(cid);
    setLessonId(lid);
    setPart(p);
    syncUrl(cid, lid, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const idx = courseId ? space.courses.findIndex((x) => x.id === courseId) : -1;
  const open = idx >= 0 ? space.courses[idx] : null;
  const prev = idx > 0 ? space.courses[idx - 1] : null;
  const next = idx >= 0 && idx < space.courses.length - 1 ? space.courses[idx + 1] : null;
  const filesCount = courseFileCount(course.data);
  // A part this course doesn't use (grades / attendance switched off) opens the lessons.
  const shownPart =
    (part === 'grades' && course.data?.course.features?.grades === false) || (part === 'attendance' && course.data?.course.features?.attendance === false)
      ? 'lessons'
      : part;
  const segLight = (on: boolean) =>
    `inline-flex items-center whitespace-nowrap border-0 px-3.5 py-2 text-sm font-semibold ${on ? 'text-white' : 'bg-white text-[#221a2e] hover:bg-[#faf8fd]'}`;

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <SpaceHero
        color={c}
        kicker={space.kicker}
        title={space.name}
        sub={shortAbout(space.about) ?? (space.lead ? `מנחה ראשית: ${space.lead}` : null)}
        side={<HeroProgress pct={overall} label={doneLine} />}
        tabs={
          <>
            <SpaceTab
              on={tab === 'courses'}
              onClick={() => {
                if (tab === 'courses') openCourse(null);
                else setTab('courses');
              }}
            >
              הקורסים
            </SpaceTab>
            {(anyGrades || anyAttendance) && (
              <SpaceTab on={tab === 'grades'} onClick={() => setTab('grades')}>
                {anyGrades && anyAttendance ? 'ציונים ונוכחות' : anyGrades ? 'ציונים' : 'נוכחות'}
              </SpaceTab>
            )}
            <SpaceTab on={tab === 'cert'} onClick={() => setTab('cert')}>הדרך לתעודה</SpaceTab>
          </>
        }
      />

      {tab === 'courses' && open && (
        <>
          <section className="bg-white rounded-[22px] px-4 lg:px-[22px] py-4 lg:py-[18px] flex flex-col gap-3" style={{ boxShadow: `0 1px 0 #e9e3f1, inset 0 4px 0 ${c}` }}>
            <div className="flex flex-wrap justify-between items-center gap-2.5">
              <button type="button" onClick={() => openCourse(null)} className="border-0 font-semibold text-[13.5px] px-3.5 py-2 rounded-full bg-[#f1ebf8]" style={{ color: c }}>
                → כל הקורסים בתוכנית
              </button>
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={!prev}
                  onClick={() => prev && openCourse(prev.id)}
                  title={prev?.title}
                  className="border border-[#e3dcef] bg-white font-semibold text-[13px] px-3 py-2 rounded-[11px] text-[#221a2e] disabled:text-[#b8b0c6]"
                >
                  → הקורס הקודם
                </button>
                <button
                  type="button"
                  disabled={!next}
                  onClick={() => next && openCourse(next.id)}
                  title={next?.title}
                  className="border border-[#e3dcef] bg-white font-semibold text-[13px] px-3 py-2 rounded-[11px] text-[#221a2e] disabled:text-[#b8b0c6]"
                >
                  הקורס הבא ←
                </button>
              </span>
            </div>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-2">
              <div className="min-w-0">
                <div className="text-[13px] text-[#73698a]">
                  קורס {idx + 1} מתוך {space.courses.length} · {open.required ? 'חובה' : 'רשות'}
                </div>
                <h2 className="m-0 mt-1 font-rubik font-bold text-[22px] lg:text-[28px] leading-[1.15] text-[#221a2e]">{open.title}</h2>
                {course.data && (
                  <div className="text-sm text-[#5f5675] mt-1">
                    {course.total ? `${course.total} שיעורים` : null}
                  </div>
                )}
              </div>
              {course.total > 0 && (
                <span className="text-[13.5px] text-[#5f5675]">
                  <b className="text-[#221a2e]">
                    {course.doneCount} מתוך {course.total} הושלמו
                  </b>
                  {' · '}
                  {course.total - course.doneCount ? `נשארו ${course.total - course.doneCount}` : 'סיימת'}
                </span>
              )}
            </div>
            {course.data && (
              <CourseIntro course={course.data.course} accent={c} />
            )}
            <div role="group" aria-label="חלקי הקורס" className="inline-flex self-start overflow-hidden rounded-full border border-[#e3dcef] bg-white [&>*+*]:border-s [&>*+*]:border-[#e9e3f1]">
              {(
                [
                  ['lessons', 'השיעורים'],
                  ['files', `קבצים${filesCount ? ` · ${filesCount}` : ''}`],
                  ...(course.data?.course.features?.grades === false ? [] : [['grades', 'ציונים']]),
                  ...(course.data?.course.features?.attendance === false ? [] : [['attendance', 'נוכחות']]),
                  ['about', 'על הקורס'],
                ] as [CoursePart, string][]
              ).filter(([k]) => (k !== 'grades' || course.data?.course.features?.grades !== false) && (k !== 'attendance' || course.data?.course.features?.attendance !== false)).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={shownPart === k}
                  onClick={() => {
                    setPart(k);
                    syncUrl(courseId, lessonId, k);
                  }}
                  className={segLight(shownPart === k)}
                  style={shownPart === k ? { background: c } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
          <CourseWorkspace
            key={open.id}
            course={course}
            part={shownPart}
            accent={c}
            lessonId={lessonId}
            onOpenLesson={(id) => openCourse(courseId, id, 'lessons')}
            onOpenPart={(p) => {
              setPart(p);
              syncUrl(courseId, lessonId, p);
            }}
            onLessonChange={(id) => {
              setLessonId(id);
              syncUrl(courseId, id, part);
            }}
          />
        </>
      )}

      {tab === 'courses' && !open && (space.about || space.imageUrl) && <ProgramAbout space={space} accent={c} />}

      {tab === 'courses' && !open && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          <section className={`${panel} gap-2.5`}>
            <div className="flex justify-between items-baseline px-1">
              <h2 className={`${h2} text-[17px] lg:text-[19px]`}>הקורסים בתוכנית</h2>
              <span className="hidden lg:inline text-[#73698a] text-[13px]">לפי הסדר שנקבע בתוכנית</span>
            </div>
            {courses.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => openCourse(x.id)}
                className="grid grid-cols-[40px_1fr_auto] lg:grid-cols-[40px_1fr_150px_auto] gap-3 lg:gap-3.5 items-center px-3 lg:px-3.5 py-[13px] rounded-2xl bg-[#f6f3fb] border-0 text-start text-[#221a2e] hover:bg-[#f1ecf9]"
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
              </button>
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
                <button type="button" onClick={() => openCourse(space.next!.courseId, space.next!.lessonId)} className="self-start border-0 text-white font-semibold text-sm px-4 py-[11px] rounded-xl" style={{ background: c }}>
                  לשיעור
                </button>
              </section>
            )}
            {space.news.length > 0 && (
              <section className={`${panel} gap-2.5`}>
                <h2 className={`${h2} text-[17px]`}>מה חדש בקורסים</h2>
                {space.news.map((n) => (
                  <button key={n.key} type="button" onClick={() => openCourse(n.courseId, n.lessonId, n.part)} className="block text-start border-0 px-3 py-[11px] rounded-[13px] bg-[#f6f3fb] text-[#221a2e] hover:bg-[#f1ecf9]">
                    <b className="block text-sm">{n.title}</b>
                    <span className="text-[12.5px] text-[#73698a]">{n.sub}</span>
                  </button>
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

      {tab === 'grades' && (anyGrades || anyAttendance) && (
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
            space.courses.filter((x) => x.features.grades || x.features.attendance).map((x) => {
              const s = stats[x.id];
              return (
                <div key={x.id} className="grid grid-cols-[1fr_auto] lg:grid-cols-[1fr_120px_140px_110px] gap-x-2.5 gap-y-1 items-center px-3.5 py-[13px] rounded-[14px] bg-[#f6f3fb]">
                  <b className="text-[15px]">{x.title}</b>
                  <span className="font-rubik font-semibold text-base">
                    {!x.features.grades ? '—' : s?.grade != null ? `${s.grade}${s.letter ? ` · ${s.letter}` : ''}` : x.state === 'todo' ? '—' : 'בתהליך'}
                  </span>
                  <span className="text-sm text-[#5f5675] lg:text-[#221a2e]">{!x.features.attendance ? '—' : s?.total ? `נוכחות ${s.attended} מתוך ${s.total}` : 'עוד אין נוכחות'}</span>
                  <button type="button" onClick={() => openCourse(x.id, null, x.features.grades ? 'grades' : 'attendance')} className="border-0 bg-transparent p-0 font-semibold text-[13.5px] justify-self-end lg:justify-self-start" style={{ color: c }}>
                    לפירוט ←
                  </button>
                </div>
              );
            })}
        </section>
      )}

      {tab === 'cert' && (
        <section className={`${panel} gap-3`}>
          <h2 className={`${h2} text-[17px] lg:text-[19px]`}>הדרך לתעודה</h2>
          {(() => {
            const req = courses.filter((x) => x.required);
            const done = req.filter((x) => x.state === 'done').length;
            const statsOf = (pick: (x: (typeof courses)[number]) => boolean) => (stats ? courses.filter(pick).map((x) => stats[x.id]).filter(Boolean) : []);
            const attendanceStats = statsOf((x) => x.features.attendance);
            const attended = attendanceStats.reduce((a, s) => a + s.attended, 0);
            const total = attendanceStats.reduce((a, s) => a + s.total, 0);
            const graded = statsOf((x) => x.features.grades).filter((s) => s.grade != null);
            const avg = graded.length ? Math.round(graded.reduce((a, s) => a + (s.grade ?? 0), 0) / graded.length) : null;
            const rows = [
              { title: 'קורסי חובה', value: `${done} מתוך ${req.length}`, pct: req.length ? (done / req.length) * 100 : 0, color: c, on: true },
              { title: 'נוכחות במפגשים', on: anyAttendance, value: stats ? (total ? `${attended} מתוך ${total}` : 'עוד אין נוכחות') : '…', pct: total ? (attended / total) * 100 : 0, color: '#1f8a5b' },
              { title: 'ממוצע ציונים', on: anyGrades, value: stats ? (avg != null ? String(avg) : 'עוד אין ציונים') : '…', pct: avg ?? 0, color: '#1f8a5b' },
            ];
            return rows.filter((r) => r.on).map((r) => (
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

/** About the program: its picture and description from the admin, opened in full on request. */
function ProgramAbout({ space, accent }: { space: ProgramSpace; accent: string }) {
  const [open, setOpen] = useState(false);
  const long = (space.about?.length ?? 0) > 260 || (space.about?.split(/\n\n/).length ?? 0) > 2;
  return (
    <section className={`${panel} !flex-row gap-4 lg:gap-5 items-start`}>
      {space.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={space.imageUrl} alt="" className="hidden sm:block w-40 lg:w-52 aspect-[4/3] object-cover rounded-2xl shrink-0" />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <h2 className={`${h2} text-[17px] lg:text-[19px]`}>על התוכנית</h2>
        {space.about ? (
          <>
            <p className={`m-0 text-[14.5px] text-[#3b3349] leading-[1.75] whitespace-pre-line ${long && !open ? 'line-clamp-3' : ''}`}>{space.about}</p>
            {long && (
              <button type="button" onClick={() => setOpen((v) => !v)} className="self-start border-0 bg-transparent p-0 font-semibold text-[13.5px]" style={{ color: accent }}>
                {open ? 'הצגת פחות' : 'קראו עוד'}
              </button>
            )}
          </>
        ) : (
          <span className="text-sm text-[#73698a]">אין תיאור עדיין.</span>
        )}
        {space.lead && <span className="text-[13px] text-[#73698a]">מנחה ראשית: {space.lead}</span>}
      </div>
    </section>
  );
}

