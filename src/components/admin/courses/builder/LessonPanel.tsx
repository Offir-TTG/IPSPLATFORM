'use client';

import { useState, type ReactNode } from 'react';
import { BookOpen, CheckCircle, ChevronDown, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Trash2, Video, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import TokenInserter, { type Token } from '@/components/ui/token-inserter';
import { ZoomSettingsPanel, type ZoomSettings } from '@/components/admin/lms/ZoomSettingsPanel';
import { DurationPicker, Segmented, SwitchRow, TimezonePicker } from './pickers';
import { InlineConfirm } from './SidePanel';
import { meetingOf, type BuilderLesson, type Translate } from './types';

export interface LessonFormState extends ZoomSettings {
  title: string;
  description: string;
  /** Wall-clock "YYYY-MM-DDTHH:MM" in `timezone`. */
  start_time: string;
  duration_minutes: string;
  timezone: string;
  is_published: boolean;
  create_meeting: boolean;
  meeting_platform: 'zoom' | 'daily';
  create_zoom: boolean;
  zoom_topic: string;
  zoom_agenda: string;
  daily_room_name: string;
}

const sectionCls = 'overflow-hidden rounded-[14px] border border-border';
const sectionTitle = 'bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]';
const button =
  'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={sectionCls}>
      <h3 className={sectionTitle}>{title}</h3>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  );
}

/**
 * The lesson, in a side panel: When, Details, Video meeting and Content.
 * Used both to add one lesson and to edit one. Saving goes through the
 * page's own handler, so the server calls are the same as before.
 */
export function LessonPanel({
  open,
  onClose,
  form,
  setForm,
  editingLesson,
  moduleTitle,
  error,
  saving,
  onSave,
  onDelete,
  deleting,
  onOpenMeeting,
  onSyncRecording,
  onCreateMeeting,
  creatingMeeting,
  syncingRecording,
  onEditContent,
  onSwitchToSeries,
  lessonTokens,
  zoomTokens,
  insertToken,
  tenantTimezone,
  t,
  direction,
}: {
  open: boolean;
  onClose: () => void;
  form: LessonFormState;
  setForm: (patch: Partial<LessonFormState>) => void;
  editingLesson: BuilderLesson | null;
  moduleTitle: string;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  /** Called after "Yes, delete" inside the panel. */
  onDelete: (lessonId: string) => void;
  deleting: boolean;
  onOpenMeeting: (lessonId: string) => void;
  onSyncRecording: (lessonId: string) => void;
  onCreateMeeting: (lessonId: string, platform: 'zoom' | 'daily') => void;
  creatingMeeting: boolean;
  syncingRecording: boolean;
  onEditContent: (lesson: BuilderLesson) => void;
  onSwitchToSeries: () => void;
  lessonTokens: Token[];
  zoomTokens: Token[];
  insertToken: (current: string, token: string, set: (v: string) => void) => void;
  tenantTimezone: string;
  t: Translate;
  direction: 'ltr' | 'rtl';
}) {
  const isRtl = direction === 'rtl';
  const locale = isRtl ? 'he-IL' : 'en-US';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const lesson = editingLesson;
  const meeting = lesson ? meetingOf(lesson) : null;
  const topics = lesson?.lesson_topics?.length ?? 0;
  const date = form.start_time.slice(0, 10);
  const time = form.start_time.slice(11, 16);
  const setWhen = (d: string, tm: string) => setForm({ start_time: `${d}T${tm || '00:00'}` });

  // "At a glance": the lesson's video meeting, recording and content, each
  // with the one or two actions it can take. The row that needs attention
  // first is marked "Next step", so the panel says what to do.
  const hasRecording = !!lesson?.zoom_session?.has_recording;
  const past = !!lesson?.start_time && new Date(lesson.start_time).getTime() + (lesson.duration || 60) * 60000 < Date.now();
  const nextKey = !lesson ? null : !meeting ? 'meeting' : meeting === 'zoom' && past && !hasRecording ? 'recording' : topics === 0 ? 'content' : null;
  const small =
    'inline-flex min-h-[38px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 text-[13px] font-semibold hover:bg-muted disabled:opacity-60';
  const glance: { key: string; icon: typeof Video; tile: string; title: string; sub: string; actions: ReactNode; next: boolean }[] = lesson
    ? [
        {
          key: 'meeting',
          icon: Video,
          tile: meeting ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-muted text-muted-foreground',
          title: meeting
            ? meeting === 'daily'
              ? t('admin.courses.builder.dailyConnected', 'Connected to Daily.co')
              : t('lms.lesson.zoom_connected', 'Connected to Zoom')
            : t('admin.courses.builder.noMeeting', 'No video meeting'),
          sub: meeting
            ? meeting === 'zoom'
              ? `${t('lms.lesson.zoom_meeting_id', 'Meeting ID')}: ${lesson.zoom_meeting_id}`
              : lesson.zoom_session?.daily_room_name ?? ''
            : t('admin.courses.builder.meetingHint', 'Clients join the live lesson from here'),
          actions: meeting ? (
            <button type="button" className={small} onClick={() => onOpenMeeting(lesson.id)}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {meeting === 'daily' ? t('lms.builder.open_daily', 'Open Daily.co') : t('lms.builder.open_zoom', 'Open Zoom')}
            </button>
          ) : (
            <>
              <button type="button" className={small} disabled={creatingMeeting} onClick={() => onCreateMeeting(lesson.id, 'zoom')}>
                {creatingMeeting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                {t('lms.lesson.platform_zoom', 'Zoom')}
              </button>
              <button type="button" className={small} disabled={creatingMeeting} onClick={() => onCreateMeeting(lesson.id, 'daily')}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t('lms.lesson.platform_daily', 'Daily.co')}
              </button>
            </>
          ),
          next: nextKey === 'meeting',
        },
        ...(meeting === 'zoom'
          ? [
              {
                key: 'recording',
                icon: hasRecording ? CheckCircle : RefreshCw,
                tile: hasRecording
                  ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
                title: hasRecording
                  ? t('lms.builder.recorded', 'Recorded')
                  : past
                    ? t('admin.courses.builder.waitingRecording', 'Waiting for recording')
                    : t('admin.courses.builder.recordingLater', 'Recording'),
                sub: hasRecording
                  ? t('admin.courses.builder.recordingReady', 'Clients can watch it on the lesson page')
                  : past
                    ? t('admin.courses.builder.recordingHint', 'Zoom usually sends it on its own. If not, fetch it now.')
                    : t('admin.courses.builder.recordingAfter', 'Available after the lesson'),
                actions: hasRecording ? null : (
                  <button type="button" className={small} disabled={syncingRecording} onClick={() => onSyncRecording(lesson.id)}>
                    {syncingRecording ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                    {t('lms.builder.sync_recording', 'Sync recording')}
                  </button>
                ),
                next: nextKey === 'recording',
              },
            ]
          : []),
        {
          key: 'content',
          icon: BookOpen,
          tile: topics ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          title:
            topics === 0
              ? t('admin.courses.builder.noContent', 'No content yet')
              : topics === 1
                ? t('admin.courses.builder.oneItem', '1 content item')
                : t('admin.courses.builder.items', '{n} content items').replace('{n}', String(topics)),
          sub:
            topics > 0
              ? (lesson.lesson_topics ?? []).map((x) => x.title).filter(Boolean).join(' · ') || t('admin.courses.builder.contentHint', 'Videos, files and text on the lesson page')
              : t('admin.courses.builder.contentHint', 'Videos, files and text on the lesson page'),
          actions: (
            <button type="button" className={small} onClick={() => onEditContent(lesson)}>
              {topics === 0 ? <Plus className="h-3.5 w-3.5" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
              {topics === 0 ? t('admin.courses.builder.addContentShort', 'Add') : t('admin.courses.builder.editContent', 'Edit content')}
            </button>
          ),
          next: nextKey === 'content',
        },
      ]
    : [];

  const statusLine = [
    t('admin.courses.builder.lesson', 'Lesson'),
    lesson ? (form.is_published ? t('lms.builder.published', 'Published') : t('lms.builder.draft', 'Draft')) : t('admin.courses.builder.newLesson', 'New'),
    moduleTitle ? t('admin.courses.builder.inModule', 'Module: {title}').replace('{title}', moduleTitle) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Sheet open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <SheetContent
        side={isRtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none sm:max-w-[540px] [&>[data-default-close]]:hidden"
      >
        <header className="relative shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-4 pt-5">
          <p className="pe-24 text-[13.5px] font-semibold text-muted-foreground">{statusLine}</p>
          <SheetTitle className="mt-1 pe-24 text-[23px] font-extrabold leading-tight [font-family:inherit] [overflow-wrap:anywhere]">
            {lesson ? form.title || lesson.title : t('lms.lesson.add_lesson', 'Add Lesson')}
          </SheetTitle>
          <SheetDescription className="sr-only">{t('lms.lesson.create_description', 'Fill in the lesson details')}</SheetDescription>
          <div className="absolute end-3 top-3 flex gap-1">
            {lesson && (
              <button
                type="button"
                onClick={() => setAskDelete(true)}
                aria-label={t('admin.courses.builder.deleteLesson', 'Delete the lesson')}
                className="grid h-10 w-10 place-items-center rounded-lg border border-red-200 bg-card text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
              className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {!lesson && (
            <div className="mt-3">
              <Segmented
                label={t('admin.courses.builder.howMany', 'How many lessons')}
                value="one"
                onChange={(v) => v === 'series' && onSwitchToSeries()}
                options={[
                  { value: 'one', label: t('admin.courses.builder.oneLessonOption', 'One lesson') },
                  { value: 'series', label: t('admin.courses.builder.seriesOption', 'A series of lessons') },
                ]}
              />
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
          {lesson && askDelete && (
            <InlineConfirm
              text={t('admin.courses.builder.deleteLessonConfirm', 'Delete "{title}"? This cannot be undone.').replace('{title}', lesson.title)}
              confirmLabel={deleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
              cancelLabel={t('common.cancel', 'Cancel')}
              onConfirm={() => {
                setAskDelete(false);
                onDelete(lesson.id);
              }}
              onCancel={() => setAskDelete(false)}
              busy={deleting}
            />
          )}
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}

          <Section title={t('admin.courses.builder.details', 'Details')}>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-title">{t('lms.lesson.title_label', 'Lesson Title')} *</Label>
              <Input
                id="lesson-title"
                value={form.title}
                onChange={(e) => setForm({ title: e.target.value })}
                placeholder={t('lms.lesson.title_placeholder', 'e.g., Introduction to Parenting')}
                aria-invalid={!!error && !form.title.trim()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-desc">{t('lms.lesson.description_label', 'Description')}</Label>
              <Textarea
                id="lesson-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ description: e.target.value })}
                placeholder={t('lms.lesson.description_placeholder', 'What will clients learn in this lesson?')}
              />
            </div>
            <SwitchRow
              title={t('admin.courses.builder.visible', 'Visible to clients')}
              hint={t('admin.courses.builder.visibleHint', 'Off = draft, only admins see it')}
              checked={form.is_published}
              onChange={(v) => setForm({ is_published: v })}
            />
          </Section>

          <Section title={t('admin.courses.builder.when', 'When')}>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="lesson-date">{t('admin.courses.builder.date', 'Date')} *</Label>
                <Input id="lesson-date" type="date" value={date} onChange={(e) => setWhen(e.target.value, time)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lesson-time">{t('admin.courses.builder.time', 'Time')} *</Label>
                <Input id="lesson-time" type="time" value={time} onChange={(e) => setWhen(date, e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-length">{t('admin.courses.builder.length', 'Length')}</Label>
              <DurationPicker id="lesson-length" value={form.duration_minutes} onChange={(v) => setForm({ duration_minutes: v })} t={t} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('lms.lesson.timezone_label', 'Timezone')} *</Label>
              <TimezonePicker value={form.timezone} onChange={(v) => setForm({ timezone: v })} tenantTimezone={tenantTimezone} locale={locale} t={t} />
            </div>
            {lesson && meeting === 'zoom' && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-[13px] text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                {t('lms.lesson.zoom_auto_sync', 'Changes to date, time and duration will automatically sync to the Zoom meeting')}
              </p>
            )}
          </Section>

          {lesson && (
            <section aria-label={t('admin.courses.builder.atAGlance', 'At a glance')} className="space-y-2">
              <h3 className="text-sm font-bold text-primary [font-family:inherit]">{t('admin.courses.builder.atAGlance', 'At a glance')}</h3>
              {glance.map((row) => (
                <div
                  key={row.key}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    row.next ? 'border-primary/60 bg-primary/[0.05] ring-1 ring-primary/30' : 'border-border bg-card'
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${row.tile}`} aria-hidden>
                    <row.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                      {row.title}
                      {row.next && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                          {t('admin.courses.builder.nextStep', 'Next step')}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[13px] text-muted-foreground">{row.sub}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">{row.actions}</div>
                </div>
              ))}
            </section>
          )}

          {!lesson && (
          <Section title={t('admin.courses.builder.videoMeeting', 'Video meeting')}>
              <>
                <SwitchRow
                  title={t('lms.lesson.meeting_integration_title', 'Video Meeting Integration')}
                  hint={t('lms.lesson.meeting_integration_desc', 'Create a video meeting automatically for this lesson')}
                  checked={form.create_meeting}
                  onChange={(checked) =>
                    setForm({
                      create_meeting: checked,
                      create_zoom: checked && form.meeting_platform === 'zoom',
                      zoom_topic: checked && form.meeting_platform === 'zoom' && !form.zoom_topic ? form.title : form.zoom_topic,
                      daily_room_name: checked && form.meeting_platform === 'daily' && !form.daily_room_name ? form.title : form.daily_room_name,
                    })
                  }
                />
                {form.create_meeting && (
                  <>
                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('lms.lesson.meeting_platform_label', 'Meeting Platform')}>
                      {(['zoom', 'daily'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={form.meeting_platform === p}
                          onClick={() =>
                            setForm({
                              meeting_platform: p,
                              create_zoom: p === 'zoom',
                              daily_room_name: p === 'daily' && !form.daily_room_name ? form.title : form.daily_room_name,
                              zoom_topic: p === 'zoom' && !form.zoom_topic ? form.title : form.zoom_topic,
                            })
                          }
                          className={`flex min-h-[64px] items-center gap-3 rounded-xl border p-3 text-start text-sm font-bold ${
                            form.meeting_platform === p ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted'
                          }`}
                        >
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${p === 'zoom' ? 'bg-blue-600' : 'bg-slate-700'}`} aria-hidden>
                            <Video className="h-4 w-4" />
                          </span>
                          {p === 'zoom' ? t('lms.lesson.platform_zoom', 'Zoom') : t('lms.lesson.platform_daily', 'Daily.co')}
                        </button>
                      ))}
                    </div>
                    {form.meeting_platform === 'daily' ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="daily-room">{t('lms.lesson.daily_room_name_label', 'Daily.co Room Name')} *</Label>
                        <Input
                          id="daily-room"
                          value={form.daily_room_name}
                          onChange={(e) => setForm({ daily_room_name: e.target.value })}
                          placeholder={t('lms.lesson.daily_room_name_placeholder', 'e.g., Introduction to Parenting - Session 1')}
                        />
                        <TokenInserter
                          tokens={lessonTokens}
                          onInsertToken={(token) => insertToken(form.daily_room_name, token, (v) => setForm({ daily_room_name: v }))}
                          direction={direction}
                          isRtl={isRtl}
                          t={t}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('lms.lesson.daily_room_name_help', 'This will be used to identify the room (only Latin characters, numbers, and hyphens)')}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="zoom-topic">{t('lms.lesson.zoom_topic_label', 'Zoom Meeting Topic')} *</Label>
                          <Input
                            id="zoom-topic"
                            value={form.zoom_topic}
                            onChange={(e) => setForm({ zoom_topic: e.target.value })}
                            placeholder={t('lms.lesson.zoom_topic_placeholder', 'e.g., Introduction to Parenting - Session 1')}
                          />
                          <TokenInserter
                            tokens={zoomTokens}
                            onInsertToken={(token) => insertToken(form.zoom_topic, token, (v) => setForm({ zoom_topic: v }))}
                            direction={direction}
                            isRtl={isRtl}
                            t={t}
                          />
                          <p className="text-xs text-muted-foreground">{t('lms.lesson.zoom_topic_help', 'This will be the visible meeting name in Zoom')}</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="zoom-agenda">{t('lms.lesson.zoom_agenda_label', 'Zoom Meeting Agenda (Optional)')}</Label>
                          <Textarea
                            id="zoom-agenda"
                            rows={2}
                            value={form.zoom_agenda}
                            onChange={(e) => setForm({ zoom_agenda: e.target.value })}
                            placeholder={t('lms.lesson.zoom_agenda_placeholder', 'e.g., Today we will cover basic parenting techniques...')}
                          />
                        </div>
                        <button
                          type="button"
                          aria-expanded={advancedOpen}
                          onClick={() => setAdvancedOpen((v) => !v)}
                          className={`${button} w-full justify-between border-dashed`}
                        >
                          {t('admin.courses.builder.zoomAdvanced', 'Advanced Zoom settings (passcode, waiting room, recording)')}
                          <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                        {advancedOpen && <ZoomSettingsPanel settings={form} onChange={(patch) => setForm(patch)} t={t} isRtl={isRtl} direction={direction} />}
                      </>
                    )}
                  </>
                )}
              </>
          </Section>

          )}

          {!lesson && (
          <Section title={t('admin.courses.builder.content', 'Lesson content')}>
            <p className="text-sm text-muted-foreground">{t('admin.courses.builder.contentAfterSave', 'You can add videos, files and text after saving the lesson.')}</p>
          </Section>
          )}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-6 py-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {saving
              ? lesson
                ? t('lms.lesson.updating', 'Updating...')
                : t('lms.lesson.creating', 'Creating...')
              : lesson
                ? t('admin.courses.builder.saveLesson', 'Save the lesson')
                : t('lms.lesson.add_lesson', 'Add Lesson')}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className={button}>
            {t('common.cancel', 'Cancel')}
          </button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
