'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmbeddedWizard, EnrollInline } from './EnrollInline';

type Item = { id: string; title: string; url: string; canCancel?: boolean };
/** Added coaching sessions the team offered, waiting for the client's approval. */
export type Approval = { offerId: string; title: string; sub: string; href: string; sessions: number };

/**
 * "להשלמה": enrollments the team opened for the client that aren't finished,
 * and added coaching sessions waiting for approval. Each is the same amber
 * card; an enrollment opens the signup steps right under it, an approval is
 * answered on the card (nothing is charged on approval).
 */
export function ToComplete({ items, approvals = [], openId }: { items: Item[]; approvals?: Approval[]; openId?: string }) {
  const [open, setOpen] = useState<Record<string, string>>({});
  // The enrollment the client just came for (a product link, or logging in
  // from an enrollment) is shown first and scrolled into view, waiting for
  // the client to press its button.
  const target = openId && items.some((it) => it.id === openId) ? openId : null;
  const ordered = target ? [...items.filter((it) => it.id === target), ...items.filter((it) => it.id !== target)] : items;
  const targetBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target) return;
    targetBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Shown once: take ?open= off the address so a refresh doesn't bring it
    // back. Nothing starts by itself; the client presses the card's button.
    const url = new URL(window.location.href);
    if (url.searchParams.has('open')) {
      url.searchParams.delete('open');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
  }, [target]);
  if (!items.length && !approvals.length) return null;

  return (
    <section aria-label="להשלמה" className="flex flex-col gap-3 lg:gap-3.5">
      <div className="flex justify-between items-baseline gap-3">
        <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-[19px] lg:text-[22px]">להשלמה</h2>
        <span className="hidden lg:inline text-[#73698a] text-sm">
          {approvals.length && !items.length ? 'מחכה לאישור שלך' : 'הרשמות ואישורים שמחכים לך'}
        </span>
      </div>
      {approvals.map((a) => (
        <ApprovalCard key={a.offerId} a={a} />
      ))}
      {ordered.map((it) => (
        <div key={it.id} ref={it.id === target ? targetBox : undefined} className="flex flex-col gap-3 scroll-mt-24">
          {open[it.id] ? (
            <EmbeddedWizard src={open[it.id]} title={it.title} />
          ) : (
            <>
              <EnrollInline
                enrollmentUrl={it.url}
                accent="#5b3a8e"
                onStart={(wizardUrl) => setOpen((o) => ({ ...o, [it.id]: wizardUrl }))}
              />
              {it.canCancel && <CancelEnrollment id={it.id} />}
            </>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * "Not for me": a quiet link under the card, then an inline confirm with an
 * optional reason. The enrollment goes back to the school's team (nothing
 * is charged); only for an open enrollment with nothing paid.
 */
function CancelEnrollment({ id }: { id: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/user/enrollments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (res?.ok) return router.refresh();
    setError(
      data?.code === 'paid'
        ? 'כבר שולם משהו בהרשמה הזו, אז אי אפשר לבטל אותה מכאן. אפשר לפנות לצוות בית הספר.'
        : data?.code === 'not_open'
          ? 'ההרשמה הזו כבר לא פתוחה.'
          : 'משהו השתבש. נסו שוב.',
    );
  };

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="self-start -mt-1 px-1 text-[13px] text-[#73698a] underline-offset-2 hover:underline hover:text-[#4a4060]">
        ביטול ההרשמה
      </button>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#e9e3f1] bg-white px-4 py-3 flex flex-col gap-2.5">
      <b className="text-[14.5px] text-[#221a2e]">לבטל את ההרשמה?</b>
      <span className="text-sm text-[#73698a]">לא יחויב דבר. ההרשמה תעבור לצוות בית הספר, שיחזור אליך אם צריך.</span>
      <label className="flex flex-col gap-1 text-sm text-[#4a4060]">
        <span>אפשר לכתוב לנו למה (לא חובה)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          rows={2}
          className="rounded-xl border border-[#e0d8ec] px-3 py-2 text-sm text-[#221a2e] outline-none focus:border-[#5b3a8e]"
        />
      </label>
      {error && (
        <span className="text-sm text-[#b3392f]" role="status">
          {error}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={cancel} className="font-semibold text-sm px-4 py-2.5 rounded-xl border border-[#e7c3bf] bg-white text-[#b3392f] disabled:opacity-60">
          {busy ? 'מבטלים…' : 'כן, לבטל את ההרשמה'}
        </button>
        <button type="button" disabled={busy} onClick={() => { setAsking(false); setError(null); }} className="font-semibold text-sm px-4 py-2.5 rounded-xl border-0 bg-transparent text-[#5b3a8e]">
          לא, להשאיר
        </button>
      </div>
    </div>
  );
}

function ApprovalCard({ a }: { a: Approval }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState(false);
  const decide = async (approve: boolean) => {
    setBusy(approve ? 'yes' : 'no');
    setError(false);
    const res = await fetch(`/api/user/coaching/offers/${a.offerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    }).catch(() => null);
    setBusy(null);
    if (res?.ok) router.refresh();
    else setError(true);
  };
  return (
    <section className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <b className="block text-[15px] text-amber-950">{a.title}</b>
        <span className="text-sm text-amber-950/80">{a.sub}</span>
        <Link href={a.href} className="block mt-1 text-[13px] font-semibold no-underline text-[#5b3a8e] hover:text-[#3d2466]">
          לפרטי החבילה ←
        </Link>
        {error && (
          <span className="block text-sm text-[#b3392f]" role="status">
            משהו השתבש. נסו שוב.
          </span>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button type="button" disabled={!!busy} onClick={() => decide(true)} className="border-0 text-white font-semibold text-sm px-[18px] py-2.5 rounded-xl bg-[#5b3a8e] disabled:opacity-60">
          {busy === 'yes' ? 'שומרים…' : `אישור ${a.sessions} מפגשים`}
        </button>
        <button type="button" disabled={!!busy} onClick={() => decide(false)} className="font-semibold text-sm px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-amber-950 disabled:opacity-60">
          לא עכשיו
        </button>
      </div>
    </section>
  );
}
