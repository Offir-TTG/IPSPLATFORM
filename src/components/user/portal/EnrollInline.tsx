'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
export function EnrollInline({ enrollmentUrl, accent, onStart, autoContinue = false }: { enrollmentUrl: string | null; accent: string; onStart: (wizardUrl: string) => void; autoContinue?: boolean }) {
  const router = useRouter();
  const token = enrollmentUrl?.match(/\/enroll\/([^/?#]+)/)?.[1] ?? null;
  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'expired' | 'closed' | 'busy' | 'error'>(token ? 'loading' : 'expired');

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
    if (!token) return;
    setState('busy');
    const res = await fetch(`/api/enrollments/token/${token}/accept`, { method: 'POST' }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (res?.ok && data) {
      setState('ready');
      return onStart(data.wizard_url || `/enroll/wizard/${data.enrollment_id}?token=${token}`);
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
        <b className="block text-[15px] text-amber-950">נשאר להשלים את ההרשמה</b>
        {state === 'expired' ? (
          <span className="text-sm text-amber-950/80">הקישור להרשמה פג. אפשר לפנות לצוות בית הספר כדי לקבל קישור חדש.</span>
        ) : state === 'closed' ? (
          <span className="text-sm text-amber-950/80">ההרשמה הזו כבר לא פתוחה. אפשר לפנות לצוות בית הספר.</span>
        ) : state === 'loading' ? (
          <span className="text-sm text-amber-950/70">טוענים…</span>
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
 * The existing enrollment wizard (details, agreement, payment), shown under
 * the child's header instead of on its own page. The frame grows with each
 * step; when the wizard finishes it opens the child's page, which takes the
 * whole window again.
 */
export function EmbeddedWizard({ src }: { src: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);
  // While the wizard shows a dialog (signing), the frame covers the whole window.
  const [overlay, setOverlay] = useState(false);
  const overlayRef = useRef(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | null = null;
    // Same site, so the page inside can be measured directly. The content area
    // (not the whole document, which is never shorter than the frame) sets the
    // height; it is watched again on every step, since each step is a new page.
    const watch = () => {
      observer?.disconnect();
      const doc = el.contentDocument;
      const content = doc?.querySelector('main') ?? doc?.body;
      if (!content) return;
      const measure = () => {
        if (overlayRef.current) return;
        setHeight(Math.ceil(Math.max(content.getBoundingClientRect().height, content.scrollHeight)));
      };
      observer = new ResizeObserver(measure);
      observer.observe(content);
      measure();
    };
    el.addEventListener('load', watch);
    // Client-side step changes inside the wizard swap the content without a new load.
    const id = setInterval(watch, 1500);

    // The wizard tells us when its dialog opens and closes.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== el.contentWindow) return;
      if (e.data?.source !== 'ips-wizard' || typeof e.data.overlay !== 'boolean') return;
      overlayRef.current = e.data.overlay;
      setOverlay(e.data.overlay);
      document.documentElement.style.overflow = e.data.overlay ? 'hidden' : '';
      if (!e.data.overlay) watch();
    };
    window.addEventListener('message', onMessage);

    return () => {
      el.removeEventListener('load', watch);
      window.removeEventListener('message', onMessage);
      clearInterval(id);
      observer?.disconnect();
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <section className="rounded-[22px] bg-white shadow-[0_1px_0_#e9e3f1] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#efe9f6] text-sm">
        <b className="text-[#221a2e]">השלמת ההרשמה והתשלום</b>
      </div>
      {/* Keeps the card's place while the frame is lifted over the whole window. */}
      {overlay && <div style={{ height }} aria-hidden="true" />}
      <iframe
        ref={frame}
        src={src}
        title="השלמת ההרשמה והתשלום"
        className={overlay ? 'fixed inset-0 z-[80] w-screen h-[100dvh] border-0 bg-transparent' : 'block w-full border-0 bg-transparent'}
        style={overlay ? { colorScheme: 'normal' } : { height, colorScheme: 'normal' }}
        scrolling={overlay ? 'auto' : 'no'}
        allow="payment *"
      />
    </section>
  );
}
