'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ClubSpace } from '@/lib/portal/spaces';
import { SpaceHero, SpaceTab } from './SpaceHero';
import { MembershipControls } from './MembershipControls';

type Tab = 'overview' | 'media' | 'membership';
const JOIN_OPENS_MIN = 10;
const panel = 'bg-white rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold';
const time = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

function calendarUrl(title: string, start: string, end: string, details: string) {
  const z = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${z(start)}/${z(end)}`, details })}`;
}

export function ClubSpaceView({ space, serverNow }: { space: ClubSpace; serverNow: number }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const c = space.color;
  const m = space.membership;
  const n = space.next;
  const opensAt = n ? +new Date(n.start) - JOIN_OPENS_MIN * 60_000 : 0;
  const joinOpen = !!n?.joinUrl && now >= opensAt && now <= +new Date(n!.end);
  const btn = 'border-0 text-white no-underline font-semibold text-sm px-[18px] py-3 rounded-xl text-center';
  const initials = (space.expert?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('״');

  const recordingCard = (r: ClubSpace['recordings'][number], i: number) => (
    <Link
      key={r.lessonId}
      href={`/courses/${space.courseId}`}
      className="text-start no-underline text-[#221a2e] bg-white rounded-2xl overflow-hidden shadow-[0_0_0_1px_#e9e3f1] flex flex-col hover:shadow-[0_0_0_1px_#d9cfea,0_10px_24px_-16px_rgba(60,30,110,.4)]"
    >
      <span className="h-[100px] lg:h-[130px] grid place-items-center" style={{ background: `linear-gradient(140deg, ${c}, #2a1846)`, filter: `hue-rotate(${i * 8}deg)` }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="p-3 flex flex-col gap-0.5">
        <b className="text-sm">{r.title}</b>
        <span className="text-[12.5px] text-[#73698a]">{r.meta}</span>
      </span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-5">
      <SpaceHero
        color={c}
        kicker={space.kicker}
        title={space.title}
        sub={space.tagline}
        side={m && <span className="self-start lg:self-auto font-semibold text-[13px] bg-white text-[#2a1846] px-3.5 py-[7px] rounded-full whitespace-nowrap">{m.tone === 'ok' ? 'מנוי פעיל' : m.status}</span>}
        tabs={
          <>
            <SpaceTab on={tab === 'overview'} onClick={() => setTab('overview')}>סקירה</SpaceTab>
            <SpaceTab on={tab === 'media'} onClick={() => setTab('media')}>מפגשים והקלטות</SpaceTab>
            {m && <SpaceTab on={tab === 'membership'} onClick={() => setTab('membership')}>המנוי</SpaceTab>}
          </>
        }
      />

      {tab === 'overview' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
            <section className="rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, #f3edf8, #ffffff)' }}>
              <div className="flex justify-between items-baseline gap-3">
                <h2 className={`${h2} text-lg`}>המפגש הבא</h2>
                {n && <span className="font-semibold text-[12.5px] bg-[#fbefd6] text-[#7a4f00] px-2.5 py-[5px] rounded-full whitespace-nowrap">{n.when}</span>}
              </div>
              {n ? (
                <>
                  <div className="font-rubik font-bold text-2xl lg:text-[28px] leading-[1.15]">{n.title}</div>
                  <div className="text-[#73698a]">{n.sub}</div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {joinOpen ? (
                      <a href={n.joinUrl!} target="_blank" rel="noopener noreferrer" className={btn} style={{ background: c }}>
                        הצטרפות למפגש
                      </a>
                    ) : n.joinUrl && now < opensAt && opensAt - now < 24 * 3600_000 ? (
                      <button type="button" disabled className={`${btn} opacity-80`} style={{ background: c }}>
                        הצטרפות · נפתח ב-{time(new Date(opensAt).toISOString())}
                      </button>
                    ) : (
                      <a href={calendarUrl(n.title, n.start, n.end, space.title)} target="_blank" rel="noopener noreferrer" className={btn} style={{ background: c }}>
                        הוספה ליומן
                      </a>
                    )}
                    <Link href={`/courses/${space.courseId}`} className="border border-[#e3dcef] bg-white no-underline text-[#221a2e] font-semibold text-sm px-[18px] py-[11px] rounded-xl text-center">
                      לעמוד המועדון
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-[#73698a]">המפגש הבא יפורסם בקרוב. בינתיים, כל ההקלטות מחכות כאן למטה.</div>
              )}
            </section>
            {space.expert && (
              <section className={`${panel} !flex-row gap-3.5 items-center`}>
                {space.expert.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={space.expert.avatarUrl} alt="" className="w-[72px] h-[72px] rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-[72px] h-[72px] rounded-full shrink-0 text-white font-rubik font-bold text-[22px] leading-[72px] text-center" style={{ background: `linear-gradient(140deg, ${c}, #2a1846)` }}>
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

          <section className={`${panel} gap-3.5`}>
            <div className="flex justify-between items-baseline">
              <h2 className={`${h2} text-lg`}>מההקלטות האחרונות</h2>
              {space.recordings.length > 4 && (
                <button type="button" onClick={() => setTab('media')} className="border-0 bg-transparent font-semibold text-sm" style={{ color: c }}>
                  כל ההקלטות
                </button>
              )}
            </div>
            {space.recordings.length ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5">{space.recordings.slice(0, 4).map(recordingCard)}</div>
            ) : (
              <span className="text-[#73698a] text-sm">ההקלטה של כל מפגש תעלה לכאן אחרי המפגש.</span>
            )}
          </section>
        </div>
      )}

      {tab === 'media' && (
        <section className={`${panel} gap-3`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-baseline gap-3">
            <div>
              <h2 className={`${h2} text-[17px] lg:text-[19px]`}>מפגשים והקלטות</h2>
              <span className="text-[#73698a] text-[13.5px]">כל מפגש הוא שיעור בעמוד המועדון, עם ההקלטה והמדריכים שלו</span>
            </div>
            <Link href={`/courses/${space.courseId}`} className="self-start text-white no-underline font-semibold text-sm px-4 py-[11px] rounded-xl whitespace-nowrap" style={{ background: c }}>
              לעמוד המועדון המלא
            </Link>
          </div>
          {space.recordings.map((r) => (
            <Link key={r.lessonId} href={`/courses/${space.courseId}`} className="grid grid-cols-[1fr_auto] gap-3 items-center px-3.5 py-[13px] rounded-[14px] bg-[#f6f2fb] no-underline text-[#221a2e] hover:bg-[#f1ecf9]">
              <span className="min-w-0">
                <b className="block text-[15px]">{r.title}</b>
                <span className="text-[12.5px] text-[#73698a]">{r.meta}</span>
              </span>
              <span className="font-semibold text-[13.5px]" style={{ color: c }}>
                לצפייה ←
              </span>
            </Link>
          ))}
          {space.recordings.length === 0 && <span className="text-[#73698a] text-sm">עוד אין הקלטות.</span>}
        </section>
      )}

      {tab === 'membership' && m && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start">
          <section className={`${panel} gap-2.5`}>
            <h2 className={`${h2} text-[17px] lg:text-[19px] mb-1`}>המנוי שלי</h2>
            <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
              <span>מסלול</span>
              <b>{m.planLabel}</b>
            </div>
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
            <h2 className={`${h2} text-[17px] lg:text-[19px]`}>שינויים במנוי</h2>
            <MembershipControls m={m} accent={c} />
          </section>
        </div>
      )}
    </div>
  );
}
