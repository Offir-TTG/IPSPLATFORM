// Currency utilities

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_digits: number;
  is_active: boolean;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimal_digits: 2, is_active: true },
  { code: 'EUR', name: 'Euro', symbol: '€', decimal_digits: 2, is_active: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimal_digits: 2, is_active: true },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimal_digits: 2, is_active: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimal_digits: 0, is_active: true },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimal_digits: 2, is_active: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimal_digits: 2, is_active: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimal_digits: 2, is_active: true },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimal_digits: 2, is_active: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimal_digits: 2, is_active: true },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimal_digits: 2, is_active: true },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimal_digits: 2, is_active: true },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimal_digits: 0, is_active: true },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimal_digits: 2, is_active: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimal_digits: 2, is_active: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimal_digits: 2, is_active: true },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimal_digits: 2, is_active: true },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimal_digits: 2, is_active: true },
];

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  position: 'before' | 'after' = 'before',
  locale?: string
): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);

  if (!currency) {
    return `${amount}`;
  }

  const formatted = amount.toFixed(currency.decimal_digits);

  if (position === 'after') {
    return `${formatted}${currency.symbol}`;
  }

  return `${currency.symbol}${formatted}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function getCurrencyName(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
}

export function getCurrencyDecimalDigits(currencyCode: string): number {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.decimal_digits ?? 2;
}
