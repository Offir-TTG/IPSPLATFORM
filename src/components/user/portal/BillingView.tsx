'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { payScheduleNow } from './payNow';
import { PaymentMethodsManager } from '@/components/user/PaymentMethodsManager';
import { MembershipControls } from './MembershipControls';
import { useUserLanguage } from '@/context/AppContext';
import type { BillingData, BillingDue } from '@/app/(user)/billing/billingData';

const panel = 'bg-white rounded-[22px] p-[18px] lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold text-[17px] lg:text-[19px]';
const chip = {
  ok: 'bg-[#e1f4ea] text-[#1a7a50]',
  warn: 'bg-[#fbefd6] text-[#7a4f00]',
  off: 'bg-[#efeaf5] text-[#5f5675]',
  due: 'bg-[#f1ebf8] text-[#5b3a8e]',
};

type Card = { id: string; brand?: string; last4?: string; expMonth?: number; expYear?: number; isDefault: boolean };
/** One Stripe invoice, as /api/user/invoices returns it. */
type Invoice = {
  id: string;
  number: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  refund_amount: number;
  currency: string;
  created: number;
  paid_at: number | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  description: string;
};

const HISTORY_FIRST = 3;

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const dayLabel = (ms: number) =>
  new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ms)).replace(/\//g, '.');

/** "Club - Payment #2" → "Club · תשלום 2". */
const invoiceTitle = (d: string) => d.replace(/\s*-\s*Payment\s*#\s*(\d+)\s*$/i, ' · תשלום $1') || 'חשבונית';

/** The status chip: words and colour. */
function invoiceStatus(inv: Invoice): { text: string; tone: keyof typeof chip; payable: boolean } {
  switch (inv.status) {
    case 'paid':
      return { text: 'שולם', tone: 'ok', payable: false };
    case 'refunded':
      return { text: 'הוחזר', tone: 'off', payable: false };
    case 'partially_refunded':
      return { text: `הוחזר חלקית · ${money(inv.refund_amount, inv.currency)}`, tone: 'off', payable: false };
    case 'overdue':
    case 'uncollectible':
      return { text: 'באיחור', tone: 'warn', payable: true };
    default:
      return { text: 'ממתין לתשלום', tone: 'due', payable: true };
  }
}

/** Cancelled, draft and $0 invoices aren't payments, so they stay out of the list. */
const shownInvoice = (inv: Invoice) =>
  inv.status !== 'void' && inv.status !== 'draft' && (inv.amount_paid > 0 || inv.amount_due > 0);

export function BillingView({ data }: { data: BillingData }) {
  const router = useRouter();
  const { t } = useUserLanguage();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [cardOpen, setCardOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [openPlan, setOpenPlan] = useState<string | null>(null);
  // null while Stripe is being asked; 'error' when it couldn't be reached.
  const [invoices, setInvoices] = useState<Invoice[] | null | 'error'>(null);
  const [allInvoices, setAllInvoices] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<Record<string, { ok: boolean; text: string }>>({});

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
    // The history is the client's Stripe invoices, newest first.
    fetch('/api/user/invoices')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setInvoices(((j?.invoices as Invoice[]) ?? []).filter(shownInvoice)))
      .catch(() => setInvoices('error'));
  }, []);

  const pay = async (d: BillingDue) => {
    setPaying(d.scheduleId);
    const done = (ok: boolean, text: string) => setPayResult((r) => ({ ...r, [d.scheduleId]: { ok, text } }));
    try {
      // The bank may ask for confirmation (3-D Secure); payScheduleNow handles it.
      const r = await payScheduleNow(d.scheduleId);
      done(r.ok, r.text);
      if (r.ok) setTimeout(() => router.refresh(), 2500);
    } finally {
      setPaying(null);
    }
  };

  const brand = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : '';
  const nothing = !data.subs.length && !data.due.length && !data.history.length && !data.plans.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 text-[#221a2e] font-rubik font-bold text-[26px] lg:text-[30px]">תשלומים ומנויים</h1>
        <div className="text-[#73698a] mt-1">כל התשלומים, המנויים והקבלות שלך</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-3.5">
        <div className="bg-white rounded-[20px] p-[18px] shadow-[0_1px_0_#e9e3f1]">
          <div className="text-[#73698a] text-[13px]">לתשלום בחודש הקרוב</div>
          <div className="font-rubik font-bold text-[22px] lg:text-[28px] mt-1">{data.dueTotal}</div>
        </div>
        <div className="bg-white rounded-[20px] p-[18px] shadow-[0_1px_0_#e9e3f1]">
          <div className="text-[#73698a] text-[13px]">שולם השנה</div>
          <div className="font-rubik font-bold text-[22px] lg:text-[28px] mt-1">{data.paidTotal}</div>
        </div>
        <div className="col-span-2 lg:col-span-1 text-white rounded-[20px] p-[18px] flex flex-col gap-1.5" style={{ background: 'linear-gradient(135deg, #2b1a52, #5b3a8e)' }}>
          <div className="text-[13px] opacity-80">כרטיס לחיוב</div>
          <div className="font-rubik font-semibold text-[22px] tracking-[.08em]" style={{ direction: 'ltr', textAlign: 'right' }}>
            {card === undefined ? '…' : card ? `•••• ${card.last4}` : 'אין כרטיס שמור'}
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] opacity-80">
              {card ? `${brand}${card.expMonth ? ` · תוקף ${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}` : ''}` : 'הפרטים נשמרים רק אצל Stripe'}
            </span>
            <button
              type="button"
              onClick={() => setCardOpen((o) => !o)}
              aria-expanded={cardOpen}
              className="shrink-0 border-0 bg-white/[.16] hover:bg-white/25 text-white font-semibold text-[13px] px-3 py-[7px] rounded-[10px]"
            >
              {cardOpen ? 'סגירה' : card ? 'החלפת כרטיס' : 'הוספת כרטיס'}
            </button>
          </div>
        </div>
      </div>

      {cardOpen && (
        <section className={`${panel} gap-3`} aria-label="ניהול כרטיסים">
          <div className="flex justify-between items-baseline gap-3">
            <h2 className={h2}>הכרטיסים שלי</h2>
            <span className="text-[#73698a] text-[13px]">טופס מאובטח של Stripe. פרטי הכרטיס לא נשמרים אצלנו.</span>
          </div>
          <div onClickCapture={() => setTimeout(loadCard, 1500)}>
            <PaymentMethodsManager t={t} />
          </div>
        </section>
      )}

      {data.subs.length > 0 && (
        <section className={`${panel} gap-3`}>
          <div className="flex justify-between items-baseline gap-3">
            <h2 className={h2}>המנויים שלי</h2>
            <span className="hidden lg:inline text-[#73698a] text-[13px]">ההנחה של המנוי על קורסים מופיעה אוטומטית בקופה</span>
          </div>
          {data.subs.map((s) => {
            const open = openSub === s.enrollmentId;
            return (
              <div key={s.enrollmentId} className="rounded-2xl bg-[#f6f2fb] px-4 py-3.5 flex flex-col gap-3">
                <div className="grid grid-cols-[44px_1fr_auto] lg:grid-cols-[44px_1fr_auto_auto] gap-3 lg:gap-3.5 items-center">
                  <span
                    className="w-11 h-11 rounded-[14px]"
                    style={{ background: `radial-gradient(70% 90% at 90% 10%, rgba(255,255,255,.35), transparent 60%), ${s.color}` }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <b className="block text-[15.5px]">{s.title}</b>
                    <span className="text-[#73698a] text-[13px]">{s.line}</span>
                    {s.upcomingLine && <span className="block text-[#5b3a8e] text-[13px] font-medium">{s.upcomingLine}</span>}
                  </span>
                  <span className={`font-semibold text-xs px-2.5 py-[5px] rounded-full whitespace-nowrap ${chip[s.tone]}`}>{s.status}</span>
                  <button
                    type="button"
                    onClick={() => setOpenSub(open ? null : s.enrollmentId)}
                    aria-expanded={open}
                    className="col-span-3 lg:col-span-1 border border-[#e3dcef] bg-white text-[#221a2e] font-semibold text-[13.5px] px-3.5 py-[9px] rounded-[11px] hover:bg-[#faf8fd]"
                  >
                    {open ? 'סגירה' : 'ניהול המנוי'}
                  </button>
                </div>
                {open && (
                  <div className="bg-white rounded-[14px] p-3.5">
                    <MembershipControls m={s} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {(data.due.length > 0 || data.history.length > 0 || (Array.isArray(invoices) && invoices.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start lg:items-stretch">
          <section className={`${panel} gap-2.5`}>
            <h2 className={`${h2} mb-1`}>תשלומים קרובים</h2>
            {data.due.length === 0 && <span className="text-[#73698a] text-sm p-2">אין תשלומים קרובים.</span>}
            {data.due.map((d) => {
              const result = payResult[d.scheduleId];
              return (
                <div key={d.scheduleId} className="flex flex-col gap-1.5 p-3 rounded-[14px] bg-[#f6f2fb]">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
                    <span className="min-w-0">
                      <b className="block text-[14.5px]">{d.what}</b>
                      <span className={`text-[12.5px] ${d.overdue ? 'text-[#b3392f] font-semibold' : 'text-[#73698a]'}`}>{d.when}</span>
                    </span>
                    <b className="font-rubik font-semibold text-base">{d.sum}</b>
                    {result?.ok ? (
                      <span className="font-semibold text-xs bg-[#e1f4ea] text-[#1a7a50] px-2.5 py-[5px] rounded-full">שולם, תודה</span>
                    ) : d.state === 'pay' ? (
                      <button
                        type="button"
                        disabled={paying === d.scheduleId || !card}
                        onClick={() => pay(d)}
                        title={!card ? 'צריך קודם להוסיף כרטיס' : undefined}
                        className="border-0 bg-[#5b3a8e] hover:bg-[#4a2f75] disabled:opacity-60 text-white font-semibold text-[13px] px-3 py-2 rounded-[10px] whitespace-nowrap"
                      >
                        {paying === d.scheduleId ? 'מחייבים…' : 'תשלום עכשיו'}
                      </button>
                    ) : d.state === 'processing' ? (
                      <span className="text-xs text-[#7a4f00]">בעיבוד</span>
                    ) : (
                      <span className="text-xs text-[#73698a] whitespace-nowrap">חיוב אוטומטי</span>
                    )}
                  </div>
                  {result && <span className={`text-[12.5px] ${result.ok ? 'text-[#1a7a50]' : 'text-[#b3392f]'}`} role="status">{result.text}</span>}
                </div>
              );
            })}
          </section>

          <section className={`${panel} gap-1`}>
            <div className="flex justify-between items-baseline gap-3 mb-1.5">
              <h2 className={h2}>היסטוריה וקבלות</h2>
              {Array.isArray(invoices) && invoices.length > 0 && (
                <span className="text-[#73698a] text-[13px]">{invoices.length} חשבוניות</span>
              )}
            </div>

            {invoices === null &&
              [0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2 py-3 px-1 border-b border-[#efe9f6] last:border-b-0" aria-hidden>
                  <span className="block h-3.5 w-1/2 rounded bg-[#f1ebf8] animate-pulse" />
                  <span className="block h-3 w-1/3 rounded bg-[#f6f2fb] animate-pulse" />
                </div>
              ))}

            {invoices === 'error' && (
              <span className="text-[#73698a] text-sm p-2">לא הצלחנו לטעון את החשבוניות כרגע. אפשר לנסות שוב מאוחר יותר.</span>
            )}

            {Array.isArray(invoices) && invoices.length === 0 && <span className="text-[#73698a] text-sm p-2">עוד אין חשבוניות.</span>}

            {Array.isArray(invoices) &&
              (allInvoices ? invoices : invoices.slice(0, HISTORY_FIRST)).map((inv) => {
                const st = invoiceStatus(inv);
                const sum = money(st.payable ? inv.amount_due : inv.amount_paid, inv.currency);
                const link = 'no-underline text-[#5b3a8e] hover:text-[#3d2466]';
                return (
                  <div key={inv.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 py-3 px-1 border-b border-[#efe9f6] last:border-b-0">
                    <span className="min-w-0 flex flex-col gap-0.5">
                      <b className="text-[14.5px] font-semibold">{invoiceTitle(inv.description)}</b>
                      <span className="text-[#73698a] text-[12.5px]">
                        {dayLabel(inv.paid_at ?? inv.created)} · <span dir="ltr">{inv.number}</span>
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <b dir="ltr" className="font-rubik font-semibold text-[15px]">{sum}</b>
                      <span className={`font-semibold text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${chip[st.tone]}`}>{st.text}</span>
                    </span>
                    {(inv.hosted_invoice_url || inv.invoice_pdf) && (
                      <span className="col-span-full flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-semibold">
                        {st.payable && inv.hosted_invoice_url && (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="no-underline bg-[#5b3a8e] hover:bg-[#4a2f75] text-white px-3 py-1.5 rounded-[9px]">
                            לתשלום ↗
                          </a>
                        )}
                        {inv.hosted_invoice_url && (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className={link}>
                            צפייה בחשבונית ↗
                          </a>
                        )}
                        {inv.invoice_pdf && (
                          <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className={link}>
                            הורדת PDF ↓
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}

            {Array.isArray(invoices) && invoices.length > HISTORY_FIRST && (
              <button
                type="button"
                onClick={() => setAllInvoices((v) => !v)}
                aria-expanded={allInvoices}
                className="mt-2 self-center border border-[#e3dcef] bg-white hover:bg-[#faf8fd] font-semibold text-[13.5px] text-[#5b3a8e] px-[18px] py-[9px] rounded-[11px]"
              >
                {allInvoices ? 'הצגת פחות' : `הצגת עוד (${invoices.length - HISTORY_FIRST})`}
              </button>
            )}
          </section>
        </div>
      )}

      {data.plans.length > 0 && (
        <section className={`${panel} gap-3`}>
          <h2 className={h2}>תוכניות בתשלומים</h2>
          {data.plans.map((p) => {
            const open = openPlan === p.enrollmentId;
            return (
              <div key={p.enrollmentId} className="rounded-2xl bg-[#f6f2fb] px-4 py-3.5 flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <span className="min-w-0 flex flex-col gap-1.5">
                    <b className="text-[15.5px]">{p.title}</b>
                    <span className="block h-[5px] rounded-full bg-white overflow-hidden">
                      <span className="block h-full rounded-[inherit]" style={{ width: `${p.progress}%`, background: p.color }} />
                    </span>
                    <span className="text-[#73698a] text-[13px]">
                      {p.paidLabel} · {p.remainingLabel}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenPlan(open ? null : p.enrollmentId)}
                    aria-expanded={open}
                    className="border border-[#e3dcef] bg-white font-semibold text-[13.5px] px-3.5 py-[9px] rounded-[11px] hover:bg-[#faf8fd]"
                  >
                    {open ? 'סגירה' : 'לוח התשלומים'}
                  </button>
                </div>
                {open && (
                  <div className="bg-white rounded-[14px] p-2 flex flex-col">
                    {p.rows.map((r) => (
                      <div key={r.key} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-2 py-2 border-b border-[#efe9f6] last:border-b-0 text-sm">
                        <span className="min-w-0">
                          <b className="font-semibold">{r.label}</b>
                          <span className="block text-[12.5px] text-[#73698a]">{r.date}</span>
                        </span>
                        <span className="font-semibold">{r.sum}</span>
                        <span className={`font-semibold text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${chip[r.tone]}`}>{r.status}</span>
                      </div>
                    ))}
                    <PdfExport enrollmentId={p.enrollmentId} />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {nothing && (
        <section className={`${panel} items-center text-center p-8`}>
          <h2 className={h2}>אין כאן תשלומים עדיין</h2>
          <p className="mt-2 mb-0 text-[#73698a]">כשתירשמו לתוכנית, מועדון או קורס בתשלום, החיובים והקבלות יופיעו כאן.</p>
        </section>
      )}
    </div>
  );
}

/** "הורדת PDF" for one enrollment: invoice, payment schedule or both, in Hebrew or English (the existing export). */
function PdfExport({ enrollmentId }: { enrollmentId: string }) {
  const [doc, setDoc] = useState<'invoice' | 'schedule' | 'both'>('both');
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const download = async () => {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/user/enrollments/${enrollmentId}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: doc, language: lang }),
      });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc === 'invoice' ? 'invoice' : doc === 'schedule' ? 'payment-schedule' : 'combined'}-${enrollmentId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const select = 'min-h-9 rounded-[10px] border border-[#e3dcef] bg-[#f9f7fc] px-2 text-[13px]';
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 pt-3 pb-1 text-[13px]">
      <label className="flex items-center gap-1.5">
        מסמך
        <select value={doc} onChange={(e) => setDoc(e.target.value as typeof doc)} className={select}>
          <option value="both">חשבונית ולוח תשלומים</option>
          <option value="invoice">חשבונית</option>
          <option value="schedule">לוח תשלומים</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5">
        שפה
        <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className={select}>
          <option value="he">עברית</option>
          <option value="en">English</option>
        </select>
      </label>
      <button type="button" disabled={busy} onClick={download} className="border border-[#e3dcef] bg-white hover:bg-[#faf8fd] disabled:opacity-60 font-semibold px-3 py-2 rounded-[10px] text-[#5b3a8e]">
        {busy ? 'מכינים…' : 'הורדת PDF'}
      </button>
      {error && (
        <span className="text-[#b3392f]" role="status">
          ההורדה נכשלה. נסו שוב.
        </span>
      )}
    </div>
  );
}
