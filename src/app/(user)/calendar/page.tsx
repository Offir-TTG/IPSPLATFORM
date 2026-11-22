import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadClientSessions } from '@/lib/portal/clientSessions';
import { CalendarView, type CalendarDay } from '@/components/user/portal/CalendarView';

export const dynamic = 'force-dynamic';

const TZ = 'Asia/Jerusalem';
const DAY = 24 * 60 * 60 * 1000;
const NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const weekday = (d: Date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(d));
const dm = (d: Date) => new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(d);

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Two weeks, Sunday to Saturday, in Israel time. Noon avoids clock-change edges.
  const now = new Date();
  const todayKey = dayKey(now);
  const noonToday = new Date(now.getTime() + (12 - Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now))) * 3600000);
  const sunday = new Date(noonToday.getTime() - weekday(noonToday) * DAY);
  const days: CalendarDay[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(sunday.getTime() + i * DAY);
    return { key: dayKey(d), name: NAMES[i % 7], short: SHORT[i % 7], date: dm(d), isToday: dayKey(d) === todayKey };
  });

  const sessions = await loadClientSessions(user.id, new Date(sunday.getTime() - DAY), new Date(sunday.getTime() + 15 * DAY));
  return <CalendarView days={days} sessions={sessions.filter((s) => days.some((d) => d.key === dayKey(new Date(s.start))))} serverNow={now.getTime()} />;
}
