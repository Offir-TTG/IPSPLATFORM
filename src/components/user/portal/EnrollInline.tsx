'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnrollmentWizard from '@/components/enroll/EnrollmentWizard';

type Invite = {
  product_name: string;
  total_amount: number;
  currency: string;
  has_multiple_plans?: boolean;
  payment_plan_data?: { plan_type?: string; installment_count?: number; installment_amount?: number } | null;
};

const money = (n: number, c: string) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: (c || 'USD').toUpperCase(), maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/**
 * The invitation step of enrollment, compact, under the child's header.
 * Uses the same enrollment endpoints as the invitation page; confirming
 * continues to the existing wizard (details, agreement, payment).
 */
export function EnrollInline({
  enrollmentUrl,
  productId,
  offer,
  price,
  upcomingLine,
  attachPlanId,
  accent,
  onStart,
  autoContinue = false,
}: {
  enrollmentUrl: string | null;
  /** No enrollment yet (joining a club): pressing the button starts one for this product. */
  productId?: string;
  offer?: Invite;
  /** A membership's price, shown large: "‏29.99 ‏$" + "לחודש". */
  price?: { amount: string; per: string } | null;
  /** A scheduled price change, as a chip beside the price. */
  upcomingLine?: string | null;
  /** The product's only plan, attached before the wizard opens (it would otherwise fall back to a one-time payment). */
  attachPlanId?: string | null;
  accent: string;
  onStart: (wizardUrl: string) => void;
  autoContinue?: boolean;
}) {
  const router = useRouter();
  const token = enrollmentUrl?.match(/\/enroll\/([^/?#]+)/)?.[1] ?? null;
  const starting = !token && !!productId;
  const [invite, setInvite] = useState<Invite | null>(starting ? offer ?? null : null);
  const [state, setState] = useState<'loading' | 'ready' | 'expired' | 'closed' | 'busy' | 'error'>(token ? 'loading' : starting ? 'ready' : 'expired');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/enrollments/token/${token}`)
      .then(async (r) => {
        if (!r.ok) return setState('expired');
        setInvite(await r.json());
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [token]);

  const accept = async () => {
    let t = token;
    if (!t && !productId) return;
    setState('busy');
    if (!t) {
      // The platform's self-enrollment: creates the enrollment (or resumes an unfinished one).
      const res = await fetch('/api/public/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (res?.status === 409) return router.refresh();
      t = data?.enrollment_token ?? null;
      if (!t) return setState('error');
    }
    if (attachPlanId) {
      // The wizard's own plan endpoint; 409 means a payment already started, so the plan stays.
      const r = await fetch(`/api/enrollments/token/${t}/select-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_plan_id: attachPlanId }),
      }).catch(() => null);
      if (!r || (!r.ok && r.status !== 409)) return setState('error');
    }
    const res = await fetch(`/api/enrollments/token/${t}/accept`, { method: 'POST' }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && data) {
      setState('ready');
      return onStart(data.wizard_url || `/enroll/wizard/${data.enrollment_id}?token=${t}`);
    }
    // Already enrolled (paid elsewhere, or in another tab): just show the page as it is now.
    if (res?.status === 409 && data?.already_enrolled) return router.refresh();
    // Cancelled, suspended or expired: only the team can reopen it.
    if (res?.status === 409 || res?.status === 410) return setState('closed');
    setState('error');
  };

  // Back from signing (?enroll=continue): go straight on to the next step.
  useEffect(() => {
    if (autoContinue && state === 'ready') accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoContinue, state === 'ready']);

  const plan = invite?.payment_plan_data;
  const planLine = plan?.installment_count && plan.installment_amount && invite
    ? `או ${plan.installment_count} תשלומים של ${money(plan.installment_amount, invite.currency)}`
    : invite?.has_multiple_plans
    ? 'אפשר לבחור תוכנית תשלומים'
    : null;

  return (
    <section className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <b className="block text-[15px] text-amber-950">{starting ? 'הצטרפות למועדון' : 'נשאר להשלים את ההרשמה'}</b>
        {state === 'expired' ? (
          <span className="text-sm text-amber-950/80">הקישור להרשמה פג. אפשר לפנות לצוות בית הספר כדי לקבל קישור חדש.</span>
        ) : state === 'closed' ? (
          <span className="text-sm text-amber-950/80">ההרשמה הזו כבר לא פתוחה. אפשר לפנות לצוות בית הספר.</span>
        ) : state === 'loading' ? (
          <span className="text-sm text-amber-950/70">טוענים…</span>
        ) : price ? (
          // A membership: the price, large, and any scheduled change beside it.
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="flex items-baseline gap-1.5">
              <span className="font-rubik font-bold text-[22px] leading-none text-amber-950">{price.amount}</span>
              <span className="text-[13px] text-amber-950/70">{price.per}</span>
            </span>
            {upcomingLine && (
              <span className="text-[12px] font-semibold text-[#5b3a8e] bg-white border border-[#e6dcf3] px-2.5 py-1 rounded-full">{upcomingLine}</span>
            )}
          </div>
        ) : (
          invite && (
            <span className="text-sm text-amber-950/80">
              {invite.product_name}
              {invite.total_amount > 0 && ` · ${money(invite.total_amount, invite.currency)}`}
              {planLine && ` · ${planLine}`}
            </span>
          )
        )}
        {state === 'error' && (
          <span className="block text-sm text-[#b3392f]" role="status">
            משהו השתבש. נסו שוב.
          </span>
        )}
      </div>
      {(state === 'ready' || state === 'busy' || state === 'error') && (
        <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
          <button type="button" disabled={state === 'busy'} onClick={accept} className="border-0 text-white font-semibold text-sm px-[18px] py-2.5 rounded-xl disabled:opacity-60" style={{ background: accent }}>
            {state === 'busy' ? 'ממשיכים…' : 'אישור והמשך לתשלום'}
          </button>
          <span className="text-[11.5px] text-amber-950/60">באישור מסכימים לתנאים ולהגבלות</span>
        </div>
      )}
    </section>
  );
}

/**
 * The existing enrollment wizard (details, agreement, payment), rendered
 * right here under the child's header as part of the page (no frame). The
 * agreement opens in a dialog over the page and payment opens in place; when
 * the wizard finishes it goes to the child's page.
 */
export function EmbeddedWizard({ src, title }: { src: string; title?: string }) {
  // src is the wizard link: /enroll/wizard/<enrollmentId>?token=<token>
  const url = new URL(src, 'https://local.invalid');
  const enrollmentId = url.pathname.split('/').filter(Boolean)[2] ?? '';
  const token = url.searchParams.get('token');

  if (title) {
    // "להשלמה" on the home page (approved mockup): one white card in the
    // portal's style, a small header (tag + product), the steps right inside.
    return (
      <section className="rounded-[20px] bg-white overflow-hidden shadow-[0_1px_0_#e9e3f1,0_6px_20px_rgba(91,58,142,0.06)]">
        <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 border-b border-[#e9e3f1] text-sm">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-950">להשלמה</span>
          <b className="text-[#221a2e]">{title}</b>
        </div>
        <EnrollmentWizard enrollmentId={enrollmentId} token={token} embedded />
      </section>
    );
  }

  return (
    <section className="rounded-[22px] bg-white shadow-[0_1px_0_#e9e3f1] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#efe9f6] text-sm">
        <b className="text-[#221a2e]">השלמת ההרשמה והתשלום</b>
      </div>
      <EnrollmentWizard enrollmentId={enrollmentId} token={token} embedded />
    </section>
  );
}
