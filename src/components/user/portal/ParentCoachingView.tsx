'use client';

/**
 * The client's own coaching (approved mockup "4 · ליווי הורי"): a hero with
 * the sessions ring and four tabs. Overview: the package, the coach, the
 * latest sessions. Sessions: those held. Package and payment: each session's
 * charge, the saved card, the contract, added sessions to approve, and asking
 * for more. Intake: the form the team set. Hebrew only.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ParentCoachingView as Pack } from '@/lib/portal/parentCoaching';
import { SpaceHero, SpaceTab } from './SpaceHero';
import { IntakeForm } from './IntakeForm';

export type Tab = 'overview' | 'sessions' | 'package' | 'intake';
const COLOR = 'linear-gradient(135deg, #8a5cc7, #4f3a9c)';
const ACCENT = '#5b3a8e';
const panel = 'bg-white rounded-[22px] p-4 lg:p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold text-[19px]';
const btn = 'inline-flex items-center justify-center min-h-[46px] px-4 rounded-[14px] font-bold no-underline';
const STATE: Record<Pack['payments'][number]['state'], [string, string]> = {
  paid: ['נגבה', 'text-[#1f8a5b]'],
  failed: ['החיוב נכשל', 'text-[#b3392f]'],
  processing: ['בתהליך', 'text-[#73698a]'],
  gift: ['ללא חיוב', 'text-[#73698a]'],
};

export function ParentCoachingView({ pack, initialTab = 'overview' }: { pack: Pack; initialTab?: Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const left = Math.max(0, pack.total - pack.used);
  const pct = pack.total ? Math.round((pack.used / pack.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <SpaceHero
        color={COLOR}
        kicker={['ליווי הורי', pack.total ? `חבילת ${pack.total} מפגשים` : null].filter(Boolean).join(' · ')}
        title="הליווי שלי"
        sub={pack.coach ? `עם ${pack.coach.name}` : null}
        side={
          pack.total ? (
            <div className="flex lg:flex-col items-center gap-2.5 lg:gap-1.5">
              <span className="w-[84px] h-[84px] lg:w-[104px] lg:h-[104px] rounded-full grid place-items-center" style={{ background: `conic-gradient(#fff 0 ${pct}%, rgba(255,255,255,.22) ${pct}% 100%)` }}>
                <span className="w-[68px] h-[68px] lg:w-[84px] lg:h-[84px] rounded-full bg-[#6a49b0] grid place-items-center font-rubik text-xl lg:text-2xl">
                  {pack.used}/{pack.total}
                </span>
              </span>
              <span className="text-[13px] font-semibold bg-white text-[#2a1846] px-3 py-1.5 rounded-full whitespace-nowrap">
                {left === 0 ? 'כל המפגשים נוצלו' : left === 1 ? 'נשאר מפגש אחד' : `נשארו ${left} מפגשים`}
              </span>
            </div>
          ) : null
        }
        tabs={
          <>
            <SpaceTab on={tab === 'overview'} onClick={() => setTab('overview')}>סקירה</SpaceTab>
            <SpaceTab on={tab === 'sessions'} onClick={() => setTab('sessions')}>מפגשים</SpaceTab>
            <SpaceTab on={tab === 'package'} onClick={() => setTab('package')}>חבילה ותשלום</SpaceTab>
            {pack.intakeStatus !== 'not_needed' && (
              <SpaceTab on={tab === 'intake'} onClick={() => setTab('intake')}>
                שאלון פתיחה
              </SpaceTab>
            )}
          </>
        }
      />

      {tab === 'overview' && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <section className={`${panel} gap-3`}>
              <h2 className={h2}>החבילה שלך</h2>
              <div className="grid grid-cols-3 gap-2.5">
                <Stat label="התקיימו" value={String(pack.used)} />
                <Stat label="נשארו" value={String(left)} />
                <Stat label="נגבה עד עכשיו" value={pack.free ? 'ללא תשלום' : pack.chargedTotal} extra={pack.free ? undefined : `· ${pack.pricePerSession} למפגש`} small />
              </div>
              {!pack.ended && <MoreSessions pack={pack} />}
            </section>
            {pack.coach ? (
              <section className={`${panel} flex-row gap-3.5 items-center`}>
                {pack.coach.avatarUrl ? (
                  <img src={pack.coach.avatarUrl} alt="" className="w-[60px] h-[60px] rounded-full object-cover shrink-0" />
                ) : (
                  <span className="w-[60px] h-[60px] rounded-full bg-[#6b4bb5] text-white grid place-items-center font-rubik text-lg shrink-0" aria-hidden>
                    {initials(pack.coach.name)}
                  </span>
                )}
                <span className="flex flex-col gap-1 min-w-0">
                  <b className="font-rubik font-semibold text-lg">{pack.coach.name}</b>
                  {pack.coach.bio && <span className="text-[#73698a] text-sm line-clamp-3">{pack.coach.bio}</span>}
                </span>
              </section>
            ) : (
              <section className={`${panel} flex-row gap-3.5 items-center`}>
                <span className="w-[60px] h-[60px] rounded-full bg-[#efe9f8] text-[#6b4bb5] grid place-items-center font-rubik text-lg shrink-0" aria-hidden>?</span>
                <span className="flex flex-col gap-1 min-w-0">
                  <b className="font-rubik font-semibold text-lg">המאמן/ת שלך</b>
                  <span className="text-[#73698a] text-sm">הצוות ישבץ מאמן/ת ויעדכן אותך כאן.</span>
                </span>
              </section>
            )}
          </div>
          <section className={`${panel} gap-2`}>
            <h2 className={h2}>המפגשים האחרונים</h2>
            <SessionList sessions={pack.sessions.slice(0, 3)} />
            <span className="text-[#73698a] text-[13px]">את מועדי המפגשים קובעים ישירות עם המאמן/ת.</span>
          </section>
        </>
      )}

      {tab === 'sessions' && (
        <section className={`${panel} gap-2`}>
          <h2 className={h2}>מפגשים שהתקיימו</h2>
          <SessionList sessions={pack.sessions} />
          <span className="text-[#73698a] text-[13px]">את מועדי המפגשים קובעים ישירות עם המאמן/ת. כל מפגש מופיע כאן אחרי שהתקיים.</span>
        </section>
      )}

      {tab === 'package' && pack.offer && <OfferCard pack={pack} onDone={() => router.refresh()} />}

      {tab === 'package' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className={`${panel} gap-1.5`}>
            <h2 className={`${h2} mb-0.5`}>תשלומים</h2>
            <span className="text-[#73698a] text-sm mb-1">
              {pack.free ? 'החבילה ללא תשלום.' : `${pack.pricePerSession} לכל מפגש${pack.card ? `, נגבה מ-${pack.card}` : ''} אחרי שהמפגש התקיים.`}
            </span>
            {pack.payments.length === 0 ? (
              <span className="py-2.5 border-t border-[#efe9f6] text-[#73698a]">עוד לא התקיימו מפגשים, ולכן לא נגבה כלום.</span>
            ) : (
              pack.payments.map((p) => (
                <div key={p.id} className="flex justify-between py-2.5 border-t border-[#efe9f6]">
                  <span>{p.label}</span>
                  <span>
                    {p.amount && <b>{p.amount}</b>} <span className={`font-bold ${STATE[p.state][1]}`}>{STATE[p.state][0]}</span>
                  </span>
                </div>
              ))
            )}
            {!pack.free && (
              <div className="flex justify-between py-2.5 border-t border-[#efe9f6] text-[#73698a]">
                <span>סה״כ עד עכשיו</span>
                <b className="text-[#221a2e]">{pack.chargedTotal}</b>
              </div>
            )}
          </section>
          <div className="flex flex-col gap-4">
            {pack.contractSigned && (
              <section className={`${panel} gap-2`}>
                <h2 className={h2}>ההסכם</h2>
                <span className="text-[#5f5675] text-[14.5px]">הסכם {pack.title} · נחתם</span>
                {pack.hasContract && (
                  <a href={`/api/user/coaching/${pack.id}/contract`} target="_blank" rel="noreferrer" className="font-semibold text-sm no-underline text-[#5b3a8e] hover:text-[#3d2466]">
                    להורדת ההסכם החתום ←
                  </a>
                )}
              </section>
            )}
            {!pack.ended && (
              <section className={`${panel} gap-2.5`}>
                <h2 className={h2}>רוצים עוד מפגשים?</h2>
                <span className="text-[#5f5675] text-[14.5px]">שלחו בקשה, והצוות יחזור עם הצעה לאישור כאן.</span>
                <MoreSessions pack={pack} compact />
              </section>
            )}
          </div>
        </div>
      )}

      {tab === 'intake' && pack.intakeStatus !== 'not_needed' && (
        <section className={panel}>
          <IntakeForm enrollmentId={pack.id} childName="" accent={ACCENT} forParent />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, extra, small }: { label: string; value: string; extra?: string; small?: boolean }) {
  return (
    <div className="bg-[#f7f4fb] rounded-[14px] p-3 min-w-0">
      <div className="text-[#73698a] text-[13px]">{label}</div>
      <b className={small ? 'text-base' : 'text-[22px]'}>{value}</b>
      {extra && <span className="text-[#73698a] text-[12.5px]"> {extra}</span>}
    </div>
  );
}

function SessionList({ sessions }: { sessions: Pack['sessions'] }) {
  if (!sessions.length) return <p className="m-0 py-2.5 border-t border-[#efe9f6] text-[#73698a]">עוד לא התקיימו מפגשים.</p>;
  return (
    <>
      {sessions.map((s) => (
        <div key={s.id} className="flex justify-between py-2.5 border-t border-[#efe9f6]">
          <span>
            מפגש {s.number}
            {s.status === 'no_show' ? ' · לא התקיים' : s.status === 'late_cancelled' ? ' · בוטל (נספר)' : ''}
          </span>
          <span className="text-[#73698a]">{s.date}</span>
        </div>
      ))}
    </>
  );
}

/** Added sessions waiting for the client's approval (mockup "9"). Nothing is charged on approval. */
function OfferCard({ pack, onDone }: { pack: Pack; onDone: () => void }) {
  const o = pack.offer!;
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const decide = async (approve: boolean) => {
    setBusy(approve ? 'yes' : 'no');
    setError(null);
    const res = await fetch(`/api/user/coaching/offers/${o.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approve }) }).catch(() => null);
    setBusy(null);
    if (res?.ok) return onDone();
    setError('לא הצלחנו לשמור. נסו שוב.');
  };
  return (
    <section className="bg-white rounded-[22px] shadow-[0_1px_0_#e9e3f1] border border-[#e6dcf3] p-4 lg:p-5 flex flex-wrap items-center gap-3.5">
      <span className="flex-[1_1_360px]">
        <b className="block font-rubik font-semibold text-lg">הוצעו לך {o.sessions} מפגשים נוספים</b>
        {o.message && <span className="text-[#5f5675] text-[14.5px]">&quot;{o.message}&quot;{pack.coach ? ` · ${pack.coach.name}` : ''}</span>}
        <span className="block text-[#73698a] text-[13.5px] mt-1">
          {o.from} ← {o.to} מפגשים · {o.price} למפגש, רק כשהוא מתקיים · לא נגבה כלום עכשיו · בלי לחתום שוב
        </span>
        {error && <span className="block text-[#b3392f] text-sm mt-1">{error}</span>}
      </span>
      <span className="flex gap-2">
        <button type="button" disabled={!!busy} onClick={() => decide(true)} className={`${btn} bg-[#5b3a8e] text-white disabled:opacity-60`}>
          {busy === 'yes' ? 'שומרים…' : `אישור ${o.sessions} מפגשים`}
        </button>
        <button type="button" disabled={!!busy} onClick={() => decide(false)} className={`${btn} border border-[#e3dcef] bg-white text-[#221a2e] font-semibold disabled:opacity-60`}>
          לא עכשיו
        </button>
      </span>
    </section>
  );
}

/** Asking the team for more sessions (it reaches their coaching requests). */
function MoreSessions({ pack, compact = false }: { pack: Pack; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState('4');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    setState('busy');
    setError(null);
    const res = await fetch(`/api/user/coaching/${pack.id}/more-sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: count, note }) }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    if (res?.ok) return setState('sent');
    setState('idle');
    setError(j?.error || 'הבקשה לא נשלחה. נסו שוב.');
  };
  if (state === 'sent') return <p className="m-0 text-[#1f8a5b] font-semibold">הבקשה נשלחה. הצוות יחזור אליך עם הצעה לאישור כאן.</p>;
  if (!open)
    return compact ? (
      <button type="button" onClick={() => setOpen(true)} className={`${btn} self-start border border-[#e3dcef] text-[#5b3a8e]`}>בקשת מפגשים נוספים</button>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#faf7ff] border border-[#e6dcf3] rounded-2xl p-3.5">
        <span>
          <b className="block">{pack.total - pack.used <= 0 ? 'כל המפגשים בחבילה נוצלו' : pack.total - pack.used === 1 ? 'נשאר מפגש אחד בחבילה' : `נשארו ${pack.total - pack.used} מפגשים בחבילה`}</b>
          <span className="text-[#73698a] text-sm">רוצה להמשיך? אפשר לבקש עוד מפגשים, בלי חוזה חדש.</span>
        </span>
        <button type="button" onClick={() => setOpen(true)} className={`${btn} bg-[#5b3a8e] text-white`}>בקשת מפגשים נוספים</button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2.5 bg-[#faf7ff] border border-[#e6dcf3] rounded-2xl p-3.5">
      <label className="flex items-center gap-2">
        <span className="font-semibold">כמה מפגשים?</span>
        <input type="number" min={1} max={100} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="w-20 min-h-11 rounded-xl border border-[#e3dcef] bg-white px-3" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">הודעה לצוות <span className="font-normal text-[#73698a]">(לא חובה)</span></span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl border border-[#e3dcef] bg-white px-3 py-2" />
      </label>
      {error && <span className="text-[#b3392f] text-sm">{error}</span>}
      <span className="flex gap-2">
        <button type="button" disabled={state === 'busy'} onClick={send} className={`${btn} bg-[#5b3a8e] text-white disabled:opacity-60`}>{state === 'busy' ? 'שולחים…' : 'שליחת הבקשה'}</button>
        <button type="button" onClick={() => setOpen(false)} className={`${btn} border border-[#e3dcef] bg-white text-[#221a2e] font-semibold`}>ביטול</button>
      </span>
    </div>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return p.length > 1 ? `${p[0][0]}״${p[p.length - 1][0]}` : p[0]?.[0] ?? '';
}
