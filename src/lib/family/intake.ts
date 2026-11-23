/**
 * Intake for child coaching (tables: 20261122_coaching_intake.sql).
 *
 * The team edits the questions in the admin. After a coaching pack is set
 * up, the parent fills the intake; the first session can't be booked until
 * it's sent, and the parent can edit it until the first session takes place.
 * Only the parent who pays for the pack (and the team) can see it.
 */
import { createAdminClient } from '@/lib/supabase/server';

export type IntakeQuestion = {
  id: string;
  label: string;
  kind: 'text' | 'long_text' | 'choice' | 'multi' | 'yes_no' | 'number' | 'date';
  options?: string[];
  required?: boolean;
  help?: string;
};

export type IntakeStatus = 'not_needed' | 'missing' | 'submitted' | 'locked';

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

const KINDS = new Set(['text', 'long_text', 'choice', 'multi', 'yes_no', 'number', 'date']);

/** Keeps only well-formed questions; used when the admin saves a form too. */
export function cleanQuestions(raw: unknown): IntakeQuestion[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: IntakeQuestion[] = [];
  for (const q of raw as any[]) {
    const id = String(q?.id ?? '').trim();
    const label = String(q?.label ?? '').trim();
    if (!id || !label || seen.has(id) || !KINDS.has(q?.kind)) continue;
    seen.add(id);
    const options = Array.isArray(q.options) ? q.options.map((o: unknown) => String(o).trim()).filter(Boolean) : undefined;
    if ((q.kind === 'choice' || q.kind === 'multi') && (!options || options.length < 2)) continue;
    out.push({ id, label, kind: q.kind, options, required: !!q.required, help: q.help ? String(q.help) : undefined });
  }
  return out;
}

/**
 * The form for a pack: the one chosen when the package was opened (or none),
 * else the product's own active form, else the school's general one.
 */
async function formFor(tenantId: string, productId: string | null, enrollmentId?: string) {
  const supabase = createAdminClient();
  if (enrollmentId) {
    const { data: e } = await supabase.from('enrollments').select('payment_metadata').eq('id', enrollmentId).maybeSingle();
    const chosen = (e?.payment_metadata as any)?.intake_form_id;
    if (chosen === 'none') return null;
    if (typeof chosen === 'string' && chosen) {
      const { data } = await supabase.from('intake_forms').select('id, title, questions').eq('id', chosen).eq('tenant_id', tenantId).eq('is_active', true).maybeSingle();
      if (data) return data;
    }
  }
  if (productId) {
    const { data } = await supabase
      .from('intake_forms')
      .select('id, title, questions')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase
    .from('intake_forms')
    .select('id, title, questions')
    .eq('tenant_id', tenantId)
    .is('product_id', null)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

async function ownPack(userId: string, enrollmentId: string) {
  const { data } = await createAdminClient()
    .from('enrollments')
    .select('id, user_id, tenant_id, child_id, product_id, status')
    .eq('id', enrollmentId)
    .maybeSingle();
  return data && data.user_id === userId ? data : null;
}

/** The first session has taken place (started) — answers are final from then. */
async function firstSessionHappened(enrollmentId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('coaching_sessions')
    .select('starts_at, status')
    .eq('enrollment_id', enrollmentId)
    .in('status', ['booked', 'done', 'no_show', 'late_cancelled']);
  const now = Date.now();
  return (data ?? []).some((s: any) => s.status !== 'booked' || new Date(s.starts_at).getTime() <= now);
}

/** Status only (for the coaching overview and the booking rule). */
export async function intakeStatusFor(pack: { id: string; tenant_id: string; product_id: string | null }): Promise<IntakeStatus> {
  const supabase = createAdminClient();
  const { data: response } = await supabase.from('intake_responses').select('id').eq('enrollment_id', pack.id).maybeSingle();
  if (response) return (await firstSessionHappened(pack.id)) ? 'locked' : 'submitted';
  const form = await formFor(pack.tenant_id, pack.product_id, pack.id);
  return form && cleanQuestions(form.questions).length ? 'missing' : 'not_needed';
}

export type IntakeView = {
  ok: true;
  status: IntakeStatus;
  can_edit: boolean;
  title: string | null;
  /** The questions to show: as sent (once submitted), else the current form. */
  questions: IntakeQuestion[];
  answers: Record<string, unknown>;
  submitted_at: string | null;
};

/** What the parent sees on the intake page for a coaching pack. */
export async function getIntake(userId: string, enrollmentId: string): Promise<IntakeView | Fail> {
  const pack = await ownPack(userId, enrollmentId);
  if (!pack) return fail(404, 'Coaching not found');
  const supabase = createAdminClient();
  const { data: response } = await supabase
    .from('intake_responses')
    .select('form_id, questions, answers, submitted_at')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();
  if (response) {
    const locked = await firstSessionHappened(enrollmentId);
    const { data: form } = response.form_id
      ? await supabase.from('intake_forms').select('title').eq('id', response.form_id).maybeSingle()
      : { data: null };
    return {
      ok: true,
      status: locked ? 'locked' : 'submitted',
      can_edit: !locked,
      title: form?.title ?? null,
      questions: cleanQuestions(response.questions),
      answers: (response.answers ?? {}) as Record<string, unknown>,
      submitted_at: response.submitted_at,
    };
  }
  const form = await formFor(pack.tenant_id, pack.product_id, pack.id);
  const questions = cleanQuestions(form?.questions);
  if (!form || !questions.length) {
    return { ok: true, status: 'not_needed', can_edit: false, title: null, questions: [], answers: {}, submitted_at: null };
  }
  return { ok: true, status: 'missing', can_edit: true, title: form.title, questions, answers: {}, submitted_at: null };
}

/** Checks the answers against the questions; returns the cleaned answers or the first problem. */
export function validateAnswers(
  questions: IntakeQuestion[],
  raw: unknown,
): { ok: true; answers: Record<string, unknown> } | { ok: false; question_id: string; error: string } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    let v = input[q.id];
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (q.required) return { ok: false, question_id: q.id, error: 'This question is required' };
      continue;
    }
    switch (q.kind) {
      case 'text':
      case 'long_text':
        v = String(v).trim();
        if ((v as string).length > (q.kind === 'text' ? 500 : 5000)) return { ok: false, question_id: q.id, error: 'Answer is too long' };
        if (!v && q.required) return { ok: false, question_id: q.id, error: 'This question is required' };
        break;
      case 'choice':
        if (!q.options?.includes(String(v))) return { ok: false, question_id: q.id, error: 'Choose one of the options' };
        v = String(v);
        break;
      case 'multi':
        if (!Array.isArray(v) || v.some((x) => !q.options?.includes(String(x)))) {
          return { ok: false, question_id: q.id, error: 'Choose from the options' };
        }
        v = [...new Set((v as unknown[]).map(String))];
        break;
      case 'yes_no':
        if (v !== true && v !== false && v !== 'yes' && v !== 'no') return { ok: false, question_id: q.id, error: 'Answer yes or no' };
        v = v === true || v === 'yes';
        break;
      case 'number':
        if (!Number.isFinite(Number(v))) return { ok: false, question_id: q.id, error: 'Enter a number' };
        v = Number(v);
        break;
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v)) || isNaN(new Date(String(v)).getTime())) {
          return { ok: false, question_id: q.id, error: 'Enter a date' };
        }
        v = String(v);
        break;
    }
    answers[q.id] = v;
  }
  return { ok: true, answers };
}

/** Sends or updates the intake. Refused once the first session has taken place. */
export async function submitIntake(
  userId: string,
  enrollmentId: string,
  rawAnswers: unknown,
): Promise<IntakeView | Fail | { ok: false; status: 400; error: string; question_id: string }> {
  const current = await getIntake(userId, enrollmentId);
  if (!current.ok) return current;
  if (current.status === 'not_needed') return fail(409, 'No intake is needed for this coaching');
  if (!current.can_edit) return fail(409, 'The intake can no longer be changed after the first session. Please contact the team.');

  const checked = validateAnswers(current.questions, rawAnswers);
  if (!checked.ok) return { ok: false, status: 400, error: checked.error, question_id: checked.question_id };

  const pack = (await ownPack(userId, enrollmentId))!;
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  if (current.status === 'missing') {
    const form = await formFor(pack.tenant_id, pack.product_id, pack.id);
    const { error } = await supabase.from('intake_responses').insert({
      tenant_id: pack.tenant_id,
      enrollment_id: pack.id,
      child_id: pack.child_id,
      form_id: form?.id ?? null,
      questions: current.questions,
      answers: checked.answers,
      submitted_by: userId,
      submitted_at: now,
      updated_at: now,
    });
    // 23505: sent from another tab a moment ago — fall through to update.
    if (error && error.code !== '23505') return fail(500, error.message);
    if (!error) return getIntake(userId, enrollmentId);
  }
  const { error } = await supabase
    .from('intake_responses')
    .update({ answers: checked.answers, submitted_by: userId, updated_at: now })
    .eq('enrollment_id', pack.id);
  if (error) return fail(500, error.message);
  return getIntake(userId, enrollmentId);
}
