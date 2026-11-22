// How each importance level and topic looks, in the admin and in the
// portal preview. The colours follow the Messages tones used on the
// IParentingSchool site: calm for everyday, amber for important, red for
// urgent. Behaviour (who sees what, pop-ups) is unchanged.

import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Megaphone,
  Settings,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationCategory, NotificationPriority, NotificationScope } from '@/types/notifications';

export const PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];
export const CATEGORIES: NotificationCategory[] = [
  'announcement',
  'lesson',
  'assignment',
  'payment',
  'enrollment',
  'attendance',
  'achievement',
  'system',
];
export const SCOPES: NotificationScope[] = ['tenant', 'individual', 'course', 'program'];

/** Admin badges and icon tiles. */
export const PRIORITY_TONE: Record<
  NotificationPriority,
  { badge: string; tile: string; dot: string }
> = {
  low: {
    badge: 'border-border bg-muted text-foreground/80',
    tile: 'bg-muted text-muted-foreground',
    dot: 'bg-slate-400',
  },
  medium: {
    badge: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
    tile: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  high: {
    badge: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  urgent: {
    badge: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
    tile: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300',
    dot: 'bg-red-500',
  },
};

/** The portal's look for each level (purple brand for everyday). */
export const PORTAL_TONE: Record<
  NotificationPriority,
  { card: string; title: string; text: string; tile: string; button: string }
> = {
  low: {
    card: 'border-[#e9e3f1] bg-white',
    title: 'text-[#221a2e]',
    text: 'text-[#73698a]',
    tile: 'bg-[#f1ebf8] text-[#5b3a8e]',
    button: 'border border-[#5b3a8e] text-[#5b3a8e]',
  },
  medium: {
    card: 'border-[#e9e3f1] bg-white',
    title: 'text-[#221a2e]',
    text: 'text-[#73698a]',
    tile: 'bg-[#f1ebf8] text-[#5b3a8e]',
    button: 'bg-[#5b3a8e] text-white',
  },
  high: {
    card: 'border-amber-200 bg-amber-50',
    title: 'text-amber-950',
    text: 'text-amber-950/80',
    tile: 'bg-amber-500 text-white',
    button: 'bg-amber-600 text-white',
  },
  urgent: {
    card: 'border-red-200 bg-red-50',
    title: 'text-red-900',
    text: 'text-red-900/80',
    tile: 'bg-red-500 text-white',
    button: 'bg-red-600 text-white',
  },
};

export const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  announcement: Megaphone,
  lesson: CalendarCheck,
  assignment: ClipboardList,
  payment: CreditCard,
  enrollment: UserPlus,
  attendance: Users,
  achievement: Award,
  system: Settings,
};

export const SCOPE_ICON: Record<NotificationScope, LucideIcon> = {
  tenant: Building2,
  individual: Users,
  course: BookOpen,
  program: GraduationCap,
};

export const FallbackIcon = Bell;

/** Hebrew words for the portal preview, which is always Hebrew. */
export const CATEGORY_HE: Record<NotificationCategory, string> = {
  announcement: 'הודעה',
  lesson: 'שיעור',
  assignment: 'מטלה',
  payment: 'תשלום',
  enrollment: 'הרשמה',
  attendance: 'נוכחות',
  achievement: 'הישג',
  system: 'מערכת',
};
export const PRIORITY_HE: Record<NotificationPriority, string> = {
  low: 'נמוך',
  medium: 'רגיל',
  high: 'חשוב',
  urgent: 'דחוף',
};
