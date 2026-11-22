/**
 * Stop and pause dates of a membership (columns added by
 * 20261122_subscription_stop_pause.sql). Read from `select('*')` rows so the
 * code keeps working, with no stop or pause, if the columns aren't there yet.
 */

export type SubscriptionDates = {
  endsAt: Date | null;
  pausedFrom: Date | null;
  pausedUntil: Date | null;
};

const asDate = (v: unknown) => (v ? new Date(String(v)) : null);

export function readSubscriptionDates(enrollment: Record<string, any> | null | undefined): SubscriptionDates {
  return {
    endsAt: asDate(enrollment?.subscription_ends_at),
    pausedFrom: asDate(enrollment?.subscription_paused_from),
    pausedUntil: asDate(enrollment?.subscription_paused_until),
  };
}

export function isPausedAt(d: SubscriptionDates, at = new Date()): boolean {
  return !!(d.pausedFrom && d.pausedUntil && d.pausedFrom <= at && at < d.pausedUntil);
}

export function hasEnded(d: SubscriptionDates, at = new Date()): boolean {
  return !!(d.endsAt && d.endsAt <= at);
}

/** A renewal that falls inside a pause moves to the day the pause ends. */
export function shiftPastPause(nextDate: Date, d: SubscriptionDates): Date {
  if (d.pausedFrom && d.pausedUntil && nextDate >= d.pausedFrom && nextDate < d.pausedUntil) {
    return new Date(d.pausedUntil);
  }
  return nextDate;
}
