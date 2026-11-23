'use client';

import { useAdminLanguage } from '@/context/AppContext';

/** A future membership price chosen while creating a product; scheduled once the product exists. */
export interface FuturePriceDraft {
  enabled: boolean;
  amount: string;
  date: string;
  appliesTo: 'new' | 'all' | null;
  noticeDays: number;
}

export const EMPTY_FUTURE_PRICE: FuturePriceDraft = { enabled: false, amount: '', date: '', appliesTo: null, noticeDays: 30 };

const NOTICE_OPTIONS = [14, 30, 45, 60];

/** The same checks the server makes (POST /api/admin/products/[id]/price-changes). Keys match the wizard's error keys. */
export function checkFuturePrice(draft: FuturePriceDraft, currentPrice: number, t: (k: string, f: string) => string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!draft.enabled) return e;
  const n = Number(draft.amount);
  if (!(n > 0)) e.future_amount = t('admin.priceChange.err.price', 'Write the new price (more than 0).');
  else if (n === currentPrice) e.future_amount = t('admin.priceChange.err.same', 'This is already the price.');
  if (!draft.appliesTo) e.future_applies = t('admin.priceChange.err.applies', 'Choose who the new price applies to.');
  const today = new Date().toISOString().slice(0, 10);
  if (!draft.date || draft.date <= today) e.future_date = t('admin.priceChange.err.date', 'Choose a date after today.');
  else if (draft.appliesTo === 'all' && draft.date < new Date(Date.now() + draft.noticeDays * 86400000).toISOString().slice(0, 10))
    e.future_date = t('admin.priceChange.err.notice', 'For current members the date must be at least {n} days away, so the email reaches them in time.').replace('{n}', String(draft.noticeDays));
  return e;
}

function AppliesPicture({ all }: { all: boolean }) {
  const bar = (on: boolean, i: number) => <i key={i} className={`w-3 rounded-t ${on ? 'h-7 bg-primary' : 'h-4 bg-muted-foreground/30'}`} />;
  return (
    <span className="flex h-10 items-end gap-1 rounded-lg border border-border bg-card px-2 pb-1" aria-hidden>
      {all ? [false, false, true, true, true].map(bar) : [false, false, false, true, true].map(bar)}
    </span>
  );
}

/**
 * On a new subscription product: an optional future price, e.g. a launch
 * price that rises on a date. Same choices as "Change price" in the drawer.
 */
export function FuturePriceFields({
  draft,
  onChange,
  currentPrice,
  currency,
  errors,
  clearError,
}: {
  draft: FuturePriceDraft;
  onChange: (next: FuturePriceDraft) => void;
  currentPrice: number;
  currency: string;
  errors: Record<string, string>;
  clearError: (key: string) => void;
}) {
  const { t, language } = useAdminLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${n}`;
    }
  };
  const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const set = (patch: Partial<FuturePriceDraft>) => onChange({ ...draft, ...patch });
  const err = (k: string) => (errors[k] ? <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errors[k]}</span> : null);
  const n = Number(draft.amount);

  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <label className="flex cursor-pointer items-center justify-between gap-4 bg-primary/[0.04] px-4 py-3">
        <span>
          <span className="block font-semibold">{t('admin.priceChange.futureTitle', 'Schedule a future price (optional)')}</span>
          <span className="block text-[13px] text-muted-foreground">
            {t('admin.priceChange.futureHint', 'For example, a launch price that goes up on a date. You can also do this later from the product.')}
          </span>
        </span>
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => {
            set({ enabled: e.target.checked });
            ['future_amount', 'future_date', 'future_applies'].forEach(clearError);
          }}
          className="h-5 w-5 accent-[hsl(var(--primary))]"
        />
      </label>

      {draft.enabled && (
        <div className="grid gap-4 border-t border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">
                {t('admin.priceChange.newPrice', 'New price')} <span className="text-red-600">*</span>
              </span>
              <input
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => {
                  set({ amount: e.target.value });
                  clearError('future_amount');
                }}
                dir="ltr"
                className={`h-11 rounded-lg border bg-card px-3 outline-none focus:border-primary ${errors.future_amount ? 'border-red-500' : 'border-border'}`}
              />
              {err('future_amount')}
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">
                {t('admin.priceChange.fromDate', 'From date')} <span className="text-red-600">*</span>
              </span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => {
                  set({ date: e.target.value });
                  clearError('future_date');
                }}
                className={`h-11 rounded-lg border bg-card px-3 outline-none focus:border-primary dark:[color-scheme:dark] ${errors.future_date ? 'border-red-500' : 'border-border'}`}
              />
              {err('future_date')}
            </label>
          </div>

          <div className="grid gap-1.5 text-sm">
            <span className="font-semibold">
              {t('admin.priceChange.whoFuture', 'Who pays the new price?')} <span className="text-red-600">*</span>
            </span>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {(['new', 'all'] as const).map((v) => {
                const on = draft.appliesTo === v;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      set({ appliesTo: v });
                      clearError('future_applies');
                      clearError('future_date');
                    }}
                    className={`grid gap-2 rounded-xl border p-3 text-start ${on ? 'border-2 border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <AppliesPicture all={v === 'all'} />
                    <b>{v === 'new' ? t('admin.priceChange.newOnly', 'New members only') : t('admin.priceChange.everyone', 'Everyone')}</b>
                    <span className="text-[12.5px] text-muted-foreground">
                      {v === 'new'
                        ? t('admin.priceChange.futureNewText', 'Whoever joins before the date keeps {price}. People who join from the date pay the new price.').replace('{price}', money(currentPrice))
                        : t('admin.priceChange.futureAllText', 'Everyone moves to the new price from their first renewal on or after the date. Members are emailed in advance.')}
                    </span>
                  </button>
                );
              })}
            </div>
            {err('future_applies')}
          </div>

          {draft.appliesTo === 'all' && (
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">{t('admin.priceChange.notice', 'Tell members in advance')}</span>
              <select
                value={draft.noticeDays}
                onChange={(e) => {
                  set({ noticeDays: Number(e.target.value) });
                  clearError('future_date');
                }}
                className="h-11 rounded-lg border border-border bg-card px-3 outline-none focus:border-primary dark:[color-scheme:dark]"
              >
                {NOTICE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {t('admin.priceChange.daysBefore', '{n} days before').replace('{n}', String(d))}
                  </option>
                ))}
              </select>
            </label>
          )}

          {n > 0 && draft.date && draft.appliesTo && (
            <p className="rounded-xl bg-primary/5 px-3.5 py-3 text-sm leading-relaxed">
              <b>{t('admin.priceChange.inShort', 'In short')}: </b>
              {t('admin.priceChange.futureSummary', 'Until {date} the price is {old}; from {date} it is {price}. Buyers see "{old} · from {date} {price}" before paying.')
                .replaceAll('{date}', longDate(draft.date))
                .replaceAll('{old}', money(currentPrice))
                .replaceAll('{price}', money(n))}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
