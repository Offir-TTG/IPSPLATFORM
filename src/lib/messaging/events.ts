/**
 * Small entry points for places in the system where a reminder's event
 * happens. Each one is safe to call always: it does nothing when the
 * reminder is off, and never throws.
 *
 * Server only.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { CATALOG_BY_KEY } from './catalog';
import type { CaseContext } from './context';
import { deliverMessage } from './deliver';
import { fireEvent, renderStep } from './engine';
import { courseMembers } from './sources';
import { chaserForEvent } from './store';

interface LessonLike {
  id: string;
  tenant_id: string | null;
  course_id: string | null;
  title: string | null;
  start_time: string | null;
}

/**
 * A future meeting was moved, cancelled or deleted. Tells the meeting's
 * members, through "Meeting cancelled or moved" when it's on.
 */
export async function lessonChanged(lesson: LessonLike, change: 'moved' | 'cancelled'): Promise<void> {
  try {
    if (!lesson.tenant_id || !lesson.course_id || !lesson.start_time) return;
    if (new Date(lesson.start_time).getTime() < Date.now()) return;
    const db = createAdminClient();
    const [{ data: course }, members] = await Promise.all([
      db.from('courses').select('title').eq('id', lesson.course_id).maybeSingle(),
      courseMembers(db, lesson.tenant_id, lesson.course_id),
    ]);
    await fireEvent(
      lesson.tenant_id,
      'lesson.changed',
      members.map((m) => ({
        subjectType: 'lesson',
        subjectId: lesson.id,
        userId: m.userId,
        productId: m.productId,
        // A move to a new time is a new case; the same change seen twice isn't.
        anchorAt: change === 'moved' ? new Date(lesson.start_time!) : new Date(Math.floor(Date.now() / 60_000) * 60_000),
        context: { change, lesson: lesson.title ?? '', course: course?.title ?? '', courseId: lesson.course_id!, lessonId: lesson.id, startsAt: lesson.start_time! },
      })),
    );
  } catch (error) {
    console.error('[reminders] lessonChanged failed', error);
  }
}

/**
 * A price-change message ('price.changing' or 'price.cancelled') to one
 * member, with the words, status and client settings of its row on the
 * Automatic reminders screen. Returns:
 *   'sent'     delivered (bell, and email if the client allows it)
 *   'off'      the team turned this message off
 *   'fallback' the reminders tables aren't there yet: send the old way
 */
export async function sendPriceChangeMessage(
  tenantId: string,
  eventKey: 'price.changing' | 'price.cancelled',
  userId: string,
  context: CaseContext,
): Promise<'sent' | 'off' | 'fallback'> {
  const db = createAdminClient();
  const row = await chaserForEvent(db, tenantId, eventKey);
  if (row === 'missing' || !row || !row.steps.length) return 'fallback';
  if (row.status !== 'active') return 'off';
  const step = [...row.steps].sort((a, b) => a.position - b.position)[0];
  const r = await renderStep(db, { tenantId, userId, ev: CATALOG_BY_KEY[eventKey], step, context });
  await deliverMessage(
    {
      tenantId,
      userId,
      source: 'price_change',
      category: 'payment',
      title: r.title,
      body: r.text,
      bodyHtml: r.html,
      actionUrl: r.actionUrl,
      actionLabel: r.actionLabel,
      email: step.send_email,
      useSendHours: true,
      sendFrom: row.send_from,
      sendUntil: row.send_until,
      skipShabbat: row.skip_shabbat,
      priority: 'high',
      metadata: { kind: `reminder_${eventKey}` },
      chaser: { chaserId: row.id, stepId: step.id, runId: null },
    },
    db,
  );
  return 'sent';
}
