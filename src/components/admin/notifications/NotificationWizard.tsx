'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, Building2, BookOpen, Check, GraduationCap, Loader2, Mail, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type {
  CreateNotificationRequest,
  NotificationCategory,
  NotificationDisplayStyle,
  NotificationPriority,
  NotificationScope,
} from '@/types/notifications';
import { CATEGORIES, CATEGORY_ICON, PRIORITIES, PRIORITY_TONE } from './notificationStyle';
import { PortalPreview, StyleThumbnail } from './PortalPreview';
import { TargetPicker } from './TargetPicker';
import { QuickPills, SaveBar, saveBarText } from './kit';

type T = (key: string, fallback?: string) => string;

export type WizardUser = { id: string; first_name: string; last_name: string; email: string };
/** Courses come back with `title`, programs with `name`. */
export type WizardItem = { id: string; title?: string | null; name?: string | null };
const itemLabel = (item: WizardItem) => item.title || item.name || item.id;

type StepId = 'who' | 'importance' | 'appearance' | 'words' | 'button' | 'delivery' | 'review';
const STEP_IDS: StepId[] = ['who', 'importance', 'appearance', 'words', 'button', 'delivery', 'review'];

const TITLE_MAX = 200;
const MESSAGE_MAX = 1000;
const LIST_PATH = '/admin/notifications';

const inputClass =
  'h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

/**
 * Sending a notification, step by step, like the Messages editor on the
 * IParentingSchool site: Who, Importance, Words, Button, Delivery, Check
 * and send, with a live picture of the portal beside it.
 *
 * It sends exactly what the old form sent, to the same address
 * (POST /api/notifications), with the same choices and the same checks.
 */
export function NotificationWizard({
  users,
  courses,
  programs,
  t,
  direction,
}: {
  users: WizardUser[];
  courses: WizardItem[];
  programs: WizardItem[];
  t: T;
  direction: 'ltr' | 'rtl';
}) {
  const router = useRouter();

  // ── What's being sent (the same fields as the old form) ──
  const [scope, setScope] = useState<NotificationScope>('tenant');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [category, setCategory] = useState<NotificationCategory>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'he'>('he');
  const [displayStyle, setDisplayStyle] = useState<NotificationDisplayStyle>('list');

  // How many people a course or program choice reaches, to warn before
  // sending to nobody (for example a program with no products linked yet).
  const [audience, setAudience] = useState<{ key: string; counts: Record<string, number>; total: number } | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const audienceIds = scope === 'course' ? selectedCourseIds : scope === 'program' ? selectedProgramIds : [];
  const audienceKey = `${scope}:${[...audienceIds].sort().join(',')}`;
  useEffect(() => {
    if ((scope !== 'course' && scope !== 'program') || audienceIds.length === 0) return;
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/notifications/audience?scope=${scope}&ids=${encodeURIComponent(audienceIds.join(','))}`,
        );
        if (!response.ok) return;
        const data = await response.json();
        if (alive) setAudience({ key: audienceKey, counts: data.counts ?? {}, total: data.total ?? 0 });
      } catch {
        // No count, no warning: sending still works as before.
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // audienceKey sums up scope and the chosen ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);
  const currentAudience = audience && audience.key === audienceKey ? audience : null;
  const reachesNobody = !!currentAudience && audienceIds.length > 0 && currentAudience.total === 0;

  const [step, setStep] = useState<StepId>('who');
  const [problem, setProblem] = useState<{ step: StepId; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const STEP_LABEL: Record<StepId, string> = {
    who: t('admin.notifications.wizard.stepWho', 'Who'),
    importance: t('admin.notifications.wizard.stepImportance', 'Importance'),
    appearance: t('admin.notifications.wizard.stepAppearance', 'How it appears'),
    words: t('admin.notifications.wizard.stepWords', 'Words'),
    button: t('admin.notifications.wizard.stepButton', 'Button'),
    delivery: t('admin.notifications.wizard.stepDelivery', 'Delivery'),
    review: t('admin.notifications.wizard.stepReview', 'Check and send'),
  };
  const index = STEP_IDS.indexOf(step);

  // ── Checks, the same as the old form, shown by the box on its step ──
  const problemIn = useCallback(
    (id: StepId): string | null => {
      if (id === 'who') {
        if (scope === 'individual' && selectedUserIds.length === 0)
          return t('admin.notifications.errors.userRequired', 'Please select at least one user');
        if (scope === 'course' && selectedCourseIds.length === 0)
          return t('admin.notifications.errors.courseRequired', 'Please select at least one course');
        if (scope === 'program' && selectedProgramIds.length === 0)
          return t('admin.notifications.errors.programRequired', 'Please select at least one program');
      }
      if (id === 'words') {
        if (!title.trim()) return t('admin.notifications.errors.titleRequired', 'Title is required');
        if (!message.trim()) return t('admin.notifications.errors.messageRequired', 'Message is required');
      }
      return null;
    },
    [scope, selectedUserIds, selectedCourseIds, selectedProgramIds, title, message, t],
  );

  /** Shows the step with something missing, and puts the cursor in the
   *  first empty box on it. */
  const stopAt = (id: StepId, text: string) => {
    setStep(id);
    setProblem({ step: id, text });
    if (id === 'words') {
      const box = !title.trim() ? 'n-title' : 'n-message';
      window.setTimeout(() => document.getElementById(box)?.focus(), 0);
    }
  };

  const goTo = (target: StepId) => {
    // Moving forward stops at the first step with something missing.
    const to = STEP_IDS.indexOf(target);
    for (let i = index; i < to; i++) {
      const found = problemIn(STEP_IDS[i]);
      if (found) {
        stopAt(STEP_IDS[i], found);
        return;
      }
    }
    setProblem(null);
    setStep(target);
    document.getElementById('notification-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // A box being fixed takes its red note away.
  useEffect(() => {
    if (problem && !problemIn(problem.step)) setProblem(null);
  }, [problem, problemIn]);

  // Once the Words step was stopped, each empty box says so under itself.
  const wordsChecked = problem?.step === 'words';
  const titleMissing = wordsChecked && !title.trim();
  const messageMissing = wordsChecked && !message.trim();

  // ── Leaving with something typed asks first ──
  const dirty =
    !!title.trim() ||
    !!message.trim() ||
    !!actionUrl.trim() ||
    !!actionLabel.trim() ||
    selectedUserIds.length + selectedCourseIds.length + selectedProgramIds.length > 0;
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const leaving = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!leaving.current) e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      if (link.getAttribute('href')?.startsWith('#')) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(link.href);
    };
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
  const leave = () => {
    if (!leaveTo) return;
    leaving.current = true;
    const url = new URL(leaveTo, window.location.href);
    setLeaveTo(null);
    if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
    else window.location.href = url.href;
  };

  // ── Send: the same request as the old form ──
  const send = async (confirmedEmpty = false) => {
    for (const id of STEP_IDS) {
      const found = problemIn(id);
      if (found) {
        stopAt(id, found);
        return;
      }
    }
    // Nobody would get it: ask first.
    if (reachesNobody && !confirmedEmpty) {
      setConfirmEmpty(true);
      return;
    }
    setConfirmEmpty(false);
    setSending(true);
    try {
      const payload: CreateNotificationRequest = {
        scope,
        category,
        priority,
        title: title.trim(),
        message: message.trim(),
      };
      if (scope === 'individual') payload.target_user_ids = selectedUserIds;
      if (scope === 'course') payload.target_course_ids = selectedCourseIds;
      if (scope === 'program') payload.target_program_ids = selectedProgramIds;
      if (actionUrl.trim()) payload.action_url = actionUrl.trim();
      if (actionLabel.trim()) payload.action_label = actionLabel.trim();
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
      const channels: ('in_app' | 'email')[] = ['in_app'];
      if (emailEnabled) channels.push('email');
      payload.channels = channels;
      if (emailEnabled) payload.email_language = emailLanguage;
      // Left out for "only in the list", which is how sending always worked.
      if (displayStyle !== 'list') payload.display_style = displayStyle;

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to send notification');
      }
      const result = await response.json();
      const count = result.count || 1;
      toast.success(
        t('admin.notifications.sentSuccessfully', `Successfully sent ${count} notification(s)`).replace('{count}', String(count)),
      );
      leaving.current = true;
      router.push(LIST_PATH);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message || t('admin.notifications.errorSending', 'Failed to send notification'));
      setSending(false);
    }
  };

  // ── Words for the summary ──
  const userOptions = useMemo(
    () => users.map((u) => ({ id: u.id, label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email, hint: u.email })),
    [users],
  );
  const courseOptions = useMemo(() => courses.map((c) => ({ id: c.id, label: itemLabel(c) })), [courses]);
  const programOptions = useMemo(() => programs.map((p) => ({ id: p.id, label: itemLabel(p) })), [programs]);
  const namesOf = (ids: string[], options: { id: string; label: string }[]) =>
    ids.map((id) => options.find((o) => o.id === id)?.label ?? id).join(', ');
  const whoSummary =
    scope === 'tenant'
      ? t('admin.notifications.tenant', 'All Users')
      : scope === 'individual'
        ? namesOf(selectedUserIds, userOptions)
        : scope === 'course'
          ? namesOf(selectedCourseIds, courseOptions)
          : namesOf(selectedProgramIds, programOptions);

  // The audience count and, for choices nobody is enrolled in, a warning.
  const audienceOptions = scope === 'course' ? courseOptions : programOptions;
  const emptyNames = currentAudience
    ? audienceIds.filter((id) => (currentAudience.counts[id] ?? 0) === 0).map((id) => audienceOptions.find((o) => o.id === id)?.label ?? id)
    : [];
  const reachText = currentAudience
    ? t('admin.notifications.wizard.reachesPeople', 'This reaches {count} people with an active enrollment.').replace('{count}', String(currentAudience.total))
    : null;
  const audienceNote =
    (scope === 'course' || scope === 'program') && audienceIds.length > 0 && currentAudience ? (
      emptyNames.length > 0 ? (
        <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold">
            {reachesNobody
              ? t('admin.notifications.wizard.nobodyTitle', 'Nobody will get this notification')
              : t('admin.notifications.wizard.someEmptyTitle', 'Some of your choices have nobody enrolled')}
          </p>
          <p className="mt-1">
            {t('admin.notifications.wizard.nobodyText', 'No one has an active enrollment in: {names}. Only people enrolled through a product linked to it see the notification.').replace(
              '{names}',
              emptyNames.join(', '),
            )}
          </p>
          {!reachesNobody && reachText && <p className="mt-1">{reachText}</p>}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{reachText}</p>
      )
    ) : null;

  const styleOptions: Array<{ value: NotificationDisplayStyle; label: string; text: string }> = [
    {
      value: 'list',
      label: t('admin.notifications.wizard.styleList', 'Only in the list'),
      text: t('admin.notifications.wizard.styleListText', 'In their Notifications page and bell. Important and urgent ones also pop up briefly, as before.'),
    },
    {
      value: 'toast',
      label: t('admin.notifications.wizard.styleToast', 'Pop-up in the corner'),
      text: t('admin.notifications.wizard.styleToastText', 'A small card at the bottom of the screen, on any portal page.'),
    },
    {
      value: 'top_bar',
      label: t('admin.notifications.wizard.styleTopBar', 'Bar at the top'),
      text: t('admin.notifications.wizard.styleTopBarText', 'A coloured bar above the portal, on every page, until they close it.'),
    },
    {
      value: 'home_card',
      label: t('admin.notifications.wizard.styleHomeCard', 'Card on the home page'),
      text: t('admin.notifications.wizard.styleHomeCardText', 'At the top of their home page until they close it.'),
    },
    {
      value: 'modal',
      label: t('admin.notifications.wizard.styleModal', 'Pop-up window'),
      text: t('admin.notifications.wizard.styleModalText', 'In the middle of the screen when they next open the portal.'),
    },
  ];
  const styleLabel = (s: NotificationDisplayStyle) => styleOptions.find((o) => o.value === s)?.label ?? s;

  const priorityLabel = (p: NotificationPriority) => t(`admin.notifications.priority.${p}`, p);
  const categoryLabel = (c: NotificationCategory) => t(`admin.notifications.categories.${c}`, c);
  const popsUp = priority === 'high' || priority === 'urgent';

  const errorFor = (id: StepId) =>
    problem?.step === id ? (
      <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">
        {problem.text}
      </p>
    ) : null;

  const Choice = ({
    on,
    onClick,
    icon,
    title: label,
    text,
  }: {
    on: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    title: string;
    text: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-start transition-colors ${
        on ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </button>
  );

  const StepTitle = ({ title: heading, text }: { title: string; text: string }) => (
    <div className="mb-5">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );

  return (
    <div id="notification-wizard" dir={direction} className="scroll-mt-4 pb-28">
      {/* Steps */}
      <header className="mb-4 rounded-md border border-border bg-card px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-primary">
            {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}')
              .replace('{n}', String(index + 1))
              .replace('{total}', String(STEP_IDS.length))}
          </span>
          <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>
          {STEP_IDS.map((id, i) => (
            <i key={id} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-primary' : 'bg-primary/15'}`} />
          ))}
        </div>
        <ol className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {STEP_IDS.map((id, i) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(id)}
                aria-current={id === step ? 'step' : undefined}
                className={`inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${
                  id === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i < index
                      ? 'border-primary/30 bg-primary/10 text-primary hover:border-primary/60'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span className="opacity-70">{i + 1}</span>
                {STEP_LABEL[id]}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-xl border border-border bg-card p-5">
          {/* 1 · Who */}
          <section hidden={step !== 'who'}>
            <StepTitle
              title={t('admin.notifications.wizard.whoTitle', 'Who gets it?')}
              text={t('admin.notifications.wizard.whoText', 'Everyone you choose sees it in their portal.')}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['tenant', Building2, t('admin.notifications.tenant', 'All Users'), t('admin.notifications.wizard.whoTenant', 'All clients and parents')],
                  ['individual', Users, t('admin.notifications.individual', 'Clients'), t('admin.notifications.wizard.whoIndividual', 'Pick people by name')],
                  ['course', BookOpen, t('admin.notifications.course', 'Courses'), t('admin.notifications.wizard.whoCourse', 'Everyone enrolled in them')],
                  ['program', GraduationCap, t('admin.notifications.program', 'Programs'), t('admin.notifications.wizard.whoProgram', 'Everyone enrolled in them')],
                ] as const
              ).map(([value, Icon, label, text]) => (
                <Choice
                  key={value}
                  on={scope === value}
                  onClick={() => {
                    setScope(value);
                    setSelectedUserIds([]);
                    setSelectedCourseIds([]);
                    setSelectedProgramIds([]);
                  }}
                  icon={<Icon className="h-5 w-5 text-primary" />}
                  title={label}
                  text={text}
                />
              ))}
            </div>
            {scope !== 'tenant' && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">
                  {scope === 'individual'
                    ? t('admin.notifications.selectUsers', 'Select Clients')
                    : scope === 'course'
                      ? t('admin.notifications.selectCourses', 'Select Courses')
                      : t('admin.notifications.selectPrograms', 'Select Programs')}
                </p>
                <TargetPicker
                  options={scope === 'individual' ? userOptions : scope === 'course' ? courseOptions : programOptions}
                  selected={scope === 'individual' ? selectedUserIds : scope === 'course' ? selectedCourseIds : selectedProgramIds}
                  onChange={scope === 'individual' ? setSelectedUserIds : scope === 'course' ? setSelectedCourseIds : setSelectedProgramIds}
                  searchPlaceholder={
                    scope === 'individual'
                      ? t('admin.notifications.searchUsers', 'Search clients...')
                      : scope === 'course'
                        ? t('admin.notifications.searchCourses', 'Search courses...')
                        : t('admin.notifications.searchPrograms', 'Search programs...')
                  }
                  emptyText={t('admin.notifications.wizard.nothingToPick', 'Nothing to choose from yet.')}
                  noResultsText={t('common.noResults', 'No results found')}
                  invalid={problem?.step === 'who'}
                />
              </div>
            )}
            {audienceNote}
            {errorFor('who')}
          </section>

          {/* 2 · Importance and topic */}
          <section hidden={step !== 'importance'}>
            <StepTitle
              title={t('admin.notifications.wizard.importanceTitle', 'How important is it?')}
              text={t('admin.notifications.wizard.importanceText', 'This sets its colour, and whether it pops up in the portal.')}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIORITIES.map((p) => (
                <Choice
                  key={p}
                  on={priority === p}
                  onClick={() => setPriority(p)}
                  icon={<span className={`mt-1 block h-3 w-3 rounded-full ${PRIORITY_TONE[p].dot}`} />}
                  title={priorityLabel(p)}
                  text={
                    p === 'low'
                      ? t('admin.notifications.wizard.lowText', 'Quietly in their list')
                      : p === 'medium'
                        ? t('admin.notifications.wizard.mediumText', 'In their list, with the bell count')
                        : p === 'high'
                          ? t('admin.notifications.wizard.highText', 'Also pops up for a few seconds')
                          : t('admin.notifications.wizard.urgentText', 'Pops up and stays longer')
                  }
                />
              ))}
            </div>
            <p className="mb-2 mt-6 text-sm font-medium">{t('admin.notifications.wizard.topic', 'What is it about?')}</p>
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <QuickPills
                joined
                label={t('admin.notifications.wizard.topic', 'What is it about?')}
                value={category}
                onChange={setCategory}
                options={CATEGORIES.map((c) => {
                  const Icon = CATEGORY_ICON[c];
                  return {
                    value: c,
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="h-4 w-4" aria-hidden />
                        {categoryLabel(c)}
                      </span>
                    ),
                  };
                })}
              />
            </div>
          </section>

          {/* 3 · How it appears */}
          <section hidden={step !== 'appearance'}>
            <StepTitle
              title={t('admin.notifications.wizard.appearanceTitle', 'How should it appear?')}
              text={t(
                'admin.notifications.wizard.appearanceText',
                'It always goes into their Notifications list and the bell count. You can also show it like this. When they close it, it counts as read.',
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {styleOptions.map((o) => {
                const on = displayStyle === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setDisplayStyle(o.value)}
                    aria-pressed={on}
                    className={`rounded-xl border-2 p-2.5 text-start transition-colors ${
                      on ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <StyleThumbnail style={o.value} />
                    <span className="mt-2 block text-sm font-semibold">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.text}</span>
                  </button>
                );
              })}
            </div>
            {displayStyle === 'modal' && (
              <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                {t('admin.notifications.wizard.modalNote', 'A window stops people until they close it. Keep it for things that really matter.')}
              </p>
            )}
          </section>

          {/* 4 · Words */}
          <section hidden={step !== 'words'}>
            <StepTitle
              title={t('admin.notifications.wizard.wordsTitle', 'What does it say?')}
              text={t('admin.notifications.wizard.wordsText', 'A short title, then the details. The portal is in Hebrew.')}
            />
            <label htmlFor="n-title" className="block text-sm font-medium">
              {t('admin.notifications.titleLabel', 'Title')}{' '}
              <span className="font-normal text-muted-foreground">({t('admin.notifications.wizard.required', 'required')})</span>
            </label>
            <input
              id="n-title"
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              required
              aria-invalid={titleMissing}
              aria-describedby={titleMissing ? 'n-title-error' : undefined}
              placeholder={t('admin.notifications.titlePlaceholder', 'Notification title...')}
              className={`${inputClass} mt-1 ${titleMissing ? 'border-red-500 dark:border-red-500' : ''}`}
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              {titleMissing ? (
                <p id="n-title-error" role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t('admin.notifications.errors.titleRequired', 'Title is required')}
                </p>
              ) : (
                <span />
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {title.length}/{TITLE_MAX}
              </span>
            </div>

            <label htmlFor="n-message" className="mt-4 block text-sm font-medium">
              {t('admin.notifications.messageLabel', 'Message')}{' '}
              <span className="font-normal text-muted-foreground">({t('admin.notifications.wizard.required', 'required')})</span>
            </label>
            <textarea
              id="n-message"
              dir="auto"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MESSAGE_MAX}
              rows={5}
              required
              aria-invalid={messageMissing}
              aria-describedby={messageMissing ? 'n-message-error' : undefined}
              placeholder={t('admin.notifications.messagePlaceholder', 'Notification message...')}
              className={`mt-1 w-full rounded-md border bg-card p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                messageMissing ? 'border-red-500 dark:border-red-500' : 'border-border'
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              {messageMissing ? (
                <p id="n-message-error" role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t('admin.notifications.errors.messageRequired', 'Message is required')}
                </p>
              ) : (
                <span />
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {message.length}/{MESSAGE_MAX}
              </span>
            </div>
          </section>

          {/* 4 · Button */}
          <section hidden={step !== 'button'}>
            <StepTitle
              title={t('admin.notifications.wizard.buttonTitle', 'A button (optional)')}
              text={t('admin.notifications.wizard.buttonText', 'Where to go for more, like a lesson or the billing page. Leave both empty for no button.')}
            />
            <label htmlFor="n-label" className="block text-sm font-medium">
              {t('admin.notifications.actionLabel', 'Action Label')}
            </label>
            <input
              id="n-label"
              dir="auto"
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder={t('admin.notifications.actionLabelPlaceholder', 'View Details')}
              className={`${inputClass} mt-1`}
            />
            <label htmlFor="n-url" className="mt-4 block text-sm font-medium">
              {t('admin.notifications.actionUrl', 'Action URL')}
            </label>
            <input
              id="n-url"
              dir="ltr"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/courses/123"
              className={`${inputClass} mt-1`}
            />
          </section>

          {/* 5 · Delivery */}
          <section hidden={step !== 'delivery'}>
            <StepTitle
              title={t('admin.notifications.wizard.deliveryTitle', 'How it reaches them')}
              text={t('admin.notifications.wizard.deliveryText', 'It always shows in the portal. Email and SMS are extra.')}
            />
            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-xl border-2 border-primary bg-primary/10 p-3.5 opacity-90">
                <Bell className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">{t('admin.notifications.channels.inApp', 'In-App')}</span>
                  <span className="block text-sm text-muted-foreground">{t('admin.notifications.wizard.alwaysOn', 'Always on')}</span>
                </span>
              </div>
              <div>
                <Choice
                  on={emailEnabled}
                  onClick={() => setEmailEnabled((v) => !v)}
                  icon={<Mail className="h-5 w-5 text-primary" />}
                  title={t('admin.notifications.channels.email', 'Email')}
                  text={t('admin.notifications.wizard.emailText', 'Also sends it by email')}
                />
                {emailEnabled && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 ps-3">
                    <span className="text-sm text-muted-foreground">{t('admin.notifications.wizard.emailLanguage', 'Email language')}</span>
                    <QuickPills
                      joined
                      label={t('admin.notifications.wizard.emailLanguage', 'Email language')}
                      value={emailLanguage}
                      onChange={setEmailLanguage}
                      options={[
                        { value: 'he', label: 'עברית' },
                        { value: 'en', label: 'English' },
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
            <label htmlFor="n-expires" className="mt-6 block text-sm font-medium">
              {t('admin.notifications.expiresAt', 'Expires At')}{' '}
              <span className="font-normal text-muted-foreground">({t('common.optional', 'Optional')})</span>
            </label>
            <input
              id="n-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={`${inputClass} mt-1 max-w-xs`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('admin.notifications.wizard.expiresHint', 'After this, it no longer shows in the portal.')}
            </p>
          </section>

          {/* 6 · Check and send */}
          <section hidden={step !== 'review'}>
            <StepTitle
              title={t('admin.notifications.wizard.reviewTitle', 'Check and send')}
              text={t('admin.notifications.wizard.reviewText', 'Press Change to fix anything, then Send at the bottom of the screen.')}
            />
            <div className="divide-y divide-slate-100 rounded-xl border border-border">
              {(
                [
                  [
                    'who',
                    t('admin.notifications.wizard.stepWho', 'Who'),
                    currentAudience && audienceIds.length > 0
                      ? `${whoSummary} · ${t('admin.notifications.wizard.peopleCount', '{count} people').replace('{count}', String(currentAudience.total))}`
                      : whoSummary,
                  ],
                  ['importance', t('admin.notifications.wizard.stepImportance', 'Importance'), `${priorityLabel(priority)} · ${categoryLabel(category)}`],
                  ['appearance', t('admin.notifications.wizard.stepAppearance', 'How it appears'), styleLabel(displayStyle)],
                  ['words', t('admin.notifications.titleLabel', 'Title'), title.trim() || '—'],
                  [
                    'button',
                    t('admin.notifications.wizard.stepButton', 'Button'),
                    actionLabel.trim() || actionUrl.trim() ? `${actionLabel.trim() || '—'} → ${actionUrl.trim() || '—'}` : t('admin.notifications.wizard.noButton', 'No button'),
                  ],
                  [
                    'delivery',
                    t('admin.notifications.wizard.stepDelivery', 'Delivery'),
                    [
                      t('admin.notifications.channels.inApp', 'In-App'),
                      emailEnabled ? `${t('admin.notifications.channels.email', 'Email')} (${emailLanguage === 'he' ? 'עברית' : 'English'})` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') + (expiresAt ? ` · ${t('admin.notifications.expiresAt', 'Expires At')} ${new Date(expiresAt).toLocaleString()}` : ''),
                  ],
                ] as const
              ).map(([id, label, value]) => (
                <div key={id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 p-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <bdi className="[overflow-wrap:anywhere]">{value}</bdi>
                    <button type="button" onClick={() => goTo(id)} className="shrink-0 font-medium text-primary hover:underline">
                      {t('admin.notifications.wizard.change', 'Change')}
                    </button>
                  </span>
                </div>
              ))}
            </div>
            {reachesNobody && <div className="mt-4">{audienceNote}</div>}
          </section>

          {/* Back / Continue */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            {index > 0 ? (
              <button type="button" onClick={() => goTo(STEP_IDS[index - 1])} className="min-h-10 px-2 text-sm font-medium text-primary hover:underline">
                {t('admin.notifications.wizard.back', 'Back')}
              </button>
            ) : (
              <span />
            )}
            {index < STEP_IDS.length - 1 && (
              <button
                type="button"
                onClick={() => goTo(STEP_IDS[index + 1])}
                className="min-h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', STEP_LABEL[STEP_IDS[index + 1]])}
              </button>
            )}
          </div>
        </div>

        {/* Live picture of the portal */}
        <aside className="h-fit rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <p className="mb-3 text-sm font-semibold">{t('admin.notifications.wizard.previewTitle', 'How it looks in the portal')}</p>
          <PortalPreview
            title={title}
            message={message}
            actionLabel={actionLabel}
            priority={priority}
            category={category}
            displayStyle={displayStyle}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {displayStyle !== 'list'
              ? `${styleLabel(displayStyle)}. ${t('admin.notifications.wizard.previewAlsoList', 'It also goes into their Notifications page and the bell count.')}`
              : popsUp
                ? t('admin.notifications.wizard.previewPopup', 'Important and urgent ones also pop up in the corner for a few seconds.')
                : t('admin.notifications.wizard.previewList', 'It shows in their Notifications page and the bell count.')}
          </p>
        </aside>
      </div>

      {/* The one save bar (here it sends) */}
      <SaveBar
        isNew
        dirty={false}
        saving={sending}
        onSave={() => void send()}
        cancelHref={LIST_PATH}
        saveLabel={t('admin.notifications.send', 'Send Notification')}
        text={{
          ...saveBarText(t).bar,
          newItem: t('admin.notifications.wizard.notSent', 'Not sent yet'),
          saving: t('admin.notifications.sending', 'Sending...'),
        }}
      />

      <AlertDialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.notifications.wizard.nobodyTitle', 'Nobody will get this notification')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.notifications.wizard.nobodyConfirm', 'No one is enrolled in what you chose, so no one will see it. Send it anyway?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => goTo('who')}>{t('admin.notifications.wizard.changeWho', 'Change who gets it')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void send(true)}>{t('admin.notifications.wizard.sendAnyway', 'Send anyway')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveTo !== null} onOpenChange={(open) => !open && setLeaveTo(null)}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.notifications.wizard.leaveTitle', 'Leave without sending?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.notifications.wizard.leaveText', "What you've written isn't sent or saved. If you leave now, it's lost.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.notifications.wizard.stay', 'Stay here')}</AlertDialogCancel>
            <AlertDialogAction onClick={leave} className="bg-red-600 hover:bg-red-700">
              {t('admin.notifications.wizard.leave', 'Leave without sending')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
