'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react';
import type { AttendanceStatus } from '@/types/lms';
import { joinedBar, kitButton } from '@/components/admin/notifications/kit';
import {
  STATUSES,
  STATUS_TONE,
  initials,
  keyOf,
  meetingLabel,
  meetingWhen,
  searchBox,
  statusLabel,
  type Client,
  type Mark,
  type Meeting,
  type Translate,
} from './shared';

export type Counts = Record<AttendanceStatus | 'unmarked', number>;

export function countFor(meetingId: string, clients: Client[], markOf: (key: string) => Mark): Counts {
  const c: Counts = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
  for (const cl of clients) {
    const s = markOf(keyOf(cl.id, meetingId)).status;
    c[s ?? 'unmarked'] += 1;
  }
  return c;
}

// ─── Meeting picker and the tools under it ────────────────────────────

export function MarkToolbar({
  meetings,
  selected,
  onSelect,
  search,
  onSearch,
  onFillRest,
  onExport,
  exporting,
  counts,
  t,
  rtl,
}: {
  meetings: Meeting[];
  selected: string;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  /** Hidden in "all meetings" (each column has its own). */
  onFillRest?: () => void;
  onExport: () => void;
  exporting: boolean;
  counts?: Counts;
  t: Translate;
  rtl: boolean;
}) {
  const idx = meetings.findIndex((m) => m.id === selected);
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const arrow =
    'grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-card hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40';

  const single = selected !== 'all';
  const seg = 'grid h-11 w-11 shrink-0 place-items-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5">
      {single && (
        // One control: previous · the meeting · next.
        <div className="flex w-full max-w-[640px] items-stretch overflow-hidden rounded-xl border border-border bg-card">
          <button
            type="button"
            className={seg}
            aria-label={t('admin.attendanceTab.prevMeeting', 'Previous meeting')}
            title={t('admin.attendanceTab.prevMeeting', 'Previous meeting')}
            disabled={idx <= 0}
            onClick={() => idx > 0 && onSelect(meetings[idx - 1].id)}
          >
            <Prev className="h-5 w-5" aria-hidden />
          </button>
          <label className="min-w-0 flex-1 border-x border-border">
            <span className="sr-only">{t('admin.attendanceTab.meeting', 'Meeting')}</span>
            <select
              value={selected}
              onChange={(e) => onSelect(e.target.value)}
              className="h-11 w-full min-w-0 cursor-pointer bg-transparent px-3 text-[15px] font-bold outline-none focus-visible:bg-muted"
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {meetingLabel(m, t, rtl)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={seg}
            aria-label={t('admin.attendanceTab.nextMeeting', 'Next meeting')}
            title={t('admin.attendanceTab.nextMeeting', 'Next meeting')}
            disabled={idx < 0 || idx >= meetings.length - 1}
            onClick={() => idx >= 0 && idx < meetings.length - 1 && onSelect(meetings[idx + 1].id)}
          >
            <Next className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="min-w-0 flex-[1_1_220px] sm:max-w-[300px]">
          <span className="sr-only">{t('admin.attendanceTab.search', 'Search client')}</span>
          <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t('admin.attendanceTab.search', 'Search client')} className={searchBox} />
        </label>
        {onFillRest && (
          <button
            type="button"
            onClick={onFillRest}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-green-200 bg-green-50 px-4 text-sm font-bold text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <Check className="h-4 w-4" aria-hidden />
            {t('admin.attendanceTab.fillRest', 'Everyone not marked: present')}
          </button>
        )}
        <button type="button" onClick={onExport} disabled={exporting} className={kitButton.secondary}>
          {t('admin.attendanceTab.export', 'Export')}
        </button>
        {counts && <CountChips counts={counts} t={t} />}
      </div>
    </div>
  );
}

/** The meeting's numbers as small colour chips. */
function CountChips({ counts, t }: { counts: Counts; t: Translate }) {
  const chips: { n: number; label: string; cls: string }[] = [
    { n: counts.present, label: t('admin.attendanceTab.count.present', 'present'), cls: STATUS_TONE.present.on },
    { n: counts.late, label: t('admin.attendanceTab.count.late', 'late'), cls: STATUS_TONE.late.on },
    { n: counts.absent, label: t('admin.attendanceTab.count.absent', 'absent'), cls: STATUS_TONE.absent.on },
    { n: counts.excused, label: t('admin.attendanceTab.count.excused', 'excused'), cls: STATUS_TONE.excused.on },
    { n: counts.unmarked, label: t('admin.attendanceTab.count.unmarked', 'not marked'), cls: 'bg-muted text-foreground' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 sm:ms-auto" aria-label={t('admin.attendanceTab.countsLabel', 'This meeting')}>
      {chips.map((c, i) => (
        <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] ${c.cls}`}>
          <b className="tabular-nums">{c.n}</b> {c.label}
        </span>
      ))}
    </div>
  );
}

// ─── One meeting: a row per client ────────────────────────────────────

export function StatusButtons({
  value,
  onChange,
  t,
}: {
  value?: AttendanceStatus;
  onChange: (s: AttendanceStatus) => void;
  t: Translate;
}) {
  return (
    <div role="radiogroup" aria-label={t('admin.attendanceTab.statusGroup', 'Attendance status')} className={`${joinedBar} w-full sm:w-auto`}>
      {STATUSES.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(s)}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm transition-colors sm:flex-none sm:px-3.5 ${
              on ? STATUS_TONE[s].on : 'text-foreground hover:bg-muted'
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_TONE[s].dot}`} aria-hidden />
            {statusLabel(s, t)}
          </button>
        );
      })}
    </div>
  );
}

function NoteButton({ hasNote, onClick, t, compact }: { hasNote: boolean; onClick: () => void; t: Translate; compact?: boolean }) {
  const label = hasNote ? t('admin.attendanceTab.noteHas', 'Note ✓') : t('admin.attendanceTab.noteAdd', 'Note');
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border hover:bg-muted ${hasNote ? 'bg-primary/10 text-primary' : 'bg-card text-muted-foreground'}`}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        {hasNote && <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden />}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-3 text-[13.5px] font-semibold hover:bg-muted ${hasNote ? 'bg-primary/10' : 'bg-card'}`}
    >
      <Pencil className="h-4 w-4 text-primary" aria-hidden />
      {label}
    </button>
  );
}

export function ClientRows({
  clients,
  meetingId,
  markOf,
  onStatus,
  onNote,
  t,
}: {
  clients: Client[];
  meetingId: string;
  markOf: (key: string) => Mark;
  onStatus: (key: string, s: AttendanceStatus) => void;
  onNote: (clientId: string, meetingId: string) => void;
  t: Translate;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {clients.map((c) => {
        const key = keyOf(c.id, meetingId);
        const mark = markOf(key);
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/70 px-4 py-3 first:border-t-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary" aria-hidden>
              {initials(c.full_name || c.email)}
            </span>
            <div className="min-w-0 flex-[1_1_180px] sm:max-w-[260px]">
              <div className="font-bold [overflow-wrap:anywhere]">{c.full_name || c.email}</div>
              <div className="text-[12.5px] text-muted-foreground [overflow-wrap:anywhere]" dir="ltr">
                {c.email}
              </div>
            </div>
            <StatusButtons value={mark.status} onChange={(s) => onStatus(key, s)} t={t} />
            <NoteButton hasNote={!!mark.notes} onClick={() => onNote(c.id, meetingId)} t={t} />
          </div>
        );
      })}
    </div>
  );
}

// ─── All meetings: the clients × meetings table (wide screens) ────────

export function AllMeetingsGrid({
  clients,
  meetings,
  markOf,
  hasSaved,
  onStatus,
  onFillColumn,
  onNote,
  t,
  rtl,
}: {
  clients: Client[];
  meetings: Meeting[];
  markOf: (key: string) => Mark;
  /** Whether this cell already has a saved status (then it can't go back to empty). */
  hasSaved: (key: string) => boolean;
  onStatus: (key: string, s: AttendanceStatus | undefined) => void;
  onFillColumn: (meetingId: string) => void;
  onNote: (clientId: string, meetingId: string) => void;
  t: Translate;
  rtl: boolean;
}) {
  // Scrolls sideways inside its own box: `contain: inline-size` keeps the
  // table's width from stretching the page, so it stays as wide as every
  // other page. Arrows and faded edges show there are more meetings.
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ back: false, forward: false });
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // In RTL, scrollLeft runs from 0 to negative; its size is what matters.
    const gone = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ back: gone > 4, forward: max - gone > 4 });
  }, []);
  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, meetings.length, clients.length]);
  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    // "Forward" goes toward later meetings: left in RTL, right in LTR.
    const step = Math.max(200, el.clientWidth - 260) * dir * (rtl ? -1 : 1);
    el.scrollBy({ left: step, behavior: 'smooth' });
  };
  const Back = rtl ? ChevronRight : ChevronLeft;
  const Forward = rtl ? ChevronLeft : ChevronRight;
  const arrow = 'grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-35';

  return (
    <div className="relative w-full max-w-full [contain:inline-size]">
      {(edges.back || edges.forward) && (
        <div className="mb-2 flex items-center justify-end gap-1.5">
          <span className="me-1 text-xs text-muted-foreground">
            {t('admin.attendanceTab.meetingsCount', '{n} meetings').replace('{n}', String(meetings.length))}
          </span>
          <button type="button" className={arrow} disabled={!edges.back} onClick={() => page(-1)} aria-label={t('admin.attendanceTab.earlier', 'Earlier meetings')}>
            <Back className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className={arrow} disabled={!edges.forward} onClick={() => page(1)} aria-label={t('admin.attendanceTab.later', 'Later meetings')}>
            <Forward className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Faded edges where more meetings are hidden (the client column stays on the start side). */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 start-[200px] z-20 w-8 bg-gradient-to-r from-black/10 to-transparent transition-opacity rtl:bg-gradient-to-l dark:from-black/40 ${edges.back ? 'opacity-100' : 'opacity-0'}`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 end-0 z-20 w-10 bg-gradient-to-l from-black/10 to-transparent transition-opacity rtl:bg-gradient-to-r dark:from-black/40 ${edges.forward ? 'opacity-100' : 'opacity-0'}`}
        />
      <div
        ref={scroller}
        onScroll={measure}
        className="overflow-x-auto overscroll-x-contain scroll-smooth [scroll-padding-inline-start:200px] [scrollbar-width:thin] snap-x snap-proximity"
      >
      <table className="w-auto border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th scope="col" className="sticky start-0 z-10 w-[200px] min-w-[200px] max-w-[200px] border-b border-border bg-card p-3 text-start font-bold">
              {t('admin.attendanceTab.client', 'Client')}
            </th>
            {meetings.map((m) => (
              <th key={m.id} scope="col" className="min-w-[170px] max-w-[220px] snap-start border-b border-s border-border p-3 text-start align-top font-normal">
                <div className="font-bold">
                  {t('admin.attendanceTab.meetingNumber', 'Meeting {n}').replace('{n}', String(m.number))}
                </div>
                <div className="truncate text-xs text-muted-foreground" title={m.title}>
                  {m.title}
                </div>
                <div className="text-xs text-muted-foreground">{meetingWhen(m, rtl)}</div>
                <button
                  type="button"
                  onClick={() => onFillColumn(m.id)}
                  title={t('admin.attendanceTab.fillRest', 'Everyone not marked: present')}
                  className="mt-1.5 inline-flex min-h-9 items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 text-xs font-bold text-green-800 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {t('admin.attendanceTab.fillColumnRest', 'The rest: present')}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t border-border/70">
              <th scope="row" className="sticky start-0 z-10 w-[200px] min-w-[200px] max-w-[200px] bg-card p-3 text-start font-normal">
                <div className="font-bold [overflow-wrap:anywhere]">{c.full_name || c.email}</div>
                <div className="text-xs text-muted-foreground [overflow-wrap:anywhere]" dir="ltr">
                  {c.email}
                </div>
              </th>
              {meetings.map((m) => {
                const key = keyOf(c.id, m.id);
                const mark = markOf(key);
                return (
                  <td key={m.id} className="border-s border-border/70 p-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={mark.status ?? ''}
                        onChange={(e) => onStatus(key, (e.target.value || undefined) as AttendanceStatus | undefined)}
                        aria-label={`${c.full_name || c.email} · ${t('admin.attendanceTab.meetingNumber', 'Meeting {n}').replace('{n}', String(m.number))}`}
                        className={`h-10 w-[120px] cursor-pointer rounded-full border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 ${
                          mark.status ? `${STATUS_TONE[mark.status].on} border-transparent` : 'border-dashed border-border bg-card text-muted-foreground'
                        }`}
                      >
                        <option value="" disabled={hasSaved(key)}>
                          {t('admin.attendanceTab.notMarked', 'Not marked')}
                        </option>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s, t)}
                          </option>
                        ))}
                      </select>
                      <NoteButton hasNote={!!mark.notes} onClick={() => onNote(c.id, m.id)} t={t} compact />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  );
}

// ─── All meetings on a phone: pick one meeting instead ────────────────

export function MeetingChooser({
  meetings,
  countsOf,
  onSelect,
  t,
  rtl,
}: {
  meetings: Meeting[];
  countsOf: (meetingId: string) => Counts;
  onSelect: (id: string) => void;
  t: Translate;
  rtl: boolean;
}) {
  const Arrow = rtl ? ChevronLeft : ChevronRight;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <p className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-semibold">
        {t('admin.attendanceTab.pickMeetingPhone', 'On a phone you mark one meeting at a time. Choose a meeting:')}
      </p>
      {meetings.map((m) => {
        const c = countsOf(m.id);
        const marked = c.present + c.late + c.absent + c.excused;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className="flex min-h-[56px] w-full items-center gap-3 border-t border-border/70 px-4 py-3 text-start first:border-t-0 hover:bg-muted/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-bold [overflow-wrap:anywhere]">
                {t('admin.attendanceTab.meetingNumber', 'Meeting {n}').replace('{n}', String(m.number))} · {m.title}
              </span>
              <span className="block text-[13px] text-muted-foreground">
                {meetingWhen(m, rtl)} ·{' '}
                {t('admin.attendanceTab.markedOf', '{n} of {total} marked')
                  .replace('{n}', String(marked))
                  .replace('{total}', String(marked + c.unmarked))}
              </span>
            </span>
            <Arrow className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
