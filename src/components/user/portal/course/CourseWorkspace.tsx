'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatInTimezone, resolveDisplayTimezone } from '@/lib/datetime/timezone';
import { LessonPanel } from './LessonPanel';
import { CourseGrades } from './CourseGrades';
import { CourseAttendance } from './CourseAttendance';
import { CourseOverviewCard } from './CourseOverviewCard';
import { canJoin, categoryLabel, fileExt, fileUrlOf, fileKind, fileSize, hasHtmlText, hasLiveMeeting, plainText, sessionEnded, type CourseData, type Lesson, type Material } from './courseModel';

/**
 * A course's content, shown inside whichever space holds it: a club, a
 * program, or the course's own page. One loader (GET /api/user/courses/[id])
 * and three parts the space places under its own header and tabs.
 */

export type CoursePart = 'lessons' | 'files' | 'about' | 'grades' | 'attendance';
const panel = 'bg-white rounded-[22px] shadow-[0_1px_0_#e9e3f1]';

export function useCourse(courseId: string | null, preview = false) {
  const [data, setData] = useState<CourseData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [status, setStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/user/courses/${courseId}${preview ? '?preview=1' : ''}`, { credentials: 'include' });
      setStatus(res.status);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error(json?.error || 'Failed to load course');
      setData(json.data);
      setState('ready');
    } catch (e) {
      console.error('Error loading course:', e);
      setState('missing');
    }
  }, [courseId, preview]);

  useEffect(() => {
    setData(null);
    setState('loading');
    load();
  }, [load]);

  const lessons = useMemo(
    () => (data?.modules ?? []).flatMap((m, mi) => m.lessons.map((l, li) => ({ lesson: l, module: m, mi, li }))),
    [data?.modules],
  );
  const doneSet = useMemo(
    () => new Set((data?.progress.lesson_progress ?? []).filter((p) => p.status === 'completed').map((p) => p.lesson_id)),
    [data?.progress.lesson_progress],
  );

  /** Marks lessons done or not done: on screen at once, then saved; reloads if saving fails. */
  async function setProgress(lessonIds: string[], complete: boolean) {
    if (!courseId) return;
    const status = complete ? 'completed' : 'not_started';
    const now = new Date().toISOString();
    setData((prev) => {
      if (!prev) return prev;
      const rest = prev.progress.lesson_progress.filter((p) => !lessonIds.includes(p.lesson_id));
      const lesson_progress = [
        ...rest,
        ...lessonIds.map((id) => ({ lesson_id: id, status, progress_percentage: complete ? 100 : 0, completed_at: complete ? now : null, last_accessed_at: now })),
      ];
      const completed = lesson_progress.filter((p) => p.status === 'completed').length;
      const total = prev.statistics.total_lessons;
      return { ...prev, progress: { ...prev.progress, lesson_progress, completed_lessons: completed, in_progress_lessons: 0, overall_progress: total ? Math.round((completed / total) * 100) : 0 } };
    });
    try {
      const results = await Promise.all(
        lessonIds.map((id) =>
          fetch(`/api/user/courses/${courseId}/lessons/${id}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, progress_percentage: complete ? 100 : 0 }),
          }),
        ),
      );
      if (results.some((r) => !r.ok)) throw new Error();
    } catch {
      toast.error('לא הצלחנו לשמור את ההתקדמות. נסו שוב.');
      await load();
    }
  }

  const total = lessons.length;
  const doneCount = lessons.filter((x) => doneSet.has(x.lesson.id)).length;
  return { data, state, status, lessons, doneSet, setProgress, total, doneCount, pct: total ? Math.round((doneCount / total) * 100) : 0 };
}

export type CourseHandle = ReturnType<typeof useCourse>;


type LessonFile = { id: string; title: string; name: string; url: string; ext: string; lessonId: string; lessonTitle: string };

/** Files uploaded inside lessons (PDF and download items), in lesson order. */
export function lessonFilesOf(data: CourseData | null): LessonFile[] {
  if (!data) return [];
  return data.modules.flatMap((m) =>
    m.lessons.flatMap((l) =>
      l.lesson_topics
        .filter((t) => (t.content_type === 'pdf' || t.content_type === 'download') && fileUrlOf(t.content))
        .map((t) => {
          const url = fileUrlOf(t.content)!;
          const name: string = (typeof t.content === 'object' && (t.content?.filename || t.content?.fileName)) || '';
          const fromName = (name || url.split('?')[0]).split('.').pop() ?? '';
          const ext = t.content_type === 'pdf' ? 'PDF' : fromName.length <= 5 ? fromName.toUpperCase() : 'FILE';
          return { id: t.id, title: t.title, name, url, ext, lessonId: l.id, lessonTitle: l.title };
        }),
    ),
  );
}

/** Everything in the files tab: the course's own files and the lessons' files. */
export const courseFileCount = (data: CourseData | null) => (data ? data.materials.length + lessonFilesOf(data).length : 0);

/** The course's content under the space's header: one of its three parts. */
export function CourseWorkspace({
  course,
  part,
  accent,
  listTitle = 'השיעורים',
  lessonId,
  onLessonChange,
  autoJoin = false,
  hideInstructor = false,
  onOpenLesson,
  onOpenPart,
}: {
  /** From the details: open the course's grades or attendance tab. */
  onOpenPart?: (part: CoursePart) => void;
  /** From the files list: open a lesson in the lessons part. */
  onOpenLesson?: (lessonId: string) => void;
  /** The space already shows its expert (a club's overview): don't repeat it in the details. */
  hideInstructor?: boolean;
  course: CourseHandle;
  part: CoursePart;
  accent: string;
  listTitle?: string;
  /** The open lesson (?lesson=). Without one: the meeting open now or next, else the first not done. */
  lessonId?: string | null;
  onLessonChange?: (id: string) => void;
  /** Open the lesson's live meeting at once (from "הצטרפות למפגש" elsewhere in the space). */
  autoJoin?: boolean;
}) {
  const { data, state, lessons, doneSet, setProgress, total, doneCount } = course;
  const { data: userProfile } = useUserProfile();
  const [sel, setSel] = useState<string | null>(lessonId ?? null);
  const [phoneLesson, setPhoneLesson] = useState(!!lessonId);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  // Asked to open a particular lesson (from elsewhere in the space).
  useEffect(() => {
    if (lessonId) {
      setSel(lessonId);
      setPhoneLesson(true);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!lessons.length || (sel && lessons.some((x) => x.lesson.id === sel))) return;
    const now = Date.now();
    const upcoming = lessons
      .filter((x) => hasLiveMeeting(x.lesson) && x.lesson.start_time && !sessionEnded(x.lesson, now))
      .sort((a, b) => +new Date(a.lesson.start_time!) - +new Date(b.lesson.start_time!))[0];
    setSel((upcoming ?? lessons.find((x) => !doneSet.has(x.lesson.id)) ?? lessons[0]).lesson.id);
  }, [lessons, sel, doneSet]);

  if (state === 'loading') {
    return (
      <div className={`${panel} grid place-items-center min-h-[240px]`}>
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b3a8e]" aria-label="טוענים" />
      </div>
    );
  }
  if (!data) {
    const why =
      course.status === 402
        ? 'הגישה לתוכן תיפתח אחרי התשלום.'
        : course.status === 403
          ? 'התוכן הזה עוד לא פתוח. הצוות יפתח אותו בקרוב.'
          : 'לא הצלחנו לטעון את התוכן. נסו לרענן את העמוד.';
    return <div className={`${panel} p-8 text-center text-[#73698a]`}>{why}</div>;
  }

  const tz = (lesson: Lesson) =>
    resolveDisplayTimezone({
      recipientTz: userProfile?.preferences?.regional?.timezone,
      lessonTz: lesson.timezone ?? undefined,
      tenantTz: userProfile?.preferences?.regional?.tenantTimezone,
    });
  const whenLabel = (lesson: Lesson) =>
    lesson.start_time
      ? formatInTimezone(lesson.start_time, tz(lesson), { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }, 'he-IL')
      : null;
  const shortDate = (lesson: Lesson) => (lesson.start_time ? formatInTimezone(lesson.start_time, tz(lesson), { day: 'numeric', month: 'numeric' }, 'he-IL') : '');

  const badgeOf = (l: Lesson): { text: string; cls: string } | null => {
    const live = hasLiveMeeting(l);
    if (live && l.start_time && canJoin(l)) return { text: 'חי עכשיו', cls: 'bg-[#e9b44c] text-[#2a1846]' };
    if (live && l.start_time && !sessionEnded(l)) return { text: shortDate(l), cls: 'bg-[#f1ebf8] text-[#5b3a8e]' };
    if (l.recording_url) return { text: 'הקלטה', cls: 'bg-[#eef1fb] text-[#3f4c9a]' };
    if (live && sessionEnded(l)) return { text: 'ההקלטה בדרך', cls: 'bg-[#fbefd6] text-[#7a4f00]' };
    return null;
  };
  const open = (id: string) => {
    setSel(id);
    setPhoneLesson(true);
    onLessonChange?.(id);
  };
  const current = lessons.find((x) => x.lesson.id === sel) ?? lessons[0];
  const { course: info, statistics, materials } = data;
  const desc = plainText(info.description);
  const backLabel = listTitle === 'המפגשים' ? 'כל המפגשים' : 'כל השיעורים';
  // Above the lesson title: its place ("מפגש 3 מתוך 8"); the module's name only when there are several.
  const whereOf = (x: (typeof lessons)[number]) => {
    const n = lessons.indexOf(x) + 1;
    const place = `${listTitle === 'המפגשים' ? 'מפגש' : 'שיעור'} ${n} מתוך ${total}`;
    return data.modules.length > 1 ? `${x.module.title} · ${place}` : place;
  };
  const lessonFiles = lessonFilesOf(data);
  const lessonGroups = lessonFiles.reduce<{ lessonId: string; lessonTitle: string; files: LessonFile[] }[]>((acc, f) => {
    const g = acc.find((x) => x.lessonId === f.lessonId);
    if (g) g.files.push(f);
    else acc.push({ lessonId: f.lessonId, lessonTitle: f.lessonTitle, files: [f] });
    return acc;
  }, []);

  return (
    <>
      {part === 'lessons' &&
        (total === 0 ? (
          <div className={`${panel} p-8 text-center text-[#73698a]`}>אין תוכן עדיין.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-4 items-start">
            <section className={`${panel} p-2.5 lg:p-3.5 flex flex-col gap-1.5 ${phoneLesson ? 'hidden lg:flex' : ''}`}>
              <div className="flex justify-between items-center px-1.5 pt-1 pb-2">
                <h2 className="m-0 font-rubik font-semibold text-lg text-[#221a2e]">{listTitle}</h2>
                <button
                  type="button"
                  disabled={busyAll}
                  onClick={async () => {
                    setBusyAll(true);
                    await setProgress(lessons.map((x) => x.lesson.id), doneCount !== total);
                    setBusyAll(false);
                  }}
                  className="border-0 bg-transparent text-[#5b3a8e] font-semibold text-[13px] px-1.5 py-2 disabled:opacity-60"
                >
                  {doneCount === total ? 'ביטול סימון הכול' : 'סימון הכול כהושלם'}
                </button>
              </div>
              {data.modules.map((m) => (
                <div key={m.id} className="flex flex-col gap-1 pt-1.5">
                  <div className="flex justify-between items-baseline gap-2 px-2 py-1.5">
                    <b className="font-rubik font-semibold text-[14.5px]">{m.title}</b>
                    <span className="flex items-center gap-1.5 text-xs text-[#73698a] shrink-0">
                      {m.is_optional && <span className="font-semibold bg-[#f1ebf8] text-[#5b3a8e] px-2 py-0.5 rounded-full">רשות</span>}
                      {m.lessons.length} {listTitle === 'המפגשים' ? 'מפגשים' : m.lessons.length === 1 ? 'שיעור' : 'שיעורים'}
                      {m.duration_minutes ? ` · ${m.duration_minutes} דק׳` : ''}
                    </span>
                  </div>
                  {hasHtmlText(m.description) && (
                    <div className="px-2 pb-1 text-[13px] text-[#73698a] prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: m.description || '' }} />
                  )}
                  {m.lessons.length === 0 && <span className="px-2 py-2 text-[13px] text-[#73698a]">אין שיעורים כאן עדיין.</span>}
                  {m.lessons.map((l) => {
                    const on = current?.lesson.id === l.id;
                    const done = doneSet.has(l.id);
                    const badge = badgeOf(l);
                    const meta = [whenLabel(l), l.lesson_topics.length ? `${l.lesson_topics.length} תכנים` : null].filter(Boolean).join(' · ');
                    return (
                      <div
                        key={l.id}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[14px] ${on ? 'lg:bg-[#f3eef9]' : ''}`}
                        style={on ? { boxShadow: `inset 0 0 0 1.5px ${accent}` } : undefined}
                      >
                        <button
                          type="button"
                          onClick={() => setProgress([l.id], !done)}
                          aria-pressed={done}
                          aria-label={done ? `${l.title}: הושלם. לחיצה מבטלת` : `סימון ${l.title} כהושלם`}
                          className={`shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center font-rubik font-bold text-sm ${done ? 'bg-[#1f8a5b] text-white' : 'border-[1.5px] border-[#cfc4e2] bg-white text-transparent'}`}
                        >
                          ✓
                        </button>
                        <button type="button" onClick={() => open(l.id)} className="flex-1 min-w-0 border-0 bg-transparent text-start py-1 flex flex-col gap-0.5 text-[#221a2e]">
                          <b className="text-[14.5px] font-semibold">{l.title}</b>
                          {meta && <span className="text-[12.5px] text-[#73698a]">{meta}</span>}
                        </button>
                        {badge && <span className={`shrink-0 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.text}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </section>

            {current && (
              <div className={phoneLesson ? '' : 'hidden lg:block'}>
                <LessonPanel
                  lesson={current.lesson}
                  where={whereOf(current)}
                  numbering={`${current.mi + 1}.${current.li + 1}`}
                  done={doneSet.has(current.lesson.id)}
                  accent={accent}
                  whenLabel={whenLabel}
                  autoJoin={autoJoin && current.lesson.id === lessonId}
                  onToggle={() => setProgress([current.lesson.id], !doneSet.has(current.lesson.id))}
                  onBack={() => setPhoneLesson(false)}
                  backLabel={backLabel}
                />
              </div>
            )}
          </div>
        ))}

      {part === 'files' && (
        <section className={`${panel} p-3 lg:p-[18px] flex flex-col gap-2`}>
          <h2 className="m-0 px-1.5 pt-1 pb-1.5 font-rubik font-semibold text-lg text-[#221a2e]">קבצים וחומרים</h2>
          {materials.length === 0 && lessonFiles.length === 0 && <span className="px-1.5 py-3 text-sm text-[#73698a]">אין קבצים עדיין.</span>}
          {materials.length > 0 && lessonFiles.length > 0 && <h3 className="m-0 px-1.5 pt-1 font-rubik font-semibold text-[15px] text-[#5f5675]">קבצי הקורס</h3>}
          {materials.map((m) => (
            <div key={m.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 lg:gap-3.5 px-3 lg:px-3.5 py-3 rounded-2xl bg-[#f8f5fc]">
              <span className="shrink-0 w-11 h-11 rounded-xl bg-white shadow-[inset_0_0_0_1px_#e3dcef] grid place-items-center font-rubik font-bold text-[10.5px] text-[#5b3a8e]">{fileExt(m)}</span>
              <span className="flex-1 min-w-0">
                <b className="block text-[15px]">{m.title}</b>
                <span className="text-[13px] text-[#73698a]">{[m.description, categoryLabel(m.category), fileSize(m.file_size)].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="flex gap-2 ms-auto">
                {fileKind(m.file_type) !== 'other' && (
                  <button type="button" onClick={() => setViewing(m)} className="border border-[#e3dcef] bg-white font-semibold text-[13.5px] px-3.5 py-2.5 rounded-[11px] text-[#221a2e] hover:bg-[#faf8fd]">
                    צפייה
                  </button>
                )}
                <a href={m.file_url} download={m.file_name} target="_blank" rel="noopener noreferrer" className="no-underline bg-[#5b3a8e] text-white font-semibold text-[13.5px] px-3.5 py-2.5 rounded-[11px]">
                  הורדה
                </a>
              </span>
            </div>
          ))}
          {lessonGroups.map((g) => (
            <div key={g.lessonId} className="flex flex-col gap-2 pt-2">
              <div className="flex justify-between items-baseline gap-2 px-1.5">
                <h3 className="m-0 font-rubik font-semibold text-[15px] text-[#5f5675]">{g.lessonTitle}</h3>
                {onOpenLesson && (
                  <button type="button" onClick={() => onOpenLesson(g.lessonId)} className="border-0 bg-transparent font-semibold text-[13px] text-[#5b3a8e] py-1">
                    {listTitle === 'המפגשים' ? 'למפגש ←' : 'לשיעור ←'}
                  </button>
                )}
              </div>
              {g.files.map((f) => (
                <div key={f.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 lg:gap-3.5 px-3 lg:px-3.5 py-3 rounded-2xl bg-[#f8f5fc]">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-white shadow-[inset_0_0_0_1px_#e3dcef] grid place-items-center font-rubik font-bold text-[10.5px] text-[#5b3a8e]">{f.ext}</span>
                  <span className="flex-1 min-w-0">
                    <b className="block text-[15px]">{f.title}</b>
                    {f.name && f.name !== f.title && (
                      <span className="block text-[13px] text-[#73698a] truncate" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {f.name}
                      </span>
                    )}
                  </span>
                  <span className="flex gap-2 ms-auto">
                    {f.ext === 'PDF' && (
                      <button
                        type="button"
                        onClick={() => setViewing({ id: f.id, title: f.title, description: null, file_name: f.name || f.title, file_url: f.url, file_type: 'application/pdf', file_size: 0, category: null, is_published: true, display_order: 0, created_at: '' })}
                        className="border border-[#e3dcef] bg-white font-semibold text-[13.5px] px-3.5 py-2.5 rounded-[11px] text-[#221a2e] hover:bg-[#faf8fd]"
                      >
                        צפייה
                      </button>
                    )}
                    <a href={f.url} download={f.name || undefined} target="_blank" rel="noopener noreferrer" className="no-underline bg-[#5b3a8e] text-white font-semibold text-[13.5px] px-3.5 py-2.5 rounded-[11px]">
                      הורדה
                    </a>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {part === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            {/* The whole description, at its natural height; the page scrolls, not a small box. */}
            <section className={`${panel} p-4 lg:p-[22px] flex flex-col gap-2.5`}>
              {info.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.image_url} alt="" className="w-full h-40 lg:h-56 object-cover rounded-2xl" />
              )}
              <h2 className="m-0 font-rubik font-semibold text-lg text-[#221a2e]">{listTitle === 'המפגשים' ? 'על המועדון' : 'על הקורס'}</h2>
              {desc ? (
                <p className="m-0 text-[15px] text-[#3b3349] leading-[1.75] whitespace-pre-line">{desc}</p>
              ) : (
                <span className="text-sm text-[#73698a]">אין תיאור עדיין.</span>
              )}
            </section>
            {info.instructor && !hideInstructor && (
              <section className={`${panel} p-4 lg:p-[22px] flex items-start gap-3.5`}>
                {info.instructor_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.instructor_avatar} alt="" className="w-14 h-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="w-14 h-14 shrink-0 rounded-full grid place-items-center text-white font-rubik font-bold text-[17px]" style={{ background: accent }}>
                    {info.instructor
                      .split(' ')
                      .map((w) => w.charAt(0))
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')}
                  </span>
                )}
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[12.5px] text-[#73698a]">מנחה</span>
                  <b className="font-rubik font-semibold text-[17px]">{info.instructor}</b>
                  {info.instructor_bio && plainText(info.instructor_bio) && (
                    <span className="text-[13.5px] text-[#73698a] leading-[1.6] whitespace-pre-line">{plainText(info.instructor_bio)}</span>
                  )}
                </span>
              </section>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <CourseOverviewCard statistics={statistics} />
            {onOpenPart && (info.features?.grades !== false || info.features?.attendance !== false) && (
              <section className={`${panel} p-3.5 flex flex-col gap-1.5`}>
                  {info.features?.grades !== false && (
                    <button type="button" onClick={() => onOpenPart('grades')} className="flex justify-between p-3 rounded-[13px] bg-[#f8f5fc] border-0 text-[#221a2e] text-[14.5px] hover:bg-[#f3eef9]">
                      <span>הציונים שלי בקורס</span>
                      <b className="text-[#5b3a8e]">←</b>
                    </button>
                  )}
                  {info.features?.attendance !== false && (
                    <button type="button" onClick={() => onOpenPart('attendance')} className="flex justify-between p-3 rounded-[13px] bg-[#f8f5fc] border-0 text-[#221a2e] text-[14.5px] hover:bg-[#f3eef9]">
                      <span>הנוכחות שלי בקורס</span>
                      <b className="text-[#5b3a8e]">←</b>
                    </button>
                  )}
              </section>
            )}
          </div>
        </div>
      )}

      {part === 'grades' && info.features?.grades !== false && <CourseGrades courseId={info.id} accent={accent} />}
      {part === 'attendance' && info.features?.attendance !== false && <CourseAttendance courseId={info.id} accent={accent} onOpenLesson={onOpenLesson} />}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function MaterialViewer({ material, onClose }: { material: Material; onClose: () => void }) {
  const kind = fileKind(material.file_type);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] bg-[rgba(30,18,48,.6)] flex items-center justify-center p-3 lg:p-8" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={material.title} className="w-full max-w-5xl h-full max-h-[90vh] bg-white rounded-[22px] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 lg:px-[18px] py-3.5 border-b border-[#efe9f6]">
          <span className="flex-1 min-w-0">
            <b className="block font-rubik font-semibold text-base truncate">{material.title}</b>
            <span className="block text-xs text-[#73698a] truncate" style={{ direction: 'ltr', textAlign: 'right' }}>
              {material.file_name}
            </span>
          </span>
          <a href={material.file_url} download={material.file_name} target="_blank" rel="noopener noreferrer" className="no-underline border border-[#e3dcef] bg-white font-semibold text-[13.5px] px-3.5 py-2 rounded-[11px] text-[#221a2e]">
            הורדה
          </a>
          <button type="button" onClick={onClose} aria-label="סגירה" className="w-[38px] h-[38px] rounded-[11px] bg-[#f3eef9] grid place-items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#221a2e" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 relative bg-[#f6f3fa]">
          {kind === 'pdf' && <iframe src={material.file_url} title={material.title} className="absolute inset-0 w-full h-full border-0" />}
          {kind === 'image' && (
            <div className="absolute inset-0 grid place-items-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={material.file_url} alt={material.title} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          {kind === 'video' && <video src={material.file_url} className="absolute inset-0 w-full h-full bg-black" controls autoPlay />}
          {kind === 'other' && <div className="absolute inset-0 grid place-items-center text-[#73698a] text-sm">אין תצוגה מקדימה לסוג הקובץ הזה. אפשר להוריד אותו.</div>}
        </div>
      </div>
    </div>
  );
}
