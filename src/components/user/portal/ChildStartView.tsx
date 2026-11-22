'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ageLabel, type ChildView } from '@/lib/portal/familyTypes';
import { SpaceHero } from './SpaceHero';

/** A child's page before any coaching exists: the request, or its status. */
export function ChildStartView({ child }: { child: ChildView }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(!!child.pendingRequest);
  const [error, setError] = useState<string | null>(null);
  const c = child.color;

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/user/children/${child.id}/coaching-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim() || null }),
    }).catch(() => null);
    setBusy(false);
    // 409: a request is already open, which is what the parent wanted.
    if (!res?.ok && res?.status !== 409) return setError('הבקשה לא נשלחה. נסו שוב.');
    setSent(true);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <SpaceHero
        color={c}
        kicker="הילדים שלי"
        title={child.firstName}
        sub={ageLabel(child.age) || null}
        side={
          <span className="self-start lg:self-auto font-semibold text-[13px] bg-white text-[#2a1846] px-3.5 py-[7px] rounded-full whitespace-nowrap">
            {sent ? 'בקשה לאימון נשלחה' : 'עוד אין אימון פעיל'}
          </span>
        }
      />

      <section className="bg-white rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-3 max-w-[720px]">
        {sent ? (
          <>
            <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-lg">הבקשה התקבלה</h2>
            <p className="m-0 text-[#5f5675]">
              צוות בית הספר יחזור אליך לתיאום האימון של {child.firstName}. כשהאימון ייפתח, המפגשים, המטפלת והתשלומים יופיעו כאן.
            </p>
          </>
        ) : (
          <>
            <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-lg">אימון ל{child.firstName}</h2>
            <p className="m-0 text-[#5f5675]">שולחים בקשה, והצוות חוזר אליך להתאמת מטפלת, חבילת מפגשים ותשלום.</p>
            <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
              במה תרצו עזרה? (לא חובה)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="כמה מילים שיעזרו לצוות להתאים את האימון"
                className="min-h-11 rounded-xl border border-[#e3dcef] bg-[#f9f7fc] px-3 py-2.5 text-[15px] focus:outline-none focus:border-[#5b3a8e] focus:bg-white"
              />
            </label>
            <button type="button" disabled={busy} onClick={send} className="self-start border-0 text-white font-semibold text-sm px-[18px] py-3 rounded-xl disabled:opacity-60" style={{ background: c }}>
              {busy ? 'שולחים…' : 'שליחת בקשה לאימון'}
            </button>
            {error && (
              <span className="text-sm text-[#b3392f]" role="status">
                {error}
              </span>
            )}
          </>
        )}
        <Link href="/profile?tab=family" className="font-semibold text-sm no-underline" style={{ color: c }}>
          כל הילדים שלי ←
        </Link>
      </section>
    </div>
  );
}
