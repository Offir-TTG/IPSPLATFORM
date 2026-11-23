'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ClubSpace } from '@/lib/portal/spaces';
import { SpaceHero, SpaceTab } from './SpaceHero';
import { MembershipControls } from './MembershipControls';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatInTimezone, resolveDisplayTimezone } from '@/lib/datetime/timezone';
import { CourseWorkspace, courseFileCount, useCourse } from './course/CourseWorkspace';
import { HeroProgress } from './course/HeroProgress';

type Tab = 'overview' | 'lessons' | 'files' | 'grades' | 'attendance' | 'membership';
const TABS: Tab[] = ['overview', 'lessons', 'files', 'grades', 'attendance', 'membership'];
const JOIN_OPENS_MIN = 30;
const panel = 'bg-white rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold';

function calendarUrl(title: string, start: string, end: string, details: string) {
  const z = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${z(start)}/${z(end)}`, details })}`;
}

/**
 * A club, all in one page: the next meeting, every meeting with its live
 * session and recording, the files, the membership and the details.
 * ?tab= and ?lesson= open a tab or a meeting directly.
 */
export function ClubSpaceView({ space, serverNow }: { space: ClubSpace; serverNow: number }) {
  const search = useSearchParams();
  const askedTab = search?.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(askedTab && TABS.includes(askedTab) ? askedTab : search?.get('lesson') ? 'lessons' : 'overview');
  const [lessonId, setLessonId] = useState<string | null>(search?.get('lesson') ?? null);
  const [autoJoin, setAutoJoin] = useState(false);
  const [now, setNow] = useState(serverNow);
  const course = useCourse(space.courseId);
  const { data: userProfile } = useUserProfile();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const c = space.color;
  const m = space.membership;
  const n = space.next;
  const opensAt = n ? +new Date(n.start) - JOIN_OPENS_MIN * 60_000 : 0;
  const joinOpen = !!n?.joinUrl && now >= opensAt && now <= +new Date(n.end) + 3 * 3600_000;
  // The meeting's time in the client's own time zone, as in the meetings list.
  const tz = resolveDisplayTimezone({ recipientTz: userProfile?.preferences?.regional?.timezone, tenantTz: userProfile?.preferences?.regional?.tenantTimezone });
  const nextWhen = n ? formatInTimezone(n.start, tz, { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }, 'he-IL') : '';
  const opensLabel = n ? formatInTimezone(new Date(opensAt).toISOString(), tz, { hour: '2-digit', minute: '2-digit', hour12: false }, 'he-IL') : '';
  const btn = 'border-0 text-white no-underline font-semibold text-sm px-[18px] py-3 rounded-xl text-center';
  // "נ״ב" for a Hebrew name; "EO" for a Latin one (the Hebrew mark between Latin letters flips their order).
  const letters = (space.expert?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]);
  const initials = letters.every((l) => /[֐-׿]/.test(l)) ? letters.join('״') : letters.join('').toUpperCase();
  const filesCount = courseFileCount(course.data);
  // Grades / attendance only when the club's course uses them (Course → Settings).
  const usesGrades = course.data?.course.features?.grades !== false;
  const usesAttendance = course.data?.course.features?.attendance !== false;
  const shown: Tab = (tab === 'grades' && !usesGrades) || (tab === 'attendance' && !usesAttendance) ? 'overview' : tab;

  /** Opens a meeting in the meetings tab, here on the page. */
  const openMeeting = (id: string, join = false) => {
    setLessonId(id);
    setAutoJoin(join);
    setTab('lessons');
  };

  const chip = m ? (m.tone === 'ok' ? `מנוי פעיל${m.dateValue ? ` · החיוב הבא ${m.dateValue}` : ''}` : m.status) : null;

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <SpaceHero
        color={c}
        kicker={space.kicker}
        title={space.title}
        sub={space.tagline}
        side={
          <div className="self-center lg:self-auto flex flex-col items-center gap-2.5 shrink-0">
            {course.total > 0 && <HeroProgress pct={course.pct} size={112} label={`${course.doneCount} מתוך ${course.total} הושלמו`} />}
            {chip && <span className="font-semibold text-[13px] bg-white text-[#2a1846] px-3.5 py-[7px] rounded-full whitespace-nowrap">{chip}</span>}
          </div>
        }
        tabs={
          <>
            <SpaceTab on={shown === 'overview'} onClick={() => setTab('overview')}>סקירה</SpaceTab>
            <SpaceTab on={shown === 'lessons'} onClick={() => setTab('lessons')}>המפגשים</SpaceTab>
            <SpaceTab on={shown === 'files'} onClick={() => setTab('files')}>קבצים{filesCount ? ` · ${filesCount}` : ''}</SpaceTab>
            {usesGrades && <SpaceTab on={shown === 'grades'} onClick={() => setTab('grades')}>ציונים</SpaceTab>}
            {usesAttendance && <SpaceTab on={shown === 'attendance'} onClick={() => setTab('attendance')}>נוכחות</SpaceTab>}
            {m && <SpaceTab on={shown === 'membership'} onClick={() => setTab('membership')}>המנוי שלי</SpaceTab>}
          </>
        }
      />

      {shown === 'overview' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-stretch">
            <section className="rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-2.5" style={{ background: 'linear-gradient(135deg, #f6e9f4, #ffffff)' }}>
              <div className="flex justify-between items-baseline gap-3">
                <h2 className={`${h2} text-lg`}>המפגש הבא</h2>
                {n && (
                  <span className={`font-semibold text-[12.5px] px-2.5 py-[5px] rounded-full whitespace-nowrap ${joinOpen ? 'bg-[#e9b44c] text-[#2a1846]' : 'bg-[#fbefd6] text-[#7a4f00]'}`}>{joinOpen ? 'עכשיו' : nextWhen}</span>
                )}
              </div>
              {n ? (
                <>
                  <div className="font-rubik font-bold text-2xl lg:text-[28px] leading-[1.15]">{n.title}</div>
                  <div className="text-[#73698a]">{n.sub}</div>
                  <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
                    {joinOpen ? (
                      <button type="button" onClick={() => openMeeting(n.lessonId, true)} className={btn} style={{ background: c }}>
                        הצטרפות למפגש
                      </button>
                    ) : now < opensAt && opensAt - now < 24 * 3600_000 ? (
                      <button type="button" disabled className={`${btn} opacity-80`} style={{ background: c }}>
                        הצטרפות · נפתח ב-{opensLabel}
                      </button>
                    ) : null}
                    <a
                      href={calendarUrl(n.title, n.start, n.end, space.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[#e3dcef] bg-white no-underline text-[#221a2e] font-semibold text-sm px-[18px] py-[11px] rounded-xl text-center"
                    >
                      הוספה ליומן
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-[#73698a]">המפגש הבא יפורסם בקרוב. בינתיים, כל ההקלטות מחכות כאן.</div>
              )}
            </section>
            {space.expert && (
              <section className={`${panel} !flex-row gap-3.5 items-center`}>
                {space.expert.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={space.expert.avatarUrl} alt="" className="w-[56px] h-[56px] rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-[56px] h-[56px] rounded-full shrink-0 text-white font-rubik font-bold text-[17px] leading-[56px] text-center" style={{ background: c, direction: /[A-Za-z]/.test(initials) ? 'ltr' : 'rtl' }} aria-hidden="true">
                    {initials}
                  </span>
                )}
                <span className="flex flex-col gap-1 min-w-0">
                  <b className="font-rubik font-semibold text-[17px]">{space.expert.name}</b>
                  {space.expert.bio && <span className="text-[13.5px] text-[#73698a] line-clamp-4">{space.expert.bio.replace(/<[^>]+>/g, '')}</span>}
                </span>
              </section>
            )}
          </div>

          {/* About the club: description, the course overview, grades and attendance. */}
          <CourseWorkspace course={course} part="about" accent={c} listTitle="המפגשים" hideInstructor={!!space.expert} onOpenPart={(p) => setTab(p as Tab)} />

          <section className={`${panel} gap-3.5`}>
            <div className="flex justify-between items-baseline gap-3">
              <h2 className={`${h2} text-lg`}>ההקלטות האחרונות</h2>
              <button type="button" onClick={() => setTab('lessons')} className="border-0 bg-transparent font-semibold text-sm" style={{ color: '#5b3a8e' }}>
                כל המפגשים וההקלטות
              </button>
            </div>
            {space.recordings.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3.5">
                {space.recordings.slice(0, 3).map((r, i) => (
                  <button
                    key={r.lessonId}
                    type="button"
                    onClick={() => openMeeting(r.lessonId)}
                    className="text-start border-0 p-0 bg-white rounded-2xl overflow-hidden shadow-[0_0_0_1px_#e9e3f1] flex flex-col hover:shadow-[0_0_0_1px_#d9cfea,0_10px_24px_-16px_rgba(60,30,110,.4)]"
                  >
                    <span className="h-[100px] lg:h-[110px] w-full grid place-items-center" style={{ background: `linear-gradient(140deg, ${c}, #2a1846)`, filter: `hue-rotate(${i * 10}deg)` }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="p-3 flex flex-col gap-0.5">
                      <b className="text-sm text-[#221a2e]">{r.title}</b>
                      <span className="text-[12.5px] text-[#73698a]">{r.meta}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[#73698a] text-sm">ההקלטה של כל מפגש תעלה לכאן אחרי המפגש.</span>
            )}
          </section>
        </div>
      )}

      {(shown === 'lessons' || shown === 'files' || shown === 'grades' || shown === 'attendance') && (
        <CourseWorkspace
          course={course}
          part={shown}
          accent={c}
          listTitle="המפגשים"
          lessonId={lessonId}
          autoJoin={autoJoin}
          onOpenLesson={(id) => openMeeting(id)}
          onLessonChange={(id) => {
            setLessonId(id);
            setAutoJoin(false);
          }}
        />
      )}

      {shown === 'membership' && m && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-stretch">
          <section className={`${panel} gap-2.5`}>
            <h2 className={`${h2} text-[17px] lg:text-[19px] mb-1`}>המנוי שלי</h2>
            <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
              <span>מסלול</span>
              <b>{m.planLabel}</b>
            </div>
            {m.upcomingLine && <div className="text-[13.5px] text-[#5b3a8e] font-medium -mt-1">{m.upcomingLine}</div>}
            {m.dateLabel && m.dateValue && (
              <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
                <span>{m.dateLabel}</span>
                <b>{m.dateValue}</b>
              </div>
            )}
            <div className="flex justify-between text-[14.5px] py-2">
              <span>מצב</span>
              <b>{m.status}</b>
            </div>
            <Link href="/billing" className="font-semibold text-sm no-underline" style={{ color: c }}>
              כרטיס, מנויים וקבלות ←
            </Link>
          </section>
          <section className={`${panel} gap-3`}>
            <h2 className={`${h2} text-[17px] lg:text-[19px]`}>שינוי במנוי</h2>
            <MembershipControls m={m} accent={c} />
          </section>
        </div>
      )}
    </div>
  );
}
