'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ageLabel, type ChildView } from '@/lib/portal/familyTypes';

const input = 'min-h-11 rounded-xl border border-[#e3dcef] bg-[#f9f7fc] px-3 text-[15px] text-[#221a2e] focus:outline-none focus:border-[#5b3a8e] focus:bg-white';
const mainBtn = 'border-0 bg-[#5b3a8e] hover:bg-[#4a2f75] disabled:opacity-60 text-white font-semibold text-sm px-[18px] py-2.5 rounded-[11px]';

/** The profile's "הילדים שלי": the children, adding one, and asking for coaching. */
export function FamilyTab({ kids }: { kids: ChildView[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(kids.length === 0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const addChild = async () => {
    if (!name.trim()) return setMissing(true);
    setMissing(false);
    setBusy(true);
    setError(null);
    const res = await fetch('/api/user/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: name.trim(), age: age ? Number(age) : null }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError('לא הצלחנו להוסיף. נסו שוב.');
    setName('');
    setAge('');
    setAdding(false);
    router.refresh();
  };

  const sendRequest = async (childId: string) => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/user/children/${childId}/coaching-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim() || null }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError('הבקשה לא נשלחה. נסו שוב.');
    setSent((s) => ({ ...s, [childId]: true }));
    setRequestFor(null);
    setNote('');
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <h1 className="m-0 text-[#221a2e] font-rubik font-bold text-[22px] lg:text-2xl">הילדים שלי</h1>
        <div className="text-[#73698a] mt-1 text-sm">האימון של כל ילד מופיע בבית שלך תחת ״הילדים שלי״, עם המפגשים והתשלומים.</div>
      </div>

      {kids.map((k) => {
        const c = k.coaching[0];
        const requested = sent[k.id] || !!k.pendingRequest;
        const line = [ageLabel(k.age), c ? [c.title, c.coach ? `עם ${c.coach.name}` : null].filter(Boolean).join(' ') : requested ? 'בקשה לאימון נשלחה' : 'עוד אין אימון פעיל']
          .filter(Boolean)
          .join(' · ');
        return (
          <div key={k.id} className="flex flex-col gap-3 p-3.5 rounded-2xl bg-[#f6f2fb]">
            <div className="grid grid-cols-[48px_1fr] sm:grid-cols-[48px_1fr_auto] gap-3 sm:gap-3.5 items-center">
              <span className="w-12 h-12 rounded-full text-white font-rubik font-bold text-lg grid place-items-center" style={{ background: k.color }} aria-hidden="true">
                {k.firstName.charAt(0)}
              </span>
              <span className="min-w-0">
                <b className="block text-[15.5px]">{k.firstName}</b>
                <span className="text-[#73698a] text-[13px]">{line}</span>
              </span>
              <span className="col-span-2 sm:col-span-1 flex gap-2 flex-wrap">
                <Link href={`/children/${k.id}`} className="font-semibold text-[13.5px] no-underline px-3 py-2 rounded-[10px] bg-white" style={{ color: k.color }}>
                  {c ? `לאימון של ${k.firstName}` : `לעמוד של ${k.firstName}`}
                </Link>
                {!requested && (
                  <button type="button" onClick={() => setRequestFor(requestFor === k.id ? null : k.id)} className="border border-[#e3dcef] bg-white font-semibold text-[13px] px-3 py-2 rounded-[10px]">
                    {c ? 'בקשה לחבילה נוספת' : 'בקשה לאימון'}
                  </button>
                )}
              </span>
            </div>
            {requestFor === k.id && (
              <div className="bg-white rounded-[14px] p-3.5 flex flex-col gap-2.5">
                <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
                  במה תרצו עזרה? (לא חובה)
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="כמה מילים שיעזרו לצוות להתאים את האימון" className={`${input} py-2.5`} />
                </label>
                <span className="text-[#73698a] text-[13px]">הבקשה מגיעה לצוות בית הספר, שיחזור אליך לתיאום.</span>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => sendRequest(k.id)} className={mainBtn}>
                    {busy ? 'שולחים…' : 'שליחת הבקשה'}
                  </button>
                  <button type="button" onClick={() => setRequestFor(null)} className="border-0 bg-transparent text-[#5b3a8e] font-semibold text-sm">
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="p-4 rounded-2xl border border-dashed border-[#cfc3e3] flex flex-col gap-3">
          <b className="font-rubik font-semibold text-base">הוספת ילד/ה</b>
          <div className="grid grid-cols-[1fr_110px] sm:grid-cols-[1fr_160px] gap-3">
            <label className="flex flex-col gap-1.5 text-[13.5px]">
              שם
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: איתי" className={`${input} ${missing ? 'border-[#b3392f]' : ''}`} aria-invalid={missing} />
              {missing && <span className="text-[#b3392f] text-[12.5px]">צריך למלא שם</span>}
            </label>
            <label className="flex flex-col gap-1.5 text-[13.5px]">
              גיל
              <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="9" className={input} />
            </label>
          </div>
          <span className="text-[#73698a] text-[13px]">הילדים לא צריכים כניסה משלהם. הכול מופיע בחשבון שלך.</span>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={addChild} className={mainBtn}>
              {busy ? 'מוסיפים…' : 'הוספה'}
            </button>
            {kids.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="border-0 bg-transparent text-[#5b3a8e] font-semibold text-sm">
                ביטול
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="self-start border border-dashed border-[#b9a8d6] bg-white text-[#5b3a8e] font-semibold text-sm px-[18px] py-3 rounded-xl">
          + הוספת ילד/ה
        </button>
      )}
      {error && (
        <span className="text-sm text-[#b3392f]" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
