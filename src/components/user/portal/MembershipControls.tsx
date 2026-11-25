'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MembershipView } from '@/lib/portal/membership';

type Action = 'stop' | 'resume' | 'switch_plan';

/**
 * Stop, resume and switch plan for one membership. Each option shows only
 * when the payment rules allow it (the can_* flags). Pausing for a month is
 * not offered; "resume" still cancels a pause that was set before.
 */
export function MembershipControls({ m, accent = '#5b3a8e' }: { m: MembershipView; accent?: string }) {
  const router = useRouter();
  const [confirmStop, setConfirmStop] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (action: Action, planId?: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/enrollments/${m.enrollmentId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, plan_id: planId }),
      });
      if (!res.ok) {
        setError(
          res.status === 503
            ? 'ניהול המנוי עוד לא פתוח. אפשר לפנות לצוות בית הספר ונטפל בזה מיד.'
            : res.status === 409
            ? 'אי אפשר לעשות את זה עכשיו. ייתכן שחיוב בעיבוד או שיש תשלום פתוח; נסו שוב בעוד כמה דקות.'
            : 'השינוי לא נשמר. נסו שוב.'
        );
        return;
      }
      setConfirmStop(false);
      router.refresh();
    } catch {
      setError('השינוי לא נשמר. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  const option = 'text-start border border-[#e3dcef] bg-white hover:bg-[#faf8fd] disabled:opacity-60 rounded-[14px] p-3.5';
  const primary = 'shrink-0 border-0 text-white font-semibold text-sm px-4 py-2.5 rounded-[11px] disabled:opacity-60';

  let body: React.ReactNode;
  if (m.canResume && m.note) {
    body = (
      <div className="flex flex-col gap-2.5 p-3.5 rounded-[14px] bg-[#f6f2fb]">
        <span className="text-[14.5px]">{m.note}</span>
        <button type="button" disabled={busy} onClick={() => change('resume')} className={`${primary} self-start`} style={{ background: accent }}>
          {m.status.startsWith('השהיה') ? 'ביטול ההשהיה' : 'חידוש המנוי'}
        </button>
      </div>
    );
  } else if (confirmStop) {
    body = (
      <div className="flex flex-col gap-2.5 p-3.5 rounded-[14px] bg-[#fbf3f2]">
        <b className="font-rubik font-semibold text-base">להפסיק את {m.title}?</b>
        <span className="text-sm text-[#5f5675]">
          המנוי יישאר פעיל{m.endsLabel ? ` עד ${m.endsLabel}` : ' עד סוף התקופה ששולמה'} ולא תחויבו יותר. ההקלטות והמדריכים פתוחים עד אז, ואפשר לחזור בכל רגע.
        </span>
        <div className="flex gap-2 flex-wrap">
          <button type="button" disabled={busy} onClick={() => change('stop')} className={`${primary} bg-[#b3392f]`}>
            אישור הפסקה
          </button>
          <button type="button" onClick={() => setConfirmStop(false)} className="border-0 bg-transparent font-semibold text-sm px-2.5" style={{ color: accent }}>
            השארת המנוי
          </button>
        </div>
      </div>
    );
  } else if (m.canStop || m.canSwitch) {
    body = (
      <div className="flex flex-col gap-2.5">
        {m.canSwitch &&
          m.switchTo.map((p) => (
            <button key={p.planId} type="button" disabled={busy} onClick={() => change('switch_plan', p.planId)} className={option}>
              <b className="block text-[15px]">{p.title}</b>
              <span className="text-[13px] text-[#73698a]">{p.sub}</span>
            </button>
          ))}
        {m.canStop && (
          <button type="button" onClick={() => setConfirmStop(true)} className={option}>
            <b className="block text-[15px]">הפסקת המנוי</b>
            <span className="text-[13px] text-[#73698a]">{m.endsLabel ? `פעיל עד ${m.endsLabel}, ואחר כך בלי חיובים` : 'פעיל עד סוף התקופה ששולמה'}</span>
          </button>
        )}
      </div>
    );
  } else {
    body = (
      <span className="text-sm text-[#5f5675]">
        {m.tone === 'off' ? 'המנוי הסתיים. אפשר להירשם שוב בכל רגע.' : 'יש תשלום פתוח במנוי. אחרי התשלום אפשר יהיה לנהל אותו כאן.'}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {body}
      {error && (
        <span className="text-sm text-[#b3392f]" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
