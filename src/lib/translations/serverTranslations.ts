import { createClient } from '@/lib/supabase/server';

/**
 * Fetch translations from database for server-side use (email templates, etc.)
 *
 * @param languageCode - Language code (e.g., 'en', 'he')
 * @param keys - Array of translation keys to fetch
 * @returns Record of translation_key -> translation_value
 */
export async function getServerTranslations(
  languageCode: string,
  keys: string[]
): Promise<Record<string, string>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', languageCode)
    .in('translation_key', keys);

  if (error) {
    console.error('Error fetching translations:', error);
    return {};
  }

  const translations: Record<string, string> = {};
  data?.forEach(t => {
    translations[t.translation_key] = t.translation_value;
  });

  return translations;
}

/**
 * Get a single translation value with fallback
 *
 * @param translations - Translation record from getServerTranslations
 * @param key - Translation key
 * @param fallback - Fallback value if translation not found
 * @param params - Optional parameters to replace in translation string (e.g., {name}, {url})
 * @returns Translated string with parameters replaced
 */
export function translate(
  translations: Record<string, string>,
  key: string,
  fallback: string,
  params?: Record<string, string>
): string {
  let text = translations[key] || fallback;

  // Replace placeholders like {name}, {url}, {product}
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
    });
  }

  return text;
}

/**
 * Get all translations for a specific language
 * Useful for client-side hydration
 *
 * @param languageCode - Language code (e.g., 'en', 'he')
 * @param context - Optional context filter (e.g., 'admin', 'user', 'email')
 * @returns Record of all translations for the language
 */
export async function getAllTranslations(
  languageCode: string,
  context?: string
): Promise<Record<string, string>> {
  const supabase = await createClient();

  let query = supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('language_code', languageCode);

  if (context) {
    query = query.eq('context', context);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all translations:', error);
    return {};
  }

  const translations: Record<string, string> = {};
  data?.forEach(t => {
    translations[t.translation_key] = t.translation_value;
  });

  return translations;
}

/**
 * Helper to format currency amounts with language-specific formatting
 *
 * @param amount - Numeric amount
 * @param currency - Currency code (e.g., 'USD', 'ILS')
 * @param languageCode - Language code for formatting
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string,
  languageCode: string
): string {
  const locale = languageCode === 'he' ? 'he-IL' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Helper to format dates with language-specific formatting
 *
 * @param date - Date to format
 * @param languageCode - Language code for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  languageCode: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = languageCode === 'he' ? 'he-IL' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}
