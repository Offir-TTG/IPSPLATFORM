'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ClientSession } from '@/lib/portal/clientSessions';

export type CalendarDay = { key: string; name: string; short: string; date: string; isToday: boolean };

const TZ = 'Asia/Jerusalem';
const JOIN_OPENS_MIN = 10;
const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const time = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

type Filter = 'all' | ClientSession['group'];
const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: 'all', label: 'הכול', color: '#221a2e' },
  { key: 'me', label: 'קורסים', color: '#5b3a7e' },
  { key: 'kids', label: 'הילדים', color: '#7a4a8f' },
  { key: 'adler', label: 'תוכניות', color: '#4f3a9c' },
  { key: 'clubs', label: 'מועדונים', color: '#8a3f86' },
  { key: 'lectures', label: 'הרצאות', color: '#8b63b3' },
];

export function CalendarView({ days, sessions, serverNow }: { days: CalendarDay[]; sessions: ClientSession[]; serverNow: number }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [week, setWeek] = useState<0 | 1>(0);
  const [syncOpen, setSyncOpen] = useState(false);
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Only offer filters that have something behind them.
  const present = new Set(sessions.map((s) => s.group));
  const filters = FILTERS.filter((f) => f.key === 'all' || present.has(f.key as ClientSession['group']));
  const weekDays = days.slice(week * 7, week * 7 + 7);
  const weekKeys = new Set(weekDays.map((d) => d.key));
  const evs = sessions.filter((s) => weekKeys.has(dayKey(s.start)) && (filter === 'all' || s.group === filter));
  const dayOf = (s: ClientSession) => weekDays.find((d) => d.key === dayKey(s.start))!;
  const canJoin = (s: ClientSession) => !!s.joinUrl && now >= +new Date(s.start) - JOIN_OPENS_MIN * 60_000 && now <= +new Date(s.end);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="m-0 text-[#221a2e] font-rubik font-bold text-[26px] lg:text-[30px]">יומן</h1>
          <div className="text-[#73698a] mt-1">כל המפגשים וההרצאות שלך, במקום אחד</div>
        </div>
        <button
          type="button"
          onClick={() => setSyncOpen((o) => !o)}
          aria-expanded={syncOpen}
          className="shrink-0 border border-[#e3dcef] bg-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-[#faf8fd]"
        >
          חיבור ליומן בטלפון
        </button>
      </div>
      {syncOpen && (
        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_1px_0_#e9e3f1] text-sm text-[#3b3349] flex flex-col lg:flex-row lg:items-center gap-3">
          <span className="flex-1">
            קובץ עם כל המפגשים של שלושת החודשים הקרובים. פותחים אותו בטלפון או במחשב, והמפגשים נכנסים ליומן של גוגל או של האייפון. אם משהו זז, מורידים את הקובץ שוב.
          </span>
          <a
            href="/api/user/calendar/ics"
            className="shrink-0 text-center bg-[#5b3a8e] hover:bg-[#4a2f75] text-white no-underline font-semibold text-sm px-4 py-2.5 rounded-xl"
          >
            הורדה ליומן
          </a>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1" role="group" aria-label="סינון">
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 inline-flex gap-[7px] items-center border-0 px-3.5 py-2 rounded-full text-sm font-medium ${
                  on ? 'bg-[#221a2e] text-white' : 'bg-white text-[#221a2e] shadow-[inset_0_0_0_1px_#e3dcef]'
                }`}
              >
                <span className="w-[9px] h-[9px] rounded-full" style={{ background: on && f.key === 'all' ? '#fff' : f.color }} />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="self-start flex gap-1 bg-white rounded-xl p-1 shadow-[inset_0_0_0_1px_#e3dcef]">
          {(['השבוע', 'השבוע הבא'] as const).map((label, w) => (
            <button
              key={label}
              type="button"
              aria-pressed={week === w}
              onClick={() => setWeek(w as 0 | 1)}
              className={`border-0 px-3.5 py-[7px] rounded-[9px] font-semibold text-[13.5px] ${week === w ? 'bg-[#5b3a8e] text-white' : 'bg-transparent text-[#5f5675]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Week grid: desktop only; the list below serves phones. */}
      <div className="hidden lg:grid grid-cols-7 gap-2.5">
        {weekDays.map((d) => (
          <div
            key={d.key}
            className={`min-h-[150px] rounded-[18px] p-3 flex flex-col gap-2 ${d.isToday ? 'bg-[#2a1846] text-white' : 'bg-white shadow-[0_1px_0_#e9e3f1]'}`}
          >
            <div className="flex justify-between items-baseline">
              <b className="font-rubik font-semibold text-sm">{d.name}</b>
              <span className="text-[13px] opacity-75">{d.date}</span>
            </div>
            {evs
              .filter((s) => dayKey(s.start) === d.key)
              .map((s) => (
                <Link
                  key={s.lessonId}
                  href={s.href}
                  className={`block no-underline px-[9px] py-2 rounded-[11px] text-inherit hover:opacity-90 ${d.isToday ? 'bg-white/[.12]' : 'bg-[#f6f2fb]'}`}
                  style={{ borderInlineStart: `4px solid ${s.color}` }}
                >
                  <b className="block text-[13px]">{time(s.start)}</b>
                  <span className="text-[12.5px]">{s.title}</span>
                </Link>
              ))}
          </div>
        ))}
      </div>

      <section className="bg-white rounded-[22px] p-3 lg:p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col gap-2">
        <h2 className="m-0 mb-1.5 px-1 text-[#221a2e] font-rubik font-semibold text-lg">ברשימה</h2>
        {evs.map((s) => {
          const d = dayOf(s);
          const join = canJoin(s);
          return (
            <div key={s.lessonId} className="grid grid-cols-[54px_6px_1fr_auto] lg:grid-cols-[70px_6px_1fr_auto] gap-3 lg:gap-3.5 items-center p-3 rounded-[14px] bg-[#f6f2fb]">
              <span className="font-rubik font-semibold text-sm">
                {d.short} {d.date}
                {d.isToday && <span className="block text-[11.5px] font-normal text-[#a35f00]">היום</span>}
              </span>
              <span className="w-1.5 h-9 rounded-full" style={{ background: s.color }} />
              <Link href={s.href} className="min-w-0 no-underline text-[#221a2e]">
                <b className="block text-[15px]">{s.title}</b>
                <span className="text-[13px] text-[#73698a]">
                  {s.source}
                  {s.instructor ? ` · ${s.instructor}` : ''}
                </span>
              </Link>
              {join ? (
                <a
                  href={s.joinUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#5b3a8e] hover:bg-[#4a2f75] text-white no-underline font-semibold text-[13px] px-3 py-2 rounded-[10px] whitespace-nowrap"
                >
                  הצטרפות
                </a>
              ) : (
                <Link href={s.href} className="font-semibold text-[13.5px] text-[#5b3a8e] no-underline whitespace-nowrap">
                  {time(s.start)} ←
                </Link>
              )}
            </div>
          );
        })}
        {evs.length === 0 && <span className="text-[#73698a] text-sm p-2.5">{filter === 'all' ? 'אין מפגשים בשבוע הזה.' : 'אין מפגשים בסינון הזה.'}</span>}
      </section>
    </div>
  );
}
