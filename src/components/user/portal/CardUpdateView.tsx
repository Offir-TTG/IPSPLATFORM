'use client';

/**
 * "Update card": where a payment reminder's button leads. Shows the payment
 * that didn't go through, the card form (the same secure Stripe form as the
 * billing page), and a button to charge it right away with the new card.
 * Once it's paid, the reminders stop by themselves.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentMethodsManager } from '@/components/user/PaymentMethodsManager';
import { useUserLanguage } from '@/context/AppContext';
import type { BillingDue } from '@/app/(user)/billing/billingData';
import { payScheduleNow } from './payNow';

const panel = 'bg-white rounded-[22px] p-[18px] lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-3';

type Card = { id: string; brand?: string; last4?: string; isDefault: boolean };

export function CardUpdateView({ due }: { due: BillingDue[] }) {
  const router = useRouter();
  const { t } = useUserLanguage();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [paying, setPaying] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, { ok: boolean; text: string }>>({});

  const loadCard = () =>
    fetch('/api/user/payment-methods')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list: Card[] = j?.paymentMethods ?? [];
        setCard(list.find((c) => c.isDefault) ?? list[0] ?? null);
      })
      .catch(() => setCard(null));

  useEffect(() => {
    loadCard();
  }, []);

  const pay = async (d: BillingDue) => {
    setPaying(d.scheduleId);
    try {
      const r = await payScheduleNow(d.scheduleId);
      setResult((x) => ({ ...x, [d.scheduleId]: r }));
      if (r.ok) setTimeout(() => router.refresh(), 2500);
    } finally {
      setPaying(null);
    }
  };

  const brand = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : '';

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div>
        <h1 className="m-0 font-rubik text-[26px] font-bold text-[#221a2e]">עדכון כרטיס</h1>
        <p className="mt-1 text-[#73698a]">הכרטיס השמור משמש לתשלומים הבאים.</p>
      </div>

      {due.length > 0 ? (
        due.map((d) => (
          <div key={d.scheduleId} className="rounded-2xl border border-[#f3d6a8] bg-[#fdf6ea] px-4 py-3.5 text-[15px] leading-relaxed text-[#5c3d00]">
            <strong>התשלום של {d.sum} לא עבר.</strong>
            <br />
            {d.what} · {d.when}
          </div>
        ))
      ) : (
        <div className="rounded-2xl bg-[#e1f4ea] px-4 py-3.5 text-[15px] text-[#1a5c3c]">אין כרגע תשלום שמחכה. אפשר לעדכן את הכרטיס לתשלומים הבאים.</div>
      )}

      <section className={panel} aria-label="הכרטיס">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 font-rubik text-[17px] font-semibold text-[#221a2e]">הכרטיס שלי</h2>
          <span className="text-[13px] text-[#73698a]" style={{ direction: 'ltr' }}>
            {card === undefined ? '…' : card ? `${brand} •••• ${card.last4}` : 'אין כרטיס שמור'}
          </span>
        </div>
        <div onClickCapture={() => setTimeout(loadCard, 1500)}>
          <PaymentMethodsManager t={t} />
        </div>
        <p className="m-0 text-[13px] text-[#73698a]">התשלום מאובטח. פרטי הכרטיס נשמרים רק אצל Stripe, לא אצלנו.</p>
      </section>

      {due.length > 0 && (
        <section className={panel} aria-label="חיוב עכשיו">
          <h2 className="m-0 font-rubik text-[17px] font-semibold text-[#221a2e]">חיוב עכשיו</h2>
          {due.map((d) => {
            const r = result[d.scheduleId];
            return (
              <div key={d.scheduleId} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => pay(d)}
                  disabled={!card || paying === d.scheduleId || !!r?.ok}
                  className="min-h-12 rounded-xl border-0 bg-[#5b3a8e] px-[22px] py-3 text-[15px] font-semibold text-white hover:bg-[#4a2f75] disabled:opacity-60"
                >
                  {paying === d.scheduleId ? 'מחייבים…' : `חיוב ${d.sum} בכרטיס השמור`}
                </button>
                {r && <p className={`m-0 text-sm ${r.ok ? 'text-[#1a7a50]' : 'text-[#a3261b]'}`}>{r.text}</p>}
              </div>
            );
          })}
          <p className="m-0 text-[13px] text-[#73698a]">אחרי שהחיוב עובר, התזכורות נעצרות והגישה ממשיכה כרגיל.</p>
        </section>
      )}

      <Link href="/billing" className="self-start text-sm font-semibold text-[#5b3a8e] underline-offset-2 hover:underline">
        לכל התשלומים והמנויים
      </Link>
    </div>
  );
}
