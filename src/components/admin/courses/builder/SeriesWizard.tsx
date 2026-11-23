'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Minus, Plus, Video } from 'lucide-react';
import { SidePanel, panelPrimary, panelSecondary } from './SidePanel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TokenInserter, { type Token } from '@/components/ui/token-inserter';
import { ZoomSettingsPanel, type ZoomSettings } from '@/components/admin/lms/ZoomSettingsPanel';
import { DurationPicker, Segmented, SwitchRow, TimezonePicker } from './pickers';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import type { Translate } from './types';

/** The page's series form, field for field (the bulk-smart API reads these). */
export interface BulkLessonFormState {
  series_name: string;
  count: string;
  titlePattern: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  start_date: string;
  start_time: string;
  duration_minutes: string;
  timezone: string;
  weekly_days: number[];
  end_type: string;
  end_count: string;
  end_date: string;
  create_meeting: boolean;
  meeting_platform: 'zoom' | 'daily';
  create_zoom: boolean;
  zoom_topic_pattern: string;
  zoom_agenda: string;
  zoom_recurring: boolean;
  create_daily: boolean;
  daily_room_pattern: string;
  zoom_passcode: string;
  zoom_waiting_room: boolean;
  zoom_join_before_host: boolean;
  zoom_mute_upon_entry: boolean;
  zoom_require_authentication: boolean;
  zoom_host_video: boolean;
  zoom_participant_video: boolean;
  zoom_audio: string;
  zoom_auto_recording: string;
  is_published: boolean;
  zoom_record_speaker_view: boolean;
  zoom_recording_disclaimer: boolean;
}

/**
 * The calendar days of the series, "YYYY-MM-DD", the same way the page
 * computes them before saving: weekly starts on the chosen weekday on or
 * after the start date; daily adds one day.
 */
export function seriesDays(form: Pick<BulkLessonFormState, 'start_date' | 'is_recurring' | 'recurrence_pattern' | 'weekly_days'>, count: number): string[] {
  if (!form.start_date || !Number.isFinite(count) || count < 1) return [];
  const start = new Date(`${form.start_date}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return [];
  const weekly = form.is_recurring && form.recurrence_pattern === 'weekly';
  if (weekly) {
    const wanted = form.weekly_days[0] ?? start.getUTCDay();
    start.setUTCDate(start.getUTCDate() + ((wanted - start.getUTCDay() + 7) % 7));
  }
  return Array.from({ length: Math.min(count, 50) }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i * (weekly ? 7 : 1));
    return d.toISOString().slice(0, 10);
  });
}

type Step = 'name' | 'dates' | 'meeting';

/**
 * Adding a series of lessons, in three steps: Name, Dates (with a live list
 * of the lessons it will make) and Video meeting. "One lesson" at the top
 * switches to the single-lesson panel.
 */
export function SeriesWizard({
  open,
  onClose,
  form,
  setForm,
  moduleTitle,
  saving,
  onCreate,
  onSwitchToOne,
  lessonTokens,
  zoomTokens,
  insertToken,
  tenantTimezone,
  t,
  direction,
}: {
  open: boolean;
  onClose: () => void;
  form: BulkLessonFormState;
  setForm: (patch: Partial<BulkLessonFormState>) => void;
  moduleTitle: string;
  saving: boolean;
  onCreate: () => void;
  onSwitchToOne: () => void;
  lessonTokens: Token[];
  zoomTokens: Token[];
  insertToken: (current: string, token: string, set: (v: string) => void) => void;
  tenantTimezone: string;
  t: Translate;
  direction: 'ltr' | 'rtl';
}) {
  const isRtl = direction === 'rtl';
  const locale = isRtl ? 'he-IL' : 'en-US';
  const [step, setStep] = useState<Step>('name');
  const [tried, setTried] = useState<Step | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const count = parseInt(form.end_count, 10);
  const weekly = form.recurrence_pattern === 'weekly';
  const days = useMemo(() => seriesDays(form, count), [form, count]);

  const problems: Record<Step, string | null> = {
    name: !form.series_name.trim()
      ? t('lms.builder.series_name_required', 'Series name is required')
      : !form.titlePattern.trim()
        ? t('admin.courses.builder.titlePatternRequired', 'Write how the lessons are named.')
        : null,
    dates: !form.start_date || !form.start_time
      ? t('admin.courses.builder.dateRequired', 'Choose a start date and a time.')
      : !Number.isFinite(count) || count < 1 || count > 50
        ? t('lms.builder.lessons_count_range', 'Please enter a number between 1 and 50')
        : null,
    meeting:
      form.create_meeting && form.meeting_platform === 'zoom' && !form.zoom_topic_pattern.trim()
        ? t('lms.builder.zoom_topic_pattern_required', 'Zoom topic pattern is required when creating Zoom meetings')
        : form.create_meeting && form.meeting_platform === 'daily' && !form.daily_room_pattern.trim()
          ? t('lms.builder.daily_room_pattern_required', 'Daily.co room pattern is required when creating Daily.co rooms')
          : null,
  };
  const steps: { id: Step; label: string }[] = [
    { id: 'name', label: t('admin.courses.builder.stepName', 'Name') },
    { id: 'dates', label: t('admin.courses.builder.stepDates', 'Dates') },
    { id: 'meeting', label: t('admin.courses.builder.stepMeeting', 'Video meeting') },
  ];
  const index = steps.findIndex((s) => s.id === step);

  const goTo = (target: Step) => {
    const to = steps.findIndex((s) => s.id === target);
    // Going forward checks every step on the way.
    for (let i = index; i < to; i++) {
      if (problems[steps[i].id]) {
        setStep(steps[i].id);
        setTried(steps[i].id);
        return;
      }
    }
    setTried(null);
    setStep(target);
  };
  const next = () => {
    if (problems[step]) return setTried(step);
    if (index < steps.length - 1) return goTo(steps[index + 1].id);
    if (problems.name) return goTo('name');
    if (problems.dates) return goTo('dates');
    onCreate();
  };
  const close = () => {
    setStep('name');
    setTried(null);
    onClose();
  };

  const weekday = (d: number) => new Date(Date.UTC(2024, 0, 7 + d)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
  const dayLabel = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  /** The chosen weekday is the start date's own. */
  const fromStartDate = !!form.start_date && form.weekly_days[0] === new Date(`${form.start_date}T00:00:00Z`).getUTCDay();
  const lessonName = (i: number, iso: string) =>
    form.titlePattern
      .replace(/\{n\}/g, String(i + 1))
      .replace(/\{series_name\}/g, form.series_name)
      .replace(/\{date\}/g, iso);
  const chip = (on: boolean) =>
    `min-h-[40px] min-w-[44px] rounded-full border px-3 text-sm font-semibold transition-colors ${
      on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'
    }`;
  const problemNote = tried === step && problems[step] ? <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{problems[step]}</p> : null;

  return (
    <SidePanel
      open={open}
      onClose={close}
      busy={saving}
      wide
      title={t('admin.courses.builder.addLessons', 'Add lessons')}
      description={t('admin.courses.builder.toModule', 'To the module "{title}".').replace('{title}', moduleTitle)}
      top={
        <Segmented
          label={t('admin.courses.builder.howMany', 'How many lessons')}
          value="series"
          onChange={(v) => v === 'one' && onSwitchToOne()}
          options={[
            { value: 'one', label: t('admin.courses.builder.oneLessonOption', 'One lesson') },
            { value: 'series', label: t('admin.courses.builder.seriesOption', 'A series of lessons') },
          ]}
        />
      }
      footer={
        <>
          <button type="button" onClick={next} disabled={saving} className={panelPrimary}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {index < steps.length - 1
              ? t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', steps[index + 1].label)
              : saving
                ? t('lms.lesson.creating', 'Creating...')
                : t('admin.courses.builder.createNLessons', 'Create {n} lessons').replace('{n}', String(count || 0))}
          </button>
          <button type="button" onClick={() => (index === 0 ? close() : setStep(steps[index - 1].id))} disabled={saving} className={panelSecondary}>
            {index === 0 ? t('common.cancel', 'Cancel') : t('admin.notifications.wizard.back', 'Back')}
          </button>
        </>
      }
    >
          <div className="space-y-4" dir={direction}>
            <nav aria-label={t('admin.courses.builder.steps', 'Steps')} className="flex flex-wrap gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  aria-current={s.id === step ? 'step' : undefined}
                  className={`inline-flex min-h-[36px] items-center rounded-full border px-3 text-[13px] font-semibold ${
                    s.id === step ? 'border-primary bg-primary text-primary-foreground' : i < index ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card'
                  }`}
                >
                  {i < index ? '✓ ' : `${i + 1} `}
                  {s.label}
                </button>
              ))}
            </nav>

            {step === 'name' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="series-name">{t('lms.lesson.series_name_label', 'Series Name')} *</Label>
                  <Input
                    id="series-name"
                    value={form.series_name}
                    onChange={(e) => setForm({ series_name: e.target.value })}
                    placeholder={t('lms.lesson.series_name_placeholder', 'e.g., Introduction to Parenting')}
                    aria-invalid={tried === 'name' && !form.series_name.trim()}
                  />
                  <p className="text-xs text-muted-foreground">{t('lms.lesson.series_name_help', 'A name for the whole series')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="series-pattern">{t('lms.lesson.title_pattern_label', 'Lesson Title Pattern')} *</Label>
                  <Input id="series-pattern" value={form.titlePattern} onChange={(e) => setForm({ titlePattern: e.target.value })} />
                  <TokenInserter
                    tokens={lessonTokens}
                    onInsertToken={(token) => insertToken(form.titlePattern, token, (v) => setForm({ titlePattern: v }))}
                    direction={direction}
                    isRtl={isRtl}
                    t={t}
                  />
                </div>
                {problemNote}
              </div>
            )}

            {step === 'dates' && (
              <div className="space-y-3">
                <section className="space-y-3 rounded-xl border border-border p-3.5" aria-labelledby="series-when">
                  <h3 id="series-when" className="text-xs font-bold tracking-wide text-muted-foreground">
                    {t('admin.courses.builder.groupStart', 'When it starts')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1fr_1.3fr]">
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="series-start">{t('admin.courses.builder.startFrom', 'Starting from')} *</Label>
                      <Input
                        id="series-start"
                        type="date"
                        value={form.start_date}
                        aria-invalid={tried === 'dates' && !form.start_date}
                        onChange={(e) => {
                          const v = e.target.value;
                          // The start date's weekday becomes the chosen day; the chips still let you pick another.
                          setForm(v ? { start_date: v, weekly_days: [new Date(`${v}T00:00:00Z`).getUTCDay()] } : { start_date: v });
                        }}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="series-time">{t('admin.courses.builder.atTime', 'At')} *</Label>
                      <Input
                        id="series-time"
                        type="time"
                        value={form.start_time}
                        aria-invalid={tried === 'dates' && !form.start_time}
                        onChange={(e) => setForm({ start_time: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 min-w-0 space-y-1.5 sm:col-span-1">
                      <Label>{t('lms.lesson.timezone_label', 'Timezone')}</Label>
                      <TimezonePicker value={form.timezone} onChange={(v) => setForm({ timezone: v })} tenantTimezone={tenantTimezone} locale={locale} t={t} />
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1 space-y-3">
                    <section className="space-y-3 rounded-xl border border-border p-3.5" aria-labelledby="series-repeat">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 id="series-repeat" className="text-xs font-bold tracking-wide text-muted-foreground">
                          {t('admin.courses.builder.groupRepeat', 'Repeats')}
                        </h3>
                        <div className={joinedBar} role="group" aria-label={t('admin.courses.builder.howOften', 'How often')}>
                          <button type="button" aria-pressed={weekly} className={`${joinedSegment(weekly)} min-h-10`} onClick={() => setForm({ recurrence_pattern: 'weekly', is_recurring: true })}>
                            {t('admin.courses.builder.everyWeek', 'Every week')}
                          </button>
                          <button type="button" aria-pressed={!weekly} className={`${joinedSegment(!weekly)} min-h-10`} onClick={() => setForm({ recurrence_pattern: 'daily', is_recurring: true })}>
                            {t('admin.courses.builder.everyDay', 'Every day')}
                          </button>
                        </div>
                      </div>
                      {weekly && (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-7 overflow-hidden rounded-full border border-border bg-card [&>*+*]:border-s [&>*+*]:border-border" role="group" aria-label={t('lms.lesson.day_of_week_label', 'Day of Week')}>
                            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                              <button key={d} type="button" aria-pressed={form.weekly_days[0] === d} className={`${joinedSegment(form.weekly_days[0] === d)} min-h-10 min-w-0 !px-1`} onClick={() => setForm({ weekly_days: [d] })}>
                                {weekday(d)}
                              </button>
                            ))}
                          </div>
                          {fromStartDate && (
                            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <Check className="h-3.5 w-3.5" aria-hidden />
                              {t('admin.courses.builder.dayFromDate', 'Picked from the start date')}
                            </p>
                          )}
                        </div>
                      )}
                    </section>

                    <section className="space-y-3 rounded-xl border border-border p-3.5">
                      <div className="space-y-1.5">
                        <Label>{t('admin.courses.builder.lengthEach', 'Length of each lesson')}</Label>
                        <DurationPicker value={form.duration_minutes} onChange={(v) => setForm({ duration_minutes: v })} t={t} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="series-count">{t('admin.courses.builder.howManyLessons', 'How many lessons')} *</Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={chip(false)}
                            aria-label={t('admin.courses.builder.fewer', 'Fewer')}
                            onClick={() => setForm({ end_count: String(Math.max(1, (count || 1) - 1)) })}
                          >
                            <Minus className="mx-auto h-4 w-4" aria-hidden />
                          </button>
                          <Input
                            id="series-count"
                            type="number"
                            min={1}
                            max={50}
                            value={form.end_count}
                            onChange={(e) => setForm({ end_count: e.target.value })}
                            className="w-20 text-center font-bold"
                          />
                          <button
                            type="button"
                            className={chip(false)}
                            aria-label={t('admin.courses.builder.more', 'More')}
                            onClick={() => setForm({ end_count: String(Math.min(50, (count || 0) + 1)) })}
                          >
                            <Plus className="mx-auto h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </section>
                    {problemNote}
                  </div>

                  <aside className="rounded-xl border border-border p-3 md:sticky md:top-0 md:w-60 md:shrink-0" aria-live="polite">
                    <div className="text-sm font-bold text-primary">{t('admin.courses.builder.willCreateLessons', 'These lessons will be created')}</div>
                    {days.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">{t('admin.courses.builder.pickDates', 'Choose a start date to see them.')}</p>
                    ) : (
                      <>
                        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
                          {t('admin.courses.builder.seriesRange', '{n} lessons · {from} to {to}')
                            .replace('{n}', String(days.length))
                            .replace('{from}', shortDay(days[0]))
                            .replace('{to}', shortDay(days[days.length - 1]))}
                        </p>
                        <ol className="max-h-96 overflow-y-auto">
                          {days.map((iso, i) => (
                            <li key={iso} className="relative grid grid-cols-[22px_1fr] gap-2 py-1.5">
                              {i < days.length - 1 && <span className="absolute start-[10.5px] top-8 -bottom-1 w-px bg-border" aria-hidden />}
                              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary" aria-hidden>
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold">{lessonName(i, iso) || `#${i + 1}`}</div>
                                <div className="text-xs tabular-nums text-muted-foreground">
                                  {dayLabel(iso)} · {form.start_time}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </aside>
                </div>
              </div>
            )}

            {step === 'meeting' && (
              <div className="space-y-4">
                <SwitchRow
                  title={t('lms.lesson.bulk_meeting_title', 'Create video meetings')}
                  hint={t('lms.lesson.meeting_integration_desc', 'Create a video meeting automatically for this lesson')}
                  checked={form.create_meeting}
                  onChange={(checked) =>
                    setForm({ create_meeting: checked, create_zoom: checked && form.meeting_platform === 'zoom', create_daily: checked && form.meeting_platform === 'daily' })
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
                          onClick={() => setForm({ meeting_platform: p, create_zoom: p === 'zoom', create_daily: p === 'daily' })}
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
                        <Label htmlFor="daily-pattern">{t('lms.lesson.daily_room_pattern_label', 'Room Name Pattern')} *</Label>
                        <Input id="daily-pattern" value={form.daily_room_pattern} onChange={(e) => setForm({ daily_room_pattern: e.target.value })} />
                        <TokenInserter
                          tokens={lessonTokens}
                          onInsertToken={(token) => insertToken(form.daily_room_pattern, token, (v) => setForm({ daily_room_pattern: v }))}
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
                          <Label htmlFor="zoom-pattern">{t('lms.lesson.zoom_pattern_label', 'Zoom Meeting Name Pattern')} *</Label>
                          <Input id="zoom-pattern" value={form.zoom_topic_pattern} onChange={(e) => setForm({ zoom_topic_pattern: e.target.value })} />
                          <TokenInserter
                            tokens={zoomTokens}
                            onInsertToken={(token) => insertToken(form.zoom_topic_pattern, token, (v) => setForm({ zoom_topic_pattern: v }))}
                            direction={direction}
                            isRtl={isRtl}
                            t={t}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="zoom-agenda-series">{t('lms.lesson.zoom_agenda_label', 'Zoom Meeting Agenda (Optional)')}</Label>
                          <Textarea id="zoom-agenda-series" rows={2} value={form.zoom_agenda} onChange={(e) => setForm({ zoom_agenda: e.target.value })} />
                        </div>
                        <SwitchRow
                          title={t('lms.lesson.zoom_recurring_label', 'Create as recurring Zoom meeting')}
                          hint={t('lms.lesson.zoom_recurring_help', 'One Zoom link for the whole series')}
                          checked={form.zoom_recurring}
                          onChange={(v) => setForm({ zoom_recurring: v })}
                        />
                        <button
                          type="button"
                          aria-expanded={advancedOpen}
                          onClick={() => setAdvancedOpen((v) => !v)}
                          className="inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-card px-4 text-sm font-semibold hover:bg-muted"
                        >
                          {t('admin.courses.builder.zoomAdvanced', 'Advanced Zoom settings (passcode, waiting room, recording)')}
                          <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                        {advancedOpen && (
                          <ZoomSettingsPanel
                            settings={form as unknown as ZoomSettings}
                            onChange={(patch) => setForm(patch as Partial<BulkLessonFormState>)}
                            t={t}
                            isRtl={isRtl}
                            direction={direction}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                <SwitchRow
                  title={t('lms.lesson.publish_title', 'Publish Lessons')}
                  hint={t('lms.lesson.publish_desc', 'Make lessons visible to clients immediately')}
                  checked={form.is_published}
                  onChange={(v) => setForm({ is_published: v })}
                />
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  {t('lms.lesson.preview_text', 'This will create {count} lessons {pattern} starting from {date} at {time}{meeting}')
                    .replace('{count}', String(count || 0))
                    .replace('{pattern}', weekly ? t('lms.lesson.preview_weekly', 'weekly') : t('lms.lesson.preview_daily', 'daily'))
                    .replace('{date}', days[0] ? dayLabel(days[0]) : form.start_date)
                    .replace('{time}', form.start_time)
                    .replace(
                      '{meeting}',
                      form.create_meeting
                        ? form.meeting_platform === 'daily'
                          ? t('lms.lesson.preview_with_daily', ', each with a Daily.co room')
                          : t('lms.lesson.preview_with_zoom', ', each with a Zoom meeting')
                        : '',
                    )}
                </p>
                {problemNote}
              </div>
            )}
          </div>
    </SidePanel>
  );
}
