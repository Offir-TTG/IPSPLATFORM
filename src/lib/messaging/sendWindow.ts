/**
 * When an email may leave: the client's quiet hours (in the client's own
 * time zone), the school's sending hours, and Shabbat and holidays (in the
 * school's time zone). Pure functions, no database.
 */

export interface WallTime {
  /** Minutes since midnight. */
  minutes: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function wallTime(at: Date, timezone: string): WallTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { minutes: Number(get('hour')) * 60 + Number(get('minute')), weekday: WEEKDAYS[get('weekday')] ?? 0 };
}

/** "HH:MM" or "HH:MM:SS" → minutes since midnight; null when empty or malformed. */
export function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** True when `minutes` falls inside [start, end), which may cross midnight. */
export function inRange(minutes: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

// Hebrew calendar days with no sending, as Intl names them (month, day).
// Rosh Hashanah, Yom Kippur, Sukkot, Shemini Atzeret, Pesach first and last
// day, Shavuot. Matches Israel's one-day festivals.
const HOLIDAYS: [string, number][] = [
  ['Tishri', 1], ['Tishri', 2], ['Tishri', 10], ['Tishri', 15], ['Tishri', 22],
  ['Nisan', 15], ['Nisan', 21], ['Sivan', 6],
];

function hebrewDay(at: Date, timezone: string): [string, number] {
  const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: timezone, month: 'long', day: 'numeric' }).formatToParts(at);
  return [parts.find((p) => p.type === 'month')?.value ?? '', Number(parts.find((p) => p.type === 'day')?.value ?? 0)];
}

function isHolidayDate(at: Date, timezone: string): boolean {
  const [month, day] = hebrewDay(at, timezone);
  return HOLIDAYS.some(([m, d]) => m === month && d === day);
}

/**
 * Shabbat or a holiday at this moment, in the school's time zone. Kept simple
 * and on the safe side: from 16:00 the day before until 21:00 on the day.
 */
export function isRestTime(at: Date, timezone: string): boolean {
  const w = wallTime(at, timezone);
  const evening = w.minutes >= 16 * 60;
  const beforeNightfall = w.minutes < 21 * 60;
  if (w.weekday === 5 && evening) return true;
  if (w.weekday === 6 && beforeNightfall) return true;
  const tomorrow = new Date(at.getTime() + 24 * 60 * 60 * 1000);
  if (evening && isHolidayDate(tomorrow, timezone)) return true;
  if (beforeNightfall && isHolidayDate(at, timezone)) return true;
  return false;
}

export interface WindowRules {
  /** The client's time zone, for quiet hours. */
  clientTimezone: string;
  quietStart: number | null;
  quietEnd: number | null;
  /** The school's time zone, for sending hours and Shabbat. */
  schoolTimezone: string;
  /** Sending hours; null = any time (time-sensitive messages skip these). */
  sendFrom: number | null;
  sendUntil: number | null;
  skipShabbat: boolean;
}

export type BlockReason = 'quiet_hours' | 'send_hours' | 'shabbat';

/** Why an email can't leave at this moment, or null when it can. */
export function blockedAt(at: Date, rules: WindowRules): BlockReason | null {
  if (rules.quietStart !== null && rules.quietEnd !== null) {
    if (inRange(wallTime(at, rules.clientTimezone).minutes, rules.quietStart, rules.quietEnd)) return 'quiet_hours';
  }
  if (rules.skipShabbat && isRestTime(at, rules.schoolTimezone)) return 'shabbat';
  if (rules.sendFrom !== null && rules.sendUntil !== null) {
    if (!inRange(wallTime(at, rules.schoolTimezone).minutes, rules.sendFrom, rules.sendUntil)) return 'send_hours';
  }
  return null;
}

/**
 * The first moment from `from` when the email may leave, stepping in
 * 15-minute slots for up to four days. Returns the reason for the first
 * delay too (what the log shows). `null` when no slot was found.
 */
export function nextOpenSlot(from: Date, rules: WindowRules): { at: Date; reason: BlockReason | null } | null {
  const first = blockedAt(from, rules);
  if (!first) return { at: from, reason: null };
  const step = 15 * 60 * 1000;
  // Align to the next quarter hour so emails leave on round times.
  let t = Math.ceil(from.getTime() / step) * step;
  for (let i = 0; i < 4 * 24 * 4; i++, t += step) {
    if (!blockedAt(new Date(t), rules)) return { at: new Date(t), reason: first };
  }
  return null;
}
