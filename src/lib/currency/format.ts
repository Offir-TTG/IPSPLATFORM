/**
 * Locale-aware money formatter that honours the per-language currency
 * settings configured in /admin/config/languages (currency_code,
 * currency_symbol, currency_position).
 *
 * SAFE DEFAULTS — when no config is supplied (or fields are missing),
 * the output matches the pre-existing hard-coded behaviour
 * (`new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS' })`)
 * so any caller that gradually migrates keeps rendering money the same
 * way it does today.
 *
 * Two formatting paths:
 *   1. Admin supplied BOTH a symbol AND a position → we control symbol
 *      placement manually (Intl can't put "₪" after the number).
 *   2. Otherwise → fall back to Intl's standard `style: 'currency'`
 *      rendering by ISO code.
 */

export interface CurrencyConfig {
  /** ISO 4217 code — 'USD', 'ILS', 'EUR'… */
  code: string;
  /** Optional override symbol ('$', '₪'). When provided WITH position
   *  we render manually; otherwise Intl picks the canonical symbol. */
  symbol?: string | null;
  /** 'before' = "$12", 'after' = "12₪". Only honoured when symbol set. */
  position?: 'before' | 'after' | null;
  /** BCP-47 locale ('en-US', 'he-IL'). Drives digit grouping. */
  locale?: string;
}

/** Same shape as the hard-coded calls scattered across the codebase. */
export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'ILS',
  symbol: null,
  position: null,
  locale: 'en-US',
};

export function formatCurrency(
  amount: number,
  config?: Partial<CurrencyConfig>,
): string {
  const cfg: CurrencyConfig = { ...DEFAULT_CURRENCY, ...config };
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  // Path 1 — admin configured both symbol AND position. We bypass
  // Intl's currency style and place the symbol ourselves, because
  // `Intl.NumberFormat` can't render "12₪" or "12 NIS".
  if (cfg.symbol && cfg.position) {
    const number = new Intl.NumberFormat(cfg.locale ?? 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
    return cfg.position === 'before'
      ? `${cfg.symbol}${number}`
      : `${number}${cfg.symbol}`;
  }

  // Path 2 — fall back to Intl's currency style. This is the same
  // call the legacy hard-coded sites use, so output is unchanged
  // when no admin config is supplied.
  return new Intl.NumberFormat(cfg.locale ?? 'en-US', {
    style: 'currency',
    currency: cfg.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}
