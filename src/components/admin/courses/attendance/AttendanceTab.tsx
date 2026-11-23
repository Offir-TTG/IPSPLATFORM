'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarPlus, SearchX, Users } from 'lucide-react';
import type { AttendanceStatus } from '@/types/lms';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { ListState, joinedBar, joinedSegment, kitButton } from '@/components/admin/notifications/kit';
import { NotePanel } from './NotePanel';
import { AllMeetingsGrid, ClientRows, MarkToolbar, MeetingChooser, countFor } from './MarkView';
import { SummaryView } from './SummaryView';
import {
  downloadCsv,
  keyOf,
  meetingLabel,
  nearestMeetingId,
  useIsNarrow,
  type Client,
  type Mark,
  type Meeting,
} from './shared';

const EMPTY: Mark = { notes: '' };

/**
 * The course's Attendance tab: mark one meeting (or all of them in a table)
 * and save with the floating bar, or see the summary per client.
 */
export function AttendanceTab({ courseId }: { courseId: string }) {
  const { t, direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const { toast } = useToast();
  const narrow = useIsNarrow();

  const [view, setView] = useState<'mark' | 'summary'>('mark');
  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [saved, setSaved] = useState<Map<string, Mark>>(new Map());
  const [edits, setEdits] = useState<Map<string, Mark>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string>('all');
  // The last single meeting chosen, so "one meeting" returns to it.
  const lastMeeting = useRef<string | null>(null);
  useEffect(() => {
    if (selected !== 'all') lastMeeting.current = selected;
  }, [selected]);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [noteFor, setNoteFor] = useState<{ clientId: string; meetingId: string } | null>(null);
  // Every change saves at once, one save after another (so fast clicks never overlap).
  const savedRef = useRef<Map<string, Mark>>(new Map());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // ─── Loading ───────────────────────────────────────────────────────

  const loadMarks = useCallback(async () => {
    const res = await fetch(`/api/admin/lms/courses/${courseId}/attendance`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const map = new Map<string, Mark>();
    // Newest date first, so if a meeting has two records the newer one wins.
    for (const r of (json.data || []) as { id: string; student_id: string; lesson_id: string | null; status: AttendanceStatus; notes: string | null }[]) {
      if (!r.lesson_id) continue;
      const key = keyOf(r.student_id, r.lesson_id);
      if (!map.has(key)) map.set(key, { id: r.id, status: r.status, notes: r.notes || '' });
    }
    setSaved(map);
    savedRef.current = map;
    return map;
  }, [courseId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const [studentsRes, lessonsRes] = await Promise.all([
          fetch(`/api/admin/lms/courses/${courseId}/students`),
          fetch(`/api/lms/lessons?course_id=${courseId}`),
        ]);
        if (!studentsRes.ok || !lessonsRes.ok) throw new Error('load failed');
        const [studentsJson, lessonsJson] = await Promise.all([studentsRes.json(), lessonsRes.json()]);
        await loadMarks();
        if (!alive) return;
        const list: Meeting[] = ((lessonsJson.data || []) as Omit<Meeting, 'number'>[])
          .slice()
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime() || (a.order ?? 0) - (b.order ?? 0))
          .map((l, i) => ({ id: l.id, title: l.title, start_time: l.start_time, timezone: l.timezone, order: l.order, number: i + 1 }));
        setClients(studentsJson.data || []);
        setMeetings(list);
        setSelected(nearestMeetingId(list) ?? 'all');
      } catch {
        if (alive) setLoadFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId, loadMarks]);

  // ─── Marks and edits ───────────────────────────────────────────────

  const markOf = useCallback((key: string) => edits.get(key) ?? saved.get(key) ?? EMPTY, [edits, saved]);

  const patchMany = (changes: { key: string; patch: Partial<Mark> }[]) => {
    if (!changes.length) return;
    // What each changed cell becomes, shown straight away…
    const next = changes.map(({ key, patch }) => ({ key, mark: { ...markOf(key), ...patch } as Mark }));
    setEdits((prev) => {
      const m = new Map(prev);
      for (const { key, mark } of next) m.set(key, mark);
      return m;
    });
    // …and saved right after, in order.
    queue.current = queue.current.then(() => persist(next));
  };
  const setStatus = (key: string, status: AttendanceStatus | undefined) => patchMany([{ key, patch: { status } }]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.full_name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [clients, search]);

  /** Fills "present" only where nothing is marked; never overwrites. */
  const fillRest = (meetingId: string) =>
    patchMany(visible.filter((c) => !markOf(keyOf(c.id, meetingId)).status).map((c) => ({ key: keyOf(c.id, meetingId), patch: { status: 'present' as const } })));

  // ─── Saving (each change, right away) ──────────────────────────────

  const persist = async (changes: { key: string; mark: Mark }[]) => {
    const ready = changes.filter((c) => c.mark.status);
    if (ready.length < changes.length) {
      toast({ variant: 'destructive', title: t('admin.attendanceTab.notesNeedStatus', 'A note is saved only together with a status. Choose a status for those clients.') });
    }
    if (!ready.length) return;
    const records = ready.map(({ key, mark }) => {
      const [student_id, lesson_id] = key.split('___');
      const id = savedRef.current.get(key)?.id;
      return { ...(id ? { id } : {}), student_id, lesson_id, status: mark.status, notes: mark.notes || null };
    });
    let failed = false;
    // Updates (with id) and new marks go separately: the database fills the id only for new rows.
    for (const group of [records.filter((r) => 'id' in r), records.filter((r) => !('id' in r))]) {
      if (group.length === 0) continue;
      try {
        const res = await fetch(`/api/admin/lms/courses/${courseId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, lesson_id: null, attendance_date: new Date().toISOString().split('T')[0], records: group }),
        });
        if (!res.ok) failed = true;
      } catch {
        failed = true;
      }
    }
    try {
      const fresh = await loadMarks();
      // Drop what is now saved; keep anything still different (a failed save, a note without a status).
      setEdits((prev) => {
        const m = new Map<string, Mark>();
        prev.forEach((mark, key) => {
          const base = fresh.get(key) ?? EMPTY;
          if (mark.status !== base.status || mark.notes !== base.notes) m.set(key, mark);
        });
        return m;
      });
    } catch {
      failed = true;
    }
    if (failed) toast({ variant: 'destructive', title: t('admin.attendanceTab.saveFailed', "Couldn't save everything. Please try again.") });
    else setSavedAt(Date.now());
  };

  useEffect(() => {
    if (!savedAt) return;
    const id = setTimeout(() => setSavedAt(null), 2500);
    return () => clearTimeout(id);
  }, [savedAt]);

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadCsv(`/api/admin/lms/courses/${courseId}/attendance/export`, 'attendance.csv');
    } catch {
      toast({ variant: 'destructive', title: t('admin.attendanceTab.exportFailed', "Couldn't export. Please try again.") });
    } finally {
      setExporting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  const meetingsHeld = meetings.filter((m) => new Date(m.start_time).getTime() <= Date.now()).length;
  const current = meetings.find((m) => m.id === selected);
  const noteClient = noteFor ? clients.find((c) => c.id === noteFor.clientId) : undefined;
  const noteMeeting = noteFor ? meetings.find((m) => m.id === noteFor.meetingId) : undefined;
  const noteMark = noteFor ? markOf(keyOf(noteFor.clientId, noteFor.meetingId)) : EMPTY;

  const box = (node: ReactNode) => <div className="overflow-hidden rounded-2xl border border-border bg-card">{node}</div>;

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="flex justify-center py-16" aria-busy="true">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  } else if (loadFailed) {
    body = box(<ListState icon={Users} tone="red" title={t('admin.attendanceTab.loadFailed', "Couldn't load attendance. Please refresh the page.")} />);
  } else if (view === 'summary') {
    body = <SummaryView courseId={courseId} meetingsHeld={meetingsHeld} t={t} />;
  } else if (meetings.length === 0) {
    body = box(
      <ListState
        icon={CalendarPlus}
        title={t('admin.attendanceTab.noMeetings', 'This course has no meetings yet')}
        text={t('admin.attendanceTab.noMeetingsText', 'Add meetings in the Structure step, then mark attendance here.')}
        action={
          <Link href={`/admin/lms/courses/${courseId}?step=structure`} className={kitButton.primary}>
            {t('admin.attendanceTab.goStructure', 'Go to Structure')}
          </Link>
        }
      />,
    );
  } else if (clients.length === 0) {
    body = box(
      <ListState
        icon={Users}
        title={t('admin.attendanceTab.noClients', 'No clients are enrolled in this course yet')}
        text={t('admin.attendanceTab.noClientsText', 'Clients appear here once they enroll.')}
      />,
    );
  } else {
    const isAll = selected === 'all' || !current;
    body = (
      <>
        <MarkToolbar
          meetings={meetings}
          selected={isAll ? 'all' : selected}
          onSelect={setSelected}
          search={search}
          onSearch={setSearch}
          onFillRest={isAll ? undefined : () => fillRest(selected)}
          onExport={onExport}
          exporting={exporting}
          counts={isAll ? undefined : countFor(selected, clients, markOf)}
          t={t}
          rtl={rtl}
        />
        {visible.length === 0 ? (
          box(
            <ListState
              icon={SearchX}
              tone="grey"
              title={t('admin.attendanceTab.noMatch', 'No client matches your search')}
              action={
                <button type="button" onClick={() => setSearch('')} className={kitButton.secondary}>
                  {t('admin.attendanceTab.clearSearch', 'Clear search')}
                </button>
              }
            />,
          )
        ) : isAll && narrow ? (
          <MeetingChooser meetings={meetings} countsOf={(id) => countFor(id, visible, markOf)} onSelect={setSelected} t={t} rtl={rtl} />
        ) : isAll ? (
          <AllMeetingsGrid
            clients={visible}
            meetings={meetings}
            markOf={markOf}
            hasSaved={(key) => !!saved.get(key)?.status}
            onStatus={setStatus}
            onFillColumn={fillRest}
            onNote={(clientId, meetingId) => setNoteFor({ clientId, meetingId })}
            t={t}
            rtl={rtl}
          />
        ) : (
          <ClientRows
            clients={visible}
            meetingId={selected}
            markOf={markOf}
            onStatus={setStatus}
            onNote={(clientId, meetingId) => setNoteFor({ clientId, meetingId })}
            t={t}
          />
        )}
      </>
    );
  }

  // One switch for the three ways to look at attendance.
  const mode: 'meeting' | 'all' | 'summary' = view === 'summary' ? 'summary' : selected === 'all' ? 'all' : 'meeting';
  const setMode = (m: 'meeting' | 'all' | 'summary') => {
    if (m === 'summary') return setView('summary');
    setView('mark');
    if (m === 'all') setSelected('all');
    else setSelected(lastMeeting.current ?? nearestMeetingId(meetings) ?? meetings[0]?.id ?? 'all');
  };

  return (
    <div className="flex flex-col gap-4" dir={direction}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="max-w-full overflow-x-auto">
          <div role="group" aria-label={t('admin.attendanceTab.viewLabel', 'View')} className={joinedBar}>
            {(
              [
                ['meeting', t('admin.attendanceTab.modeMeeting', 'One meeting')],
                ['all', t('admin.attendanceTab.modeAll', 'All meetings')],
                ['summary', t('admin.attendanceTab.viewSummary', 'Summary')],
              ] as const
            ).map(([m, label]) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`${joinedSegment(mode === m)} !min-h-[44px] !px-5`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-3 text-[13.5px] text-muted-foreground">
          {savedAt && (
            <span role="status" className="font-semibold text-green-700 dark:text-green-400">
              {t('admin.attendanceTab.savedTick', 'Saved ✓')}
            </span>
          )}
          {view === 'mark'
            ? t('admin.attendanceTab.rule', 'Late counts as present · Excused does not count as absent')
            : t('admin.attendanceTab.introSummary', 'Attendance % = present + late, out of the meetings held. Excused does not count as absent.')}
        </p>
      </div>

      {body}

      <NotePanel
        open={!!noteFor}
        clientName={noteClient?.full_name || noteClient?.email || ''}
        meetingText={noteMeeting ? meetingLabel(noteMeeting, t, rtl) : ''}
        value={noteMark.notes}
        hasStatus={!!noteMark.status}
        onDone={(v) => {
          if (noteFor) patchMany([{ key: keyOf(noteFor.clientId, noteFor.meetingId), patch: { notes: v } }]);
          setNoteFor(null);
        }}
        onClose={() => setNoteFor(null)}
      />

    </div>
  );
}
