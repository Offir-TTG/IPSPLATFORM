import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { loadClientSessions } from '@/lib/portal/clientSessions';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
// RFC 5545: escape \ ; , and newlines; fold lines longer than 75 octets.
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line: string) {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (parts.length ? 74 : 75), bytes.length);
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--; // don't split a character
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
  }
  return parts.join('\r\n ');
}

/**
 * GET /api/user/calendar/ics
 * The signed-in client's sessions for the next three months as a calendar
 * file, to open in Google Calendar or on an iPhone.
 */
export const GET = withAuth(async (_request: NextRequest, user: any) => {
  const now = new Date();
  const sessions = await loadClientSessions(user.id, new Date(now.getTime() - DAY), new Date(now.getTime() + 90 * DAY));
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IPS//Client Portal//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:המפגשים שלי',
  ];
  for (const s of sessions) {
    const link = s.joinUrl || `${base}${s.href}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.lessonId}@ips-portal`,
      `DTSTAMP:${stamp(now.toISOString())}`,
      `DTSTART:${stamp(s.start)}`,
      `DTEND:${stamp(s.end)}`,
      `SUMMARY:${esc(s.title)}`,
      `DESCRIPTION:${esc(`${s.source}${s.instructor ? ` · ${s.instructor}` : ''}\n${link}`)}`,
      ...(s.joinUrl ? [`LOCATION:${esc(s.joinUrl)}`] : []),
      `URL:${link}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');

  return new NextResponse(lines.map(fold).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-sessions.ics"',
      'Cache-Control': 'no-store',
    },
  });
}, ['student', 'instructor', 'admin', 'super_admin']);
