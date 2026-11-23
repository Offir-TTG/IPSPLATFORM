'use client';

import { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
} from 'lucide-react';
import { formatInTimezone, resolveDisplayTimezone } from '@/lib/datetime/timezone';
import { lengthText, meetingOf, type BuilderLesson, type BuilderModule, type Translate } from './types';
import { InlineConfirm } from './SidePanel';

/** How many lessons a module shows before "Show N more". */
const SHOWN = 5;

const chip = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold';
const chipGrey = `${chip} bg-muted text-foreground/75`;
const chipBlue = `${chip} bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300`;
const chipGreen = `${chip} bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300`;
const chipAmber = `${chip} bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300`;
const statusPill = 'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
const iconButton = 'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground';

export interface LessonActions {
  onOpen: (lesson: BuilderLesson) => void;
  onEditContent: (lesson: BuilderLesson) => void;
  onOpenMeeting: (lessonId: string) => void;
  onCreateMeeting: (lessonId: string, platform: 'zoom' | 'daily') => void;
  onSyncRecording: (lessonId: string) => void;
  onTogglePublish: (lesson: BuilderLesson) => void;
  onDelete: (lessonId: string) => void;
  creatingMeetingFor: string | null;
  syncingRecordingFor: string | null;
  /** The lesson whose "Delete?" question is showing under its row. */
  pendingDeleteLessonId: string | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleting: boolean;
}

/**
 * One module of the course outline: a header (drag, fold, name, badges,
 * menu) and its lessons as short rows, then "Add lessons".
 */
export function SortableModule({
  module,
  actions,
  onToggleExpand,
  onAddLessons,
  onEdit,
  onDelete,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  deleting,
  t,
  isRtl,
  tenantTimezone,
}: {
  module: BuilderModule;
  actions: LessonActions;
  onToggleExpand: () => void;
  onAddLessons: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** "Delete this module?" is showing under its header. */
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleting: boolean;
  t: Translate;
  isRtl: boolean;
  tenantTimezone: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const [showAll, setShowAll] = useState(false);
  const lessons = module.lessons ?? [];
  const minutes = lessons.reduce((s, l) => s + (l.duration || 0), 0);
  const unpublished = lessons.filter((l) => !l.is_published).length;
  const shown = showAll ? lessons : lessons.slice(0, SHOWN);
  const Closed = isRtl ? ChevronLeft : ChevronRight;
  const ChevronEnd = Closed;

  const summary = [
    lessons.length === 1
      ? t('admin.courses.builder.oneLesson', '1 lesson')
      : t('admin.courses.builder.lessonCount', '{n} lessons').replace('{n}', String(lessons.length)),
    minutes > 0 ? lengthText(minutes, t) : '',
    lessons.length > 0
      ? unpublished === 0
        ? t('admin.courses.builder.allPublished', 'all published')
        : t('admin.courses.builder.someDrafts', '{n} not published').replace('{n}', String(unpublished))
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border border-border bg-card ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className={`flex items-center gap-1.5 bg-primary/[0.04] px-2 py-2 ${module.isExpanded ? 'rounded-t-2xl border-b border-border' : 'rounded-2xl'}`}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t('admin.courses.builder.dragModule', 'Drag {title}').replace('{title}', module.title)}
          className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={!!module.isExpanded}
          aria-label={module.isExpanded ? t('admin.courses.builder.fold', 'Fold') : t('admin.courses.builder.unfold', 'Open')}
          className={iconButton}
        >
          {module.isExpanded ? <ChevronDown className="h-4 w-4" aria-hidden /> : <Closed className="h-4 w-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('admin.courses.builder.openModule', 'Open {title}').replace('{title}', module.title)}
          className="group/m flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-start hover:bg-primary/[0.04]"
        >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-bold [overflow-wrap:anywhere] group-hover/m:underline">{module.title}</span>
            {!module.is_published && <span className={chipAmber}>{t('lms.builder.draft', 'Draft')}</span>}
            {module.is_optional && <span className={chipGrey}>{t('lms.builder.optional', 'Optional')}</span>}
          </div>
          <p className="text-[13px] text-muted-foreground">{summary}</p>
        </div>
        <ChevronEnd className="me-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </div>

      {confirmingDelete && (
        <div className="p-2">
          <InlineConfirm
            text={t('lms.module.delete_confirmation', 'Are you sure you want to delete this module and all its lessons? This action cannot be undone.')}
            confirmLabel={deleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            cancelLabel={t('common.cancel', 'Cancel')}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
            busy={deleting}
          />
        </div>
      )}

      {module.isExpanded && (
        <div className="p-1.5">
          {lessons.length > 0 ? (
            <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {shown.map((lesson) => (
                <SortableLesson key={lesson.id} lesson={lesson} actions={actions} t={t} isRtl={isRtl} tenantTimezone={tenantTimezone} />
              ))}
            </SortableContext>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t('lms.builder.no_lessons', 'No lessons yet')}</p>
          )}
          {lessons.length > SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex min-h-[40px] w-full items-center justify-center text-sm font-semibold text-primary hover:underline"
            >
              {showAll
                ? t('admin.courses.builder.showLess', 'Show fewer lessons')
                : t('admin.courses.builder.showMore', 'Show {n} more lessons').replace('{n}', String(lessons.length - SHOWN))}
            </button>
          )}
          <button
            type="button"
            onClick={onAddLessons}
            className="m-1.5 flex min-h-[48px] w-[calc(100%-0.75rem)] items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-primary/30 text-sm font-semibold text-primary hover:bg-primary/[0.04]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('admin.courses.builder.addLessonsHint', 'Add lessons (one or a series)')}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * One lesson as a short row: a date tile, the name, badges (length,
 * meeting, recording, content), the one quick action it needs most,
 * Published or Draft, and a menu with everything else. Clicking the
 * name opens the lesson panel.
 */
function SortableLesson({
  lesson,
  actions,
  t,
  isRtl,
  tenantTimezone,
}: {
  lesson: BuilderLesson;
  actions: LessonActions;
  t: Translate;
  isRtl: boolean;
  tenantTimezone: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const locale = isRtl ? 'he-IL' : 'en-US';
  const tz = resolveDisplayTimezone({ lessonTz: lesson.timezone, tenantTz: tenantTimezone });
  const meeting = meetingOf(lesson);
  const topics = lesson.lesson_topics?.length ?? 0;
  const hasRecording = !!lesson.zoom_session?.has_recording;
  const past = !!lesson.start_time && new Date(lesson.start_time).getTime() + (lesson.duration || 60) * 60000 < Date.now();
  const meetingName = meeting === 'daily' ? t('lms.builder.platform_daily', 'Daily.co') : t('lms.builder.platform_zoom', 'Zoom');
  const ChevronEnd = isRtl ? ChevronLeft : ChevronRight;

  const contentLabel =
    topics === 0
      ? t('admin.courses.builder.noContent', 'No content yet')
      : topics === 1
        ? t('admin.courses.builder.oneItem', '1 content item')
        : t('admin.courses.builder.items', '{n} content items').replace('{n}', String(topics));

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'opacity-50' : ''}>
    <div className="group relative flex items-center gap-2 rounded-xl border border-transparent px-1.5 py-2 hover:border-border hover:bg-primary/[0.03] sm:gap-3">
      <button
        type="button"
        onClick={() => actions.onOpen(lesson)}
        aria-label={t('admin.courses.builder.openLesson', 'Open {title}').replace('{title}', lesson.title)}
        className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      />
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('admin.courses.builder.dragLesson', 'Drag {title}').replace('{title}', lesson.title)}
        className="relative z-10 grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground/70 hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>

      {/* Date tile: day of the week, date, time, in the lesson's own time zone */}
      <div className={`w-16 shrink-0 rounded-xl py-1.5 text-center leading-tight ${past ? 'bg-muted' : 'bg-primary/10'}`}>
        {lesson.start_time ? (
          <>
            <div className={`text-xs font-semibold ${past ? 'text-muted-foreground' : 'text-primary'}`}>
              {formatInTimezone(lesson.start_time, tz, { weekday: 'short' }, locale)}
            </div>
            <div className="text-[17px] font-extrabold tabular-nums">
              {formatInTimezone(lesson.start_time, tz, { day: 'numeric', month: 'numeric' }, locale)}
            </div>
            <div className="text-xs tabular-nums text-muted-foreground">
              {formatInTimezone(lesson.start_time, tz, { hour: '2-digit', minute: '2-digit', hour12: false }, locale)}
            </div>
          </>
        ) : (
          <div className="py-2 text-xs text-muted-foreground">{t('admin.courses.builder.noDate', 'No date')}</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold [overflow-wrap:anywhere] group-hover:underline">{lesson.title}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {lesson.duration ? (
            <span className={chipGrey}>{t('admin.courses.builder.minutes', '{n} min').replace('{n}', String(lesson.duration))}</span>
          ) : null}
          {meeting ? <span className={chipBlue}>{meetingName}</span> : <span className={chipGrey}>{t('admin.courses.builder.noMeeting', 'No video meeting')}</span>}
          {meeting === 'zoom' && hasRecording && (
            <span className={chipGreen}>
              <CheckCircle className="h-3 w-3" aria-hidden />
              {t('lms.builder.recorded', 'Recorded')}
            </span>
          )}
          {meeting === 'zoom' && past && !hasRecording && <span className={chipAmber}>{t('admin.courses.builder.waitingRecording', 'Waiting for recording')}</span>}
          <span className={topics === 0 ? chipAmber : chipGrey}>{contentLabel}</span>
        </div>
      </div>

      <span
        className={`${statusPill} ${lesson.is_published ? 'bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'}`}
      >
        {lesson.is_published ? t('lms.builder.published', 'Published') : t('lms.builder.draft', 'Draft')}
      </span>

      <ChevronEnd className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </div>
    {actions.pendingDeleteLessonId === lesson.id && (
      <div className="px-1.5 pb-2">
        <InlineConfirm
          text={t('admin.courses.builder.deleteLessonConfirm', 'Delete "{title}"? This cannot be undone.').replace('{title}', lesson.title)}
          confirmLabel={actions.deleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
          cancelLabel={t('common.cancel', 'Cancel')}
          onConfirm={actions.onConfirmDelete}
          onCancel={actions.onCancelDelete}
          busy={actions.deleting}
        />
      </div>
    )}
    </div>
  );
}
