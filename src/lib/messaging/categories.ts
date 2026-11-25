/**
 * The client's settings groups ("עדכונים" in the portal). Every automatic
 * message belongs to one; it decides whether the client gets it by email.
 * The keys are the ones notification_preferences.category_preferences uses.
 */

export const CLIENT_CATEGORIES = ['lesson', 'announcement', 'assignment', 'payment', 'enrollment', 'achievement'] as const;
export type ClientCategory = (typeof CLIENT_CATEGORIES)[number];

/** 'system' = invitation, enrollment link, password reset: always emailed. */
export type MessageCategory = ClientCategory | 'system';

export const CATEGORY_LABEL_HE: Record<MessageCategory, string> = {
  lesson: 'מפגשים והקלטות',
  announcement: 'הודעות מהצוות',
  assignment: 'מטלות ומועדי הגשה',
  payment: 'תשלומים וקבלות',
  enrollment: 'הרשמה',
  achievement: 'הישגים ותעודות',
  system: 'הודעות מערכת',
};

export const CATEGORY_LABEL_EN: Record<MessageCategory, string> = {
  lesson: 'Meetings and recordings',
  announcement: 'Messages from the team',
  assignment: 'Assignments and due dates',
  payment: 'Payments and receipts',
  enrollment: 'Enrollment',
  achievement: 'Achievements and certificates',
  system: 'System messages',
};

export function isClientCategory(value: unknown): value is ClientCategory {
  return typeof value === 'string' && (CLIENT_CATEGORIES as readonly string[]).includes(value);
}

/** Old trigger events → the settings group they belong to. */
export function categoryForTriggerEvent(eventType: string): MessageCategory {
  const prefix = eventType.split('.')[0];
  switch (prefix) {
    case 'lesson':
    case 'recording':
    case 'attendance':
      return 'lesson';
    case 'payment':
    case 'subscription':
      return 'payment';
    case 'enrollment':
      return 'enrollment';
    case 'assignment':
      return 'assignment';
    case 'certificate':
    case 'achievement':
      return 'achievement';
    case 'user':
    case 'auth':
    case 'invitation':
      return 'system';
    default:
      return 'announcement';
  }
}
