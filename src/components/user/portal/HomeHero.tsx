'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { HomeChip, HomeFocus, HomeNotice } from '@/app/(user)/dashboard/homeData';

const JOIN_OPENS_MIN = 10;
const glass = 'bg-white/10 border border-white/[.18]';

const timeOf = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

function useNow(initial: number) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    setNow(Date.now());
    return () => clearInterval(id);
  }, []);
  return now;
}

function countdown(ms: number) {
  const totalMin = Math.max(0, Math.ceil(ms / 60_000));
  if (totalMin < 60) return { big: String(totalMin), small: totalMin === 1 ? 'דקה עד המפגש' : 'דקות עד המפגש' };
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { big: `${h}:${String(m).padStart(2, '0')}`, small: 'שעות עד המפגש' };
}

const NoticeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true" className="shrink-0">
    <path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" />
    <path d="M17 9a4 4 0 0 1 0 6" />
  </svg>
);

export function HomeHero({
  greeting,
  orgName,
  dateLabel,
  focus,
  chips,
  updatesCount,
  notice,
  serverNow,
}: {
  greeting: string;
  orgName: string;
  dateLabel: string;
  focus: HomeFocus;
  chips: HomeChip[];
  updatesCount: number;
  notice: HomeNotice | null;
  serverNow: number;
}) {
  const now = useNow(serverNow);
  const queryClient = useQueryClient();
  const [showNotice, setShowNotice] = useState(!!notice);

  const dismiss = () => {
    setShowNotice(false);
    if (notice) {
      fetch(`/api/notifications/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      })
        .catch(() => {})
        .finally(() => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        });
    }
  };

  // Orb and button state for a live session.
  let orb: { big: string; small: string } | null = null;
  let joinOpen = false;
  let joinLabel = '';
  if (focus?.type === 'live') {
    const start = new Date(focus.start).getTime();
    const end = new Date(focus.end).getTime();
    const opensAt = start - JOIN_OPENS_MIN * 60_000;
    joinOpen = now >= opensAt && now <= end;
    if (now < start) orb = countdown(start - now);
    else if (now <= end) orb = { big: 'עכשיו', small: 'המפגש בשידור' };
    else orb = { big: 'הסתיים', small: 'ההקלטה תעלה בקרוב' };
    joinLabel = joinOpen ? 'הצטרפות למפגש' : now > end ? 'לעמוד המפגש' : `הצטרפות · נפתח ב-${timeOf(new Date(opensAt).toISOString())}`;
  } else if (focus?.type === 'continue') {
    orb = { big: `${focus.progress}%`, small: 'מהקורס הושלם' };
  }

  return (
    <section
      aria-label="היום"
      className="relative overflow-hidden isolate rounded-[26px] lg:rounded-[32px] px-[18px] pt-5 pb-[18px] lg:px-8 lg:pt-7 lg:pb-6 bg-[#1e1230] text-white flex flex-col gap-3.5 lg:gap-[22px]"
    >
      <div
        aria-hidden="true"
        className="portal-aura absolute -inset-[40%] -z-10 blur-[36px] lg:blur-[40px]"
        style={{
          background:
            'radial-gradient(40% 40% at 25% 30%, rgba(155,107,255,.75), transparent 70%), radial-gradient(35% 35% at 75% 70%, rgba(214,102,190,.55), transparent 70%), radial-gradient(30% 30% at 60% 15%, rgba(98,76,214,.6), transparent 70%)',
          animation: 'portal-drift 18s ease-in-out infinite alternate',
        }}
      />
      <div
        aria-hidden="true"
        className="portal-aura absolute -inset-[40%] -z-10 blur-[36px] lg:blur-[40px]"
        style={{
          background:
            'radial-gradient(25% 25% at 85% 25%, rgba(233,180,76,.22), transparent 70%), radial-gradient(45% 45% at 15% 85%, rgba(120,70,200,.5), transparent 70%)',
          animation: 'portal-drift2 24s ease-in-out infinite alternate',
        }}
      />

      <div className="flex justify-between items-center gap-3">
        <div className="font-semibold text-sm lg:font-rubik lg:font-medium lg:text-[19px]">{greeting}</div>
        <div className="text-sm opacity-80">{dateLabel}</div>
      </div>

      {focus ? (
        <div className="flex gap-8 items-center justify-between">
          <div className="flex flex-col gap-2.5 min-w-0 flex-1">
            <div className="text-[#e9b44c] font-semibold text-[13px] lg:text-sm">
              {focus.eyebrow}
              {orb && focus.type === 'live' && /\d/.test(orb.big) && (
                <span className="lg:hidden"> · בעוד {orb.big}</span>
              )}
            </div>
            <h1 className="m-0 text-white font-rubik font-bold text-[32px] leading-[1.1] lg:text-[52px] lg:leading-[1.05] break-words">{focus.title}</h1>
            <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm lg:text-base opacity-85">
              {focus.meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
              {focus.type === 'live' && focus.joinUrl && <span>בזום</span>}
            </div>
            <div className="flex flex-col lg:flex-row gap-3 mt-1 lg:mt-2.5">
              {focus.type === 'live' ? (
                <>
                  {joinOpen && focus.joinUrl ? (
                    <a
                      href={focus.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-12 px-[22px] rounded-[14px] bg-white text-[#2a1846] font-semibold text-[15px] grid place-items-center no-underline hover:bg-[#f1ebf8]"
                    >
                      {joinLabel}
                    </a>
                  ) : now > new Date(focus.end).getTime() || (joinOpen && !focus.joinUrl) ? (
                    <Link
                      href={focus.courseHref}
                      className="min-h-12 px-[22px] rounded-[14px] bg-white text-[#2a1846] font-semibold text-[15px] grid place-items-center no-underline"
                    >
                      לעמוד המפגש
                    </Link>
                  ) : (
                    <button type="button" disabled className="min-h-12 px-[22px] rounded-[14px] border-0 bg-white text-[#2a1846] font-semibold text-[15px] opacity-85">
                      {joinLabel}
                    </button>
                  )}
                  <a
                    href={focus.calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:grid min-h-12 px-[22px] rounded-[14px] border border-white/25 bg-white/10 text-white font-semibold text-[15px] place-items-center no-underline hover:bg-white/15"
                  >
                    הוספה ליומן
                  </a>
                </>
              ) : (
                <Link
                  href={focus.href}
                  className="min-h-12 px-[22px] rounded-[14px] bg-white text-[#2a1846] font-semibold text-[15px] grid place-items-center no-underline hover:bg-[#f1ebf8]"
                >
                  המשך ללמוד
                </Link>
              )}
            </div>
          </div>
          {orb && (
            <div
              className="hidden lg:grid relative shrink-0 w-44 h-44 rounded-full place-items-center text-center bg-white/10 border border-white/[.18]"
              style={{ boxShadow: '0 0 0 8px rgba(233,180,76,.9) inset, 0 0 40px rgba(233,180,76,.25)' }}
            >
              <div>
                <div className="font-rubik font-bold text-[42px] leading-none">{orb.big}</div>
                <div className="text-[13px] opacity-80 mt-1.5">{orb.small}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orgName && <div className="text-[#e9b44c] font-semibold text-[13px] lg:text-sm">{orgName}</div>}
          <h1 className="m-0 text-white font-rubik font-bold text-[32px] leading-[1.1] lg:text-[52px] lg:leading-[1.05]">טוב לראות אותך</h1>
          <div className="text-sm lg:text-base opacity-85">אין מפגש קרוב כרגע. כל מה שלך מחכה כאן למטה.</div>
        </div>
      )}

      {(chips.length > 0 || updatesCount > 0) && (
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:items-center">
          <span className="font-semibold text-[13px] opacity-85 lg:me-1">{updatesCount === 1 ? 'עדכון אחד' : `${updatesCount} עדכונים`}</span>
          {chips.map((c, i) => (
            <Link
              key={c.key}
              href={c.href}
              className={`${glass} ${i > 1 ? 'hidden lg:inline-block' : ''} text-white no-underline text-[13.5px] px-[13px] py-[9px] lg:py-2 rounded-full hover:bg-white/15`}
            >
              {c.label}
            </Link>
          ))}
          <Link href="/notifications" className="hidden lg:inline text-white text-[13.5px] px-1.5 py-2 underline">
            כל ההתראות
          </Link>
        </div>
      )}

      {notice && showNotice && (
        <div className={`${glass} flex gap-3 items-center px-3.5 py-3 rounded-2xl text-sm`}>
          <NoticeIcon />
          <div className="flex-1 min-w-0">
            <div className="text-xs opacity-70">הודעה מצוות בית הספר</div>
            {notice.title}
            {notice.message && notice.message !== notice.title ? <span className="opacity-90"> {notice.message}</span> : null}
          </div>
          {notice.href && (
            <Link href={notice.href} className="shrink-0 text-[#2a1846] bg-white no-underline font-semibold text-[13px] px-3.5 py-2 rounded-[10px]">
              לפרטים
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="סגירת ההודעה"
            className="shrink-0 w-[34px] h-[34px] rounded-[10px] border-0 bg-white/[.14] text-white text-lg cursor-pointer hover:bg-white/25"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}
