// Thin wrapper around the `rrule` package for the email-schedules
// cron. The cron only needs two things: (1) "is this rule valid?" at
// create time, and (2) "given a 'just ran' moment and an end bound,
// what's the next occurrence?" after each send.

import { rrulestr, RRule } from 'rrule';

/**
 * Validate an RRULE string. Returns null when valid, otherwise an
 * error message suitable for surfacing to the admin.
 */
export function validateRRule(rule: string): string | null {
  try {
    const parsed = rrulestr(rule);
    // rrulestr accepts both single RRULEs and RRULESETs. Both expose
    // .all() / .after() so we don't need to discriminate.
    if (!parsed) return 'Invalid recurrence rule';
    return null;
  } catch (err: any) {
    return err?.message || 'Invalid recurrence rule';
  }
}

/**
 * Compute the next occurrence strictly after `after`, optionally
 * bounded by `endDate`. Returns null when no further occurrence
 * exists within the bounds.
 *
 * `dtstart` should be the schedule's original scheduled_for so the
 * rule's anchor point is stable across runs (otherwise daily / weekly
 * rules drift each time we re-parse from a moving "now").
 */
export function nextOccurrenceAfter(
  rule: string,
  dtstart: Date,
  after: Date,
  endDate?: Date | null,
): Date | null {
  try {
    const parsed = rrulestr(rule, { dtstart });
    const candidate = (parsed as RRule).after(after, false);
    if (!candidate) return null;
    if (endDate && candidate > endDate) return null;
    return candidate;
  } catch {
    return null;
  }
}
