'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CoachingSessionView } from '@/lib/portal/familyTypes';
import { portalBar, portalSeg, portalSegStyle } from './joined';

const TZ = 'Asia/Jerusalem';
const dayKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
const dayLabel = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'numeric' }).format(new Date(iso));
const time = (iso: string) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

/**
 * The coach's free times, by day. Booking a new session, or moving one
 * (sessionId set). The rules (24 hours ahead, no double booking) are checked
 * on the server; if a slot was just taken, the list refreshes.
 */
export function SlotPicker({ enrollmentId, sessionId, accent, onDone, onCancel }: { enrollmentId: string; sessionId?: string; accent: string; onDone: () => void; onCancel: () => void }) {
  const router = useRouter();
  const [slots, setSlots] = useState<{ starts_at: string }[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 21 * 86400000).toISOString();
    fetch(`/api/user/coaching/${enrollmentId}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(r.status === 409 ? 'עוד לא שובצה מטפלת. הצוות יעדכן בקרוב.' : 'לא הצלחנו לטעון מועדים. נסו שוב.');
          setSlots([]);
          return;
        }
        const list: { starts_at: string }[] = j.slots ?? [];
        setSlots(list);
        setDay((d) => (d && list.some((s) => dayKey(s.starts_at) === d) ? d : list[0] ? dayKey(list[0].starts_at) : null));
      })
      .catch(() => {
        setError('לא הצלחנו לטעון מועדים. נסו שוב.');
        setSlots([]);
      });
  }, [enrollmentId, reload]);

  const pick = async (startsAt: string) => {
    setBusy(startsAt);
    setError(null);
    const res = await fetch(sessionId ? `/api/user/coaching-sessions/${sessionId}` : `/api/user/coaching/${enrollmentId}/sessions`, {
      method: sessionId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starts_at: startsAt }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError(res?.status === 409 ? 'המועד הזה כבר לא פנוי, או שכבר אי אפשר לשנות. בחרו מועד אחר.' : 'לא הצלחנו לקבוע. נסו שוב.');
      setReload((n) => n + 1);
      return;
    }
    router.refresh();
    onDone();
  };

  const days = [...new Set((slots ?? []).map((s) => dayKey(s.starts_at)))];
  const ofDay = (slots ?? []).filter((s) => dayKey(s.starts_at) === day);

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-[14px] bg-white">
      <span className="text-[13.5px] text-[#5f5675]">{sessionId ? 'מועדים פנויים להעברת המפגש:' : 'מועדים פנויים:'}</span>
      {slots === null && <span className="text-sm text-[#73698a]">טוענים מועדים…</span>}
      {slots && slots.length === 0 && !error && <span className="text-sm text-[#73698a]">אין מועדים פנויים בשלושת השבועות הקרובים.</span>}
      {days.length > 0 && (
        <div className="overflow-x-auto pb-0.5">
          <div className={portalBar} role="group" aria-label="יום">
            {days.map((d) => {
              const first = (slots ?? []).find((s) => dayKey(s.starts_at) === d)!;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === d}
                  onClick={() => setDay(d)}
                  className={`${portalSeg(day === d)} px-3 py-1.5 text-[13px]`}
                  style={portalSegStyle(day === d, accent)}
                >
                  {dayLabel(first.starts_at)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {ofDay.length > 0 && (
        <div className="flex gap-2 flex-wrap" role="group" aria-label="שעה">
          {ofDay.map((s) => (
            <button
              key={s.starts_at}
              type="button"
              disabled={!!busy}
              onClick={() => pick(s.starts_at)}
              className="border border-[#ddd2ea] bg-white hover:bg-[#faf8fd] disabled:opacity-60 font-semibold text-[13.5px] px-3.5 py-2 rounded-[11px]"
            >
              {busy === s.starts_at ? 'קובעים…' : time(s.starts_at)}
            </button>
          ))}
        </div>
      )}
      <span className="text-[12.5px] text-[#8a809a]">שינוי או ביטול עד 24 שעות לפני המפגש לא מוריד מפגש מהחבילה.</span>
      {error && (
        <span className="text-sm text-[#b3392f]" role="status">
          {error}
        </span>
      )}
      <button type="button" onClick={onCancel} className="self-start border-0 bg-transparent p-0 font-semibold text-sm" style={{ color: accent }}>
        סגירה
      </button>
    </div>
  );
}

/** "שינוי מועד" and "ביטול" for one upcoming session. */
export function SessionActions({ enrollmentId, session, accent }: { enrollmentId: string; session: CoachingSessionView; accent: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'move' | 'late'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (confirmLate: boolean) => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/user/coaching-sessions/${session.id}${confirmLate ? '?confirm_late=1' : ''}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMode('idle');
      router.refresh();
      return;
    }
    const j = await res?.json().catch(() => ({}));
    if (res?.status === 409 && j?.needs_confirmation) return setMode('late');
    setError('לא הצלחנו לבטל. נסו שוב.');
  };

  if (session.status !== 'upcoming') return null;
  return (
    <div className="flex flex-col gap-2.5">
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2.5">
          {session.canChange && (
            <button type="button" onClick={() => setMode('move')} className="border-0 text-white font-semibold text-sm px-[18px] py-3 rounded-xl" style={{ background: accent }}>
              שינוי מועד
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => cancel(false)} className="border border-[#e3dcef] bg-white font-semibold text-sm px-[18px] py-[11px] rounded-xl disabled:opacity-60">
            ביטול המפגש
          </button>
        </div>
      )}
      {mode === 'move' && <SlotPicker enrollmentId={enrollmentId} sessionId={session.id} accent={accent} onDone={() => setMode('idle')} onCancel={() => setMode('idle')} />}
      {mode === 'late' && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[14px] bg-[#fbf3f2]">
          <b className="font-rubik font-semibold">פחות מ-24 שעות לפני המפגש</b>
          <span className="text-sm text-[#5f5675]">ביטול עכשיו נספר כמפגש שנוצל מהחבילה. לבטל בכל זאת?</span>
          <div className="flex gap-2 flex-wrap">
            <button type="button" disabled={busy} onClick={() => cancel(true)} className="border-0 bg-[#b3392f] text-white font-semibold text-sm px-4 py-2.5 rounded-[11px] disabled:opacity-60">
              ביטול, ולספור כמנוצל
            </button>
            <button type="button" onClick={() => setMode('idle')} className="border-0 bg-transparent font-semibold text-sm px-2.5" style={{ color: accent }}>
              להשאיר את המפגש
            </button>
          </div>
        </div>
      )}
      {error && (
        <span className="text-sm text-[#b3392f]" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
