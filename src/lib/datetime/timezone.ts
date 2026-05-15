/**
 * Shared timezone utilities for lesson date/time handling across the LMS.
 *
 * ## Canonical rules
 *
 * **Storage:** `lessons.start_time` (timestamptz) stores the absolute UTC moment.
 * `lessons.timezone` is creation-context metadata — never reinterprets `start_time`.
 *
 * **Write:** every fetch that sends `start_time` over the wire sends a UTC ISO string
 * plus `timezone` as a separate display-preference field.
 *
 * **Display:** every render of a lesson time uses the fallback chain:
 *
 *   displayTimezone = recipient.timezone
 *                  || lesson.timezone
 *                  || tenant.timezone
 *                  || 'Asia/Jerusalem'
 *
 * For admin views `recipient.timezone` is undefined, so the chain collapses to
 * `lesson.timezone || tenant.timezone`. For student views it's the student's
 * own profile timezone. For emails it's the recipient user's profile timezone.
 *
 * Pure functions — no React, no fetch, no I/O. Safe to import from server,
 * client, edge, and tests.
 */

const HARDCODED_FALLBACK_TIMEZONE = 'Asia/Jerusalem';

/**
 * Convert a naive wall-clock string (`"YYYY-MM-DDTHH:mm"` or
 * `"YYYY-MM-DDTHH:mm:ss"`) interpreted in the given IANA timezone to a UTC
 * ISO string suitable for storage in a `timestamptz` column.
 *
 * Algorithm: treat the input numbers as if they were UTC to get a candidate
 * timestamp, then ask Intl what wall-clock time that candidate represents in
 * the target timezone. The difference between the input wall-clock and the
 * "appeared-as" wall-clock IS the offset that must be added back to get the
 * real UTC moment.
 *
 * Handles DST correctly via `Intl.DateTimeFormat` which has full IANA tzdata.
 */
export function wallTimeToUTC(wall: string, timezone: string): string {
  if (!wall) return wall;
  const padded = wall.length === 16 ? `${wall}:00` : wall;
  const [datePart, timePart] = padded.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s = 0] = timePart.split(':').map(Number);

  // Treat input as if it were UTC, then compute the offset between that UTC
  // and what the target timezone says about the same moment.
  const naiveAsUTC = Date.UTC(y, mo - 1, d, h, mi, s);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(naiveAsUTC));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const tzAsUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  const offsetMs = naiveAsUTC - tzAsUTC;
  return new Date(naiveAsUTC + offsetMs).toISOString();
}

/**
 * Inverse of `wallTimeToUTC`. Given a UTC ISO string (what's stored in the
 * DB) and an IANA timezone, return a naive `"YYYY-MM-DDTHH:mm"` string
 * representing that moment's wall-clock in the target timezone. Suitable
 * for populating an `<input type="datetime-local">`.
 */
export function utcToWallTime(utcIso: string, timezone: string): string {
  if (!utcIso) return '';
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Format a UTC ISO timestamp for display in the given timezone, using the
 * given Intl options and locale. Always pins `timeZone` so the rendered
 * time is consistent regardless of the viewer's machine timezone.
 *
 * For locale-aware output: pass `'he-IL'` or `'en-US'` (or whatever the
 * caller's UI locale is).
 */
export function formatInTimezone(
  utcIso: string,
  timezone: string,
  opts: Intl.DateTimeFormatOptions,
  locale: string = 'en-US'
): string {
  if (!utcIso) return '';
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, { ...opts, timeZone: timezone });
}

/**
 * Resolve the canonical display timezone from the four-level fallback chain.
 *
 * Use this everywhere a lesson time is rendered:
 *
 *   const tz = resolveDisplayTimezone({
 *     recipientTz: profile?.preferences?.regional?.timezone,  // student
 *     lessonTz:    lesson.timezone,
 *     tenantTz:    tenant?.timezone,
 *   });
 *   formatInTimezone(lesson.start_time, tz, { ... }, locale);
 *
 * Pass `undefined` for any layer that doesn't apply (e.g. admin views pass
 * no `recipientTz`).
 */
export function resolveDisplayTimezone(args: {
  recipientTz?: string | null;
  lessonTz?: string | null;
  tenantTz?: string | null;
}): string {
  return (
    args.recipientTz ||
    args.lessonTz ||
    args.tenantTz ||
    HARDCODED_FALLBACK_TIMEZONE
  );
}

/**
 * Compute the next round hour (e.g. `"2026-05-20T16:00"`) in the given
 * timezone, as a wall-clock string suitable for populating an
 * `<input type="datetime-local">`. Used to give the "Create new lesson"
 * form a sensible default that lives in the tenant's local frame rather
 * than UTC.
 */
export function nextRoundHourInTimezone(timezone: string): string {
  const now = new Date();
  // Add one hour, then truncate minutes/seconds. Doing this in UTC and then
  // formatting in the target tz is correct: the absolute moment "next hour
  // boundary in UTC plus enough to land on a fresh hour in target" turns
  // into a clean `:00` wall-clock in the target tz.
  const candidate = new Date(now.getTime() + 60 * 60 * 1000);
  candidate.setUTCMinutes(0, 0, 0);
  return utcToWallTime(candidate.toISOString(), timezone);
}

/**
 * Convenience: the canonical hardcoded fallback. Exported for callers that
 * need the literal value (e.g. seeding default forms before any tenant
 * data has loaded).
 */
export const DEFAULT_FALLBACK_TIMEZONE = HARDCODED_FALLBACK_TIMEZONE;
