/**
 * Reading and seeding automatic reminders. The first time a school opens
 * the screen (or the engine runs), every catalogue event that has a seed
 * gets its reminder with the default messages, in its seed status. New
 * client emails start as drafts, so nothing new goes out until the team
 * turns it on.
 *
 * Server only.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { CATALOG, CATALOG_BY_KEY, type CatalogEvent } from './catalog';

type Db = ReturnType<typeof createAdminClient>;

export interface ChaserStep {
  id: string;
  chaser_id: string;
  position: number;
  offset_minutes: number;
  send_email: boolean;
  admin_copy: boolean;
  action_key: string | null;
  title_he: string;
  body_he: string;
  title_en: string | null;
  body_en: string | null;
  action_label_he: string | null;
  action_label_en: string | null;
}

export interface Chaser {
  id: string;
  tenant_id: string;
  event_key: string;
  name: string;
  status: 'active' | 'draft' | 'off';
  applies_to: 'new' | 'all';
  admin_copy: boolean;
  stop_on: string[];
  product_ids: string[] | null;
  send_from: string | null;
  send_until: string | null;
  skip_shabbat: boolean | null;
  is_system: boolean;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
  steps: ChaserStep[];
}

const CHASER_COLUMNS =
  'id, tenant_id, event_key, name, status, applies_to, admin_copy, stop_on, product_ids, send_from, send_until, skip_shabbat, is_system, activated_at, created_at, updated_at';
const STEP_COLUMNS =
  'id, chaser_id, position, offset_minutes, send_email, admin_copy, action_key, title_he, body_he, title_en, body_en, action_label_he, action_label_en';

const seeded = new Map<string, number>();

/** Creates the default reminders the school doesn't have yet. Safe to call often. */
export async function ensureSeeded(db: Db, tenantId: string): Promise<void> {
  const last = seeded.get(tenantId);
  if (last && Date.now() - last < 10 * 60_000) return;
  const { data: existing, error } = await db.from('chasers').select('event_key').eq('tenant_id', tenantId).eq('is_system', true);
  if (error) throw new Error(`chasers: ${error.message}`);
  const have = new Set((existing ?? []).map((r: { event_key: string }) => r.event_key));
  for (const ev of CATALOG) {
    if (!ev.seed || have.has(ev.key)) continue;
    await createFromCatalog(db, tenantId, ev, { status: ev.seed, isSystem: true, createdBy: null });
  }
  seeded.set(tenantId, Date.now());
}

export async function createFromCatalog(
  db: Db,
  tenantId: string,
  ev: CatalogEvent,
  opts: { status: Chaser['status']; isSystem: boolean; createdBy: string | null; name?: string },
): Promise<string | null> {
  const now = new Date().toISOString();
  const { data: row, error } = await db
    .from('chasers')
    .insert({
      tenant_id: tenantId,
      event_key: ev.key,
      name: opts.name ?? ev.name.he,
      status: opts.status,
      stop_on: ev.stops.map((s) => s.key),
      is_system: opts.isSystem,
      activated_at: opts.status === 'active' ? now : null,
      created_by: opts.createdBy,
    })
    .select('id')
    .single();
  if (error || !row) {
    // Another request seeded it at the same moment.
    if (error && /uq_chasers_system_event|duplicate key/.test(error.message)) return null;
    throw new Error(`chasers insert: ${error?.message}`);
  }
  if (ev.steps.length) {
    const { error: stepError } = await db.from('chaser_steps').insert(
      ev.steps.map((s, i) => ({
        tenant_id: tenantId,
        chaser_id: row.id,
        position: i + 1,
        offset_minutes: s.offset,
        send_email: s.sendEmail ?? true,
        admin_copy: s.adminCopy ?? false,
        action_key: s.action ?? null,
        title_he: s.title.he,
        body_he: s.body.he,
        title_en: s.title.en,
        body_en: s.body.en,
      })),
    );
    if (stepError) throw new Error(`chaser_steps insert: ${stepError.message}`);
  }
  return row.id;
}

function attach(chasers: Omit<Chaser, 'steps'>[], steps: ChaserStep[]): Chaser[] {
  const byChaser = new Map<string, ChaserStep[]>();
  for (const s of steps) byChaser.set(s.chaser_id, [...(byChaser.get(s.chaser_id) ?? []), s]);
  return chasers.map((c) => ({ ...c, steps: (byChaser.get(c.id) ?? []).sort((a, b) => a.position - b.position) }));
}

export async function loadChasers(db: Db, tenantId: string, filter: { status?: Chaser['status'] } = {}): Promise<Chaser[]> {
  let q = db.from('chasers').select(CHASER_COLUMNS).eq('tenant_id', tenantId).order('created_at', { ascending: true });
  if (filter.status) q = q.eq('status', filter.status);
  const { data, error } = await q;
  if (error) throw new Error(`chasers: ${error.message}`);
  const rows = (data ?? []) as Omit<Chaser, 'steps'>[];
  if (!rows.length) return [];
  const { data: steps, error: stepError } = await db
    .from('chaser_steps')
    .select(STEP_COLUMNS)
    .in('chaser_id', rows.map((r) => r.id));
  if (stepError) throw new Error(`chaser_steps: ${stepError.message}`);
  return attach(rows, (steps ?? []) as ChaserStep[]);
}

export async function loadChaser(db: Db, tenantId: string, id: string): Promise<Chaser | null> {
  const { data, error } = await db.from('chasers').select(CHASER_COLUMNS).eq('tenant_id', tenantId).eq('id', id).maybeSingle();
  if (error) throw new Error(`chasers: ${error.message}`);
  if (!data) return null;
  const { data: steps } = await db.from('chaser_steps').select(STEP_COLUMNS).eq('chaser_id', id);
  return attach([data as Omit<Chaser, 'steps'>], (steps ?? []) as ChaserStep[])[0];
}

/** The active reminder for an event, if the school has one turned on. */
export async function activeChaserFor(db: Db, tenantId: string, eventKey: string): Promise<Chaser | null> {
  const { data } = await db
    .from('chasers')
    .select(CHASER_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('event_key', eventKey)
    .eq('status', 'active')
    .order('is_system', { ascending: false })
    .limit(1);
  const row = data?.[0];
  if (!row) return null;
  const { data: steps } = await db.from('chaser_steps').select(STEP_COLUMNS).eq('chaser_id', row.id);
  return attach([row as Omit<Chaser, 'steps'>], (steps ?? []) as ChaserStep[])[0];
}

/**
 * The school's reminder for an event whatever its status, so code that sent a
 * message before reminders existed keeps doing so until the team changes it:
 * null when the tables aren't there yet.
 */
export async function chaserForEvent(db: Db, tenantId: string, eventKey: string): Promise<Chaser | null | 'missing'> {
  try {
    await ensureSeeded(db, tenantId);
  } catch {
    return 'missing';
  }
  const { data, error } = await db
    .from('chasers')
    .select(CHASER_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('event_key', eventKey)
    .order('is_system', { ascending: false })
    .limit(1);
  if (error) return 'missing';
  const row = data?.[0];
  if (!row) return null;
  const { data: steps } = await db.from('chaser_steps').select(STEP_COLUMNS).eq('chaser_id', row.id);
  return attach([row as Omit<Chaser, 'steps'>], (steps ?? []) as ChaserStep[])[0];
}

export function eventOf(chaser: Pick<Chaser, 'event_key'>): CatalogEvent | undefined {
  return CATALOG_BY_KEY[chaser.event_key];
}
