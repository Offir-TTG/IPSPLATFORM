/**
 * What the portal shows for a parent's children and their coaching.
 * Children have no login; the parent sees everything and pays. Only dates,
 * the coach and payments appear here, never notes from the sessions.
 */

export type CoachingSessionView = {
  id: string;
  title: string;
  when: string;
  start: string;
  end: string;
  status: 'upcoming' | 'done' | 'cancelled' | 'late_cancelled' | 'no_show';
  /** Can still be moved or cancelled without counting (24 hours or more ahead). */
  canChange: boolean;
  joinUrl: string | null;
  where: string | null;
};

export type CoachingView = {
  enrollmentId: string;
  title: string;
  coach: { name: string; avatarUrl: string | null } | null;
  used: number;
  total: number;
  next: CoachingSessionView | null;
  sessions: CoachingSessionView[];
  payment: { packageLabel: string; paidLabel: string; nextLabel: string | null } | null;
  sessionMinutes: number;
  left: number | null;
  /** A session can be booked now: sessions left in the pack and a coach assigned. */
  canBook: boolean;
  /** The intake form the team set: booking waits until it is filled in. */
  intakeStatus: 'not_needed' | 'missing' | 'submitted' | 'locked';
  /** The team opened the pack; the parent still has to finish the enrollment and payment. */
  awaitingEnrollment: boolean;
  /** The existing enrollment wizard link, or null when it expired. */
  enrollmentUrl: string | null;
};

export type ChildView = {
  id: string;
  firstName: string;
  age: number | null;
  color: string;
  coaching: CoachingView[];
  /** An open coaching request the team hasn't handled yet. */
  pendingRequest: { createdAt: string } | null;
};

export const CHILD_COLORS = ['#7a4a8f', '#5a6bb5', '#a0559f', '#3f6a8f', '#8a5a3f'];

export const ageLabel = (age: number | null) => (age == null ? '' : `גיל ${age}`);
