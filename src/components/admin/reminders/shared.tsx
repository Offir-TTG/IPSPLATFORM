'use client';

/**
 * Shared look for the Automatic reminders screens: the icon and colour of
 * each area, status and "how it arrived" words, the step timing line, and
 * the tabs across the top.
 */

import type { ReactNode } from 'react';
import {
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Lock,
  Mail,
  PenLine,
  ShieldCheck,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { CATEGORY_LABEL_EN, CATEGORY_LABEL_HE, type MessageCategory } from '@/lib/messaging/categories';
import { AREA_LABEL, offsetLabel, type Area, type Bi, type CatalogEvent } from '@/lib/messaging/catalog';

export const AREA_ICON: Record<Area, LucideIcon> = {
  meetings: Video,
  coaching: HeartHandshake,
  payments: CreditCard,
  enrollment: FileText,
  assignments: PenLine,
  team: ShieldCheck,
  system: Lock,
};

export const AREA_TONE: Record<Area, string> = {
  meetings: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  coaching: 'bg-primary/10 text-primary',
  payments: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  enrollment: 'bg-primary/10 text-primary',
  assignments: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  team: 'bg-muted text-foreground/70',
  system: 'bg-muted text-foreground/70',
};

export function AreaTile({ area, small }: { area: Area; small?: boolean }) {
  const Icon = AREA_ICON[area];
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ${small ? 'h-8 w-8' : 'h-10 w-10'} ${AREA_TONE[area]}`} aria-hidden>
      <Icon className={small ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
    </span>
  );
}

/** Admin words in the admin's language, from the catalogue's pair. */
export function useBi() {
  const { direction } = useAdminLanguage();
  const lang: 'he' | 'en' = direction === 'rtl' ? 'he' : 'en';
  return { lang, bi: (b: Bi) => b[lang], rtl: direction === 'rtl' };
}

export function categoryLabel(c: MessageCategory | string | null | undefined, lang: 'he' | 'en'): string {
  if (!c) return '';
  const map = lang === 'he' ? CATEGORY_LABEL_HE : CATEGORY_LABEL_EN;
  return (map as Record<string, string>)[c] ?? c;
}

/** The chip beside a group: which of the client's settings it falls under. */
export function PrefChip({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold ${
        muted ? 'border-border text-muted-foreground' : 'border-primary/30 bg-card text-primary'
      }`}
    >
      {children}
    </span>
  );
}

export function NewBadge() {
  const { t } = useAdminLanguage();
  return (
    <span className="rounded-full bg-amber-100 px-2 text-[11.5px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
      {t('admin.reminders.badge.new', 'New')}
    </span>
  );
}

export function AlwaysBadge() {
  const { t } = useAdminLanguage();
  return <span className="rounded-full bg-muted px-2 text-[11.5px] font-bold text-foreground/70">{t('admin.reminders.badge.always', 'Always')}</span>;
}

export function useStatusWords() {
  const { t } = useAdminLanguage();
  return {
    active: t('admin.reminders.status.active', 'On'),
    draft: t('admin.reminders.status.draft', 'Draft'),
    off: t('admin.reminders.status.off', 'Off'),
  };
}

export const STATUS_DOT = { active: 'bg-green-500', draft: 'bg-amber-500', off: 'bg-muted-foreground/40' } as const;

/** "24 hours before · 30 minutes before". */
export function stepsLine(steps: { offset: number }[], lang: 'he' | 'en'): string {
  return steps.map((s) => offsetLabel(s.offset, lang)).join(' · ');
}

/** How a message arrived, in plain words, and its colour. */
export function useOutcomeWords() {
  const { t } = useAdminLanguage();
  return {
    email_and_bell: { label: t('admin.reminders.outcome.emailAndBell', 'Email and bell'), tone: 'green' as const },
    email_only: { label: t('admin.reminders.outcome.email', 'Email'), tone: 'green' as const },
    bell_only: { label: t('admin.reminders.outcome.bellOnly', 'Bell only'), tone: 'grey' as const },
    waiting: { label: t('admin.reminders.outcome.waiting', 'Waiting'), tone: 'blue' as const },
    in_digest: { label: t('admin.reminders.outcome.digest', 'In the daily summary'), tone: 'blue' as const },
    stopped: { label: t('admin.reminders.outcome.stopped', 'Not sent: stopped'), tone: 'grey' as const },
    email_failed: { label: t('admin.reminders.outcome.failed', "Email didn't arrive"), tone: 'red' as const },
  };
}

export function useReasonWords() {
  const { t } = useAdminLanguage();
  return (reason: string | null | undefined, category?: string | null, lang: 'he' | 'en' = 'en'): string => {
    switch (reason) {
      case 'email_off':
        return t('admin.reminders.reason.emailOff', "Turned off email for '{category}'").replace('{category}', categoryLabel(category, lang));
      case 'quiet_hours':
        return t('admin.reminders.reason.quiet', "Email waits for the client's quiet hours to end");
      case 'time_sensitive':
        return t('admin.reminders.reason.timeSensitive', 'Quiet hours, and it would arrive too late by email');
      case 'digest':
        return t('admin.reminders.reason.digest', 'The client chose one email a day');
      case 'send_hours':
        return t('admin.reminders.reason.sendHours', 'Waits for the sending hours');
      case 'shabbat':
        return t('admin.reminders.reason.shabbat', 'Waits until after Shabbat or the holiday');
      case 'no_email':
        return t('admin.reminders.reason.noEmail', 'The client has no email address');
      case 'bounced':
        return t('admin.reminders.reason.bounced', "The address doesn't exist (the bell got it)");
      case 'send_error':
        return t('admin.reminders.reason.sendError', 'The email service refused it');
      case 'inactive':
        return t('admin.reminders.reason.inactive', 'The client is inactive');
      case 'bell_step':
        return t('admin.reminders.reason.bellStep', 'This step goes to the bell only');
      case 'paid':
        return t('admin.reminders.reason.paid', 'The payment went through');
      case 'enrolled':
        return t('admin.reminders.reason.enrolled', 'The enrollment was finished');
      case 'signed':
        return t('admin.reminders.reason.signed', 'The contract was signed');
      case 'manual':
        return t('admin.reminders.reason.manual', 'Stopped by hand');
      case 'reminder_off':
        return t('admin.reminders.reason.reminderOff', 'The reminder was turned off');
      case 'lesson_moved':
      case 'session_changed':
        return t('admin.reminders.reason.moved', 'The meeting was moved or cancelled');
      case 'rescheduled':
        return t('admin.reminders.reason.rescheduled', 'The date was changed');
      case 'resent':
        return t('admin.reminders.reason.resent', 'The link was sent again');
      case 'enrollment_cancelled':
        return t('admin.reminders.reason.cancelled', 'The enrollment was cancelled');
      case 'submitted':
        return t('admin.reminders.reason.submitted', 'The assignment was handed in');
      case 'intake_filled':
        return t('admin.reminders.reason.intake', 'The questionnaire was filled');
      case 'card_updated':
        return t('admin.reminders.reason.card', 'The card was updated');
      case 'reactivated':
        return t('admin.reminders.reason.reactivated', 'The enrollment is active again');
      case 'scheduled':
        return t('admin.reminders.reason.scheduled', 'Scheduled');
      default:
        return reason ?? '';
    }
  };
}

const PILL_TONE = {
  green: 'bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300',
  grey: 'bg-muted text-foreground/75',
  blue: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  red: 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300',
} as const;

export function OutcomePill({ tone, children }: { tone: keyof typeof PILL_TONE; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${PILL_TONE[tone]}`}>{children}</span>;
}

export const PAGE_ICON = Zap;
export const ICONS = { Bell, Mail, CalendarClock, GraduationCap };

/** The catalogue event's area label. */
export function areaLabel(ev: CatalogEvent | undefined, lang: 'he' | 'en'): string {
  return ev ? AREA_LABEL[ev.area][lang] : '';
}

export function money(amount: number | null | undefined, currency: string | null | undefined, lang: 'he' | 'en'): string {
  if (amount == null) return '';
  try {
    return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: (currency || 'USD').toUpperCase() }).format(amount);
  } catch {
    return String(amount);
  }
}

export function shortDate(iso: string | null | undefined, lang: 'he' | 'en'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function dateTime(iso: string | null | undefined, lang: 'he' | 'en'): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const time = d.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `${lang === 'he' ? 'היום' : 'Today'} ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `${lang === 'he' ? 'אתמול' : 'Yesterday'} ${time}`;
  return `${shortDate(iso, lang)} ${time}`;
}
