'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmbeddedWizard, EnrollInline } from './EnrollInline';

type Item = { id: string; title: string; url: string };
/** Added coaching sessions the team offered, waiting for the client's approval. */
export type Approval = { offerId: string; title: string; sub: string; href: string; sessions: number };

/**
 * "להשלמה": enrollments the team opened for the client that aren't finished,
 * and added coaching sessions waiting for approval. Each is the same amber
 * card; an enrollment opens the signup steps right under it, an approval is
 * answered on the card (nothing is charged on approval).
 */
export function ToComplete({ items, approvals = [] }: { items: Item[]; approvals?: Approval[] }) {
  const [open, setOpen] = useState<Record<string, string>>({});
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
      {items.map((it) => (
        <div key={it.id} className="flex flex-col gap-3">
          {open[it.id] ? (
            <EmbeddedWizard src={open[it.id]} />
          ) : (
            <EnrollInline enrollmentUrl={it.url} accent="#5b3a8e" onStart={(wizardUrl) => setOpen((o) => ({ ...o, [it.id]: wizardUrl }))} />
          )}
        </div>
      ))}
    </section>
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
