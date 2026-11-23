/**
 * The hourly steps for scheduled membership price changes:
 *   - sendDuePriceChangeNotices: for a change that applies to everyone,
 *     notice_days before its date, every current member gets an email with
 *     the new price and the date of their own first charge at it.
 *   - applyDuePriceChanges: on the date, the product price (or the plan's own
 *     price) moves to the new price, so new members pay it.
 *   - sendPriceChangeCancelledNotices: when an admin cancels a change members
 *     were already told about, they hear that the price stays.
 *
 * Emails use the editable templates 'subscription.price_change' and
 * 'subscription.price_change_cancelled' (Emails > Templates). Until those are
 * added for the organization, a built-in text in the same words is sent.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';
import { sendEmail } from '@/lib/email/send';
import { renderEmailLayout } from '@/lib/email/layout';
import { planSubscriptionAmount } from './paymentEngine';
import { changeMatches, type PriceChange } from './subscriptionPrice';

const COLLECTING = ['active', 'suspended'];

/** The next charge after `date` (same rules as the renewal job's addPeriod; kept here to avoid a circular import). */
function addPeriod(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }
  const months = frequency === 'annually' ? 12 : frequency === 'quarterly' ? 3 : 1;
  const d = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(d, lastDay));
  return next;
}

const today = () => new Date().toISOString().slice(0, 10);

function money(amount: number, currency: string, lang: 'he' | 'en') {
  try {
    return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function longDate(d: Date, lang: 'he' | 'en') {
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function portalUrl() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  return `${base}/billing`;
}

interface Member {
  enrollmentId: string;
  email: string;
  name: string;
  lang: 'he' | 'en';
  /** The first charge on or after the change's date. */
  chargeDate: Date;
}

/** The members a change reaches, each with their own first charge date at the new price. */
async function membersFor(db: any, change: PriceChange): Promise<Member[]> {
  const { data: product } = await db.from('products').select('id, title, payment_plan').eq('id', change.product_id).maybeSingle();
  const { data: enrollments } = await db
    .from('enrollments')
    .select('id, user_id, payment_plan_id, subscription_ends_at')
    .eq('product_id', change.product_id)
    .in('status', COLLECTING);
  const live = (enrollments || []).filter((e: any) => !e.subscription_ends_at && e.user_id);
  if (live.length === 0) return [];

  const planIds = [...new Set(live.map((e: any) => e.payment_plan_id).filter(Boolean))] as string[];
  const { data: plans } = planIds.length ? await db.from('payment_plans').select('*').in('id', planIds) : { data: [] as any[] };
  const planById = new Map((plans || []).map((p: any) => [p.id, p]));

  const reached = live.filter((e: any) => {
    const plan = e.payment_plan_id ? planById.get(e.payment_plan_id) : null;
    return changeMatches(change, e.payment_plan_id ?? null, planSubscriptionAmount(plan) !== null);
  });
  if (reached.length === 0) return [];

  const ids = reached.map((e: any) => e.id);
  const { data: rows } = await db
    .from('payment_schedules')
    .select('enrollment_id, payment_number, scheduled_date, status')
    .in('enrollment_id', ids)
    .eq('payment_type', 'subscription');
  const latest = new Map<string, any>();
  for (const r of rows || []) {
    if (r.status === 'cancelled' || r.status === 'refunded') continue;
    const cur = latest.get(r.enrollment_id);
    if (!cur || r.payment_number > cur.payment_number) latest.set(r.enrollment_id, r);
  }

  const userIds = [...new Set(reached.map((e: any) => e.user_id))];
  const { data: users } = await db.from('users').select('id, email, first_name, last_name, preferred_language').in('id', userIds);
  const userById = new Map((users || []).map((u: any) => [u.id, u]));

  const effective = new Date(`${change.effective_date}T00:00:00Z`);
  const out: Member[] = [];
  for (const e of reached) {
    const u: any = userById.get(e.user_id);
    if (!u?.email) continue;
    const plan: any = e.payment_plan_id ? planById.get(e.payment_plan_id) : null;
    const frequency = plan?.subscription_frequency || (product?.payment_plan as any)?.subscription_interval || 'monthly';
    // From the latest period, step forward to the first charge on or after the date.
    let charge = latest.get(e.id) ? new Date(latest.get(e.id).scheduled_date) : effective;
    for (let i = 0; i < 400 && charge < effective; i++) charge = addPeriod(charge, frequency);
    out.push({
      enrollmentId: e.id,
      email: u.email,
      name: `${u.first_name ?? ''}`.trim() || u.email,
      lang: u.preferred_language === 'en' ? 'en' : 'he',
      chargeDate: charge,
    });
  }
  return out;
}

async function branding(db: any, tenantId: string) {
  const { data } = await db.from('tenants').select('name, primary_color, email_primary_color, email_button_color').eq('id', tenantId).maybeSingle();
  return {
    organizationName: data?.name || 'IPS Platform',
    primaryColor: data?.email_primary_color || data?.primary_color || undefined,
    buttonColor: data?.email_button_color || undefined,
  };
}

/** Sends one email: the editable template if the organization has it, otherwise the built-in words. */
async function sendNotice(args: {
  db: any;
  tenantId: string;
  templateKey: string;
  to: string;
  lang: 'he' | 'en';
  variables: Record<string, string>;
  fallback: { subject: string; html: string; text: string };
}) {
  const viaTemplate = await sendTemplateEmail({
    tenantId: args.tenantId,
    templateKey: args.templateKey,
    to: args.to,
    variables: args.variables,
    language: args.lang,
  }).catch(() => ({ success: false }) as any);
  if (viaTemplate?.success) return true;
  const brand = await branding(args.db, args.tenantId);
  const res = await sendEmail({
    to: args.to,
    subject: args.fallback.subject,
    html: renderEmailLayout(args.fallback.html, { language: args.lang, ...brand }),
    text: args.fallback.text,
    tenantId: args.tenantId,
  });
  return !!res.success;
}

function noticeWords(lang: 'he' | 'en', v: Record<string, string>) {
  if (lang === 'he') {
    return {
      subject: `עדכון מחיר המנוי ב${v.productName}`,
      html: `<p>שלום ${v.userName},</p><p>רצינו לעדכן מראש: מחיר המנוי ב${v.productName} משתנה.</p><p style="font-size:18px"><s>${v.oldPrice}</s> &larr; <b>${v.newPrice}</b></p><p>המחיר החדש יחול מהחיוב שלך ב-<b>${v.chargeDate}</b>. עד אז הכול נשאר כרגיל.</p><p>אם תרצו להפסיק את המנוי, אפשר לעשות זאת בכל עת לפני כן באזור האישי.</p><p><a href="${v.portalUrl}">לאזור האישי</a></p>`,
      text: `שלום ${v.userName},\nמחיר המנוי ב${v.productName} משתנה מ-${v.oldPrice} ל-${v.newPrice}, מהחיוב שלך ב-${v.chargeDate}.\nאפשר להפסיק את המנוי לפני כן באזור האישי: ${v.portalUrl}`,
    };
  }
  return {
    subject: `Your ${v.productName} membership price is changing`,
    html: `<p>Hi ${v.userName},</p><p>A heads-up: the membership price for ${v.productName} is changing.</p><p style="font-size:18px"><s>${v.oldPrice}</s> &rarr; <b>${v.newPrice}</b></p><p>The new price applies from your charge on <b>${v.chargeDate}</b>. Until then nothing changes.</p><p>If you'd like to stop your membership, you can do so any time before then in your account.</p><p><a href="${v.portalUrl}">Go to my account</a></p>`,
    text: `Hi ${v.userName},\nThe membership price for ${v.productName} changes from ${v.oldPrice} to ${v.newPrice}, from your charge on ${v.chargeDate}.\nYou can stop your membership before then in your account: ${v.portalUrl}`,
  };
}

function cancelledWords(lang: 'he' | 'en', v: Record<string, string>) {
  if (lang === 'he') {
    return {
      subject: `מחיר המנוי ב${v.productName} לא משתנה`,
      html: `<p>שלום ${v.userName},</p><p>עדכון: שינוי המחיר שהודענו עליו בוטל. המנוי שלך ב${v.productName} נשאר ב-<b>${v.oldPrice}</b>.</p>`,
      text: `שלום ${v.userName},\nשינוי המחיר שהודענו עליו בוטל. המנוי שלך ב${v.productName} נשאר ב-${v.oldPrice}.`,
    };
  }
  return {
    subject: `Your ${v.productName} membership price stays the same`,
    html: `<p>Hi ${v.userName},</p><p>An update: the price change we told you about has been cancelled. Your ${v.productName} membership stays at <b>${v.oldPrice}</b>.</p>`,
    text: `Hi ${v.userName},\nThe price change we told you about has been cancelled. Your ${v.productName} membership stays at ${v.oldPrice}.`,
  };
}

/** Changes for everyone whose notice is due: each current member is emailed once. */
export async function sendDuePriceChangeNotices(): Promise<{ sent: number; errors: string[] }> {
  const db = createAdminClient();
  const errors: string[] = [];
  let sent = 0;
  const { data, error } = await db
    .from('subscription_price_changes')
    .select('*')
    .eq('applies_to', 'all')
    .is('cancelled_at', null)
    .is('notice_sent_at', null);
  if (error) return { sent, errors: [] }; // table not created yet
  const now = Date.now();
  for (const change of (data || []) as PriceChange[]) {
    const effective = new Date(`${String(change.effective_date).slice(0, 10)}T00:00:00Z`).getTime();
    if (effective - change.notice_days * 86400000 > now) continue; // not yet
    const { data: product } = await db.from('products').select('title').eq('id', change.product_id).maybeSingle();
    const members = await membersFor(db, { ...change, effective_date: String(change.effective_date).slice(0, 10) });
    for (const m of members) {
      const v = {
        userName: m.name,
        productName: product?.title || '',
        oldPrice: money(Number(change.old_amount), change.currency, m.lang),
        newPrice: money(Number(change.new_amount), change.currency, m.lang),
        chargeDate: longDate(m.chargeDate, m.lang),
        portalUrl: portalUrl(),
      };
      const ok = await sendNotice({ db, tenantId: change.tenant_id, templateKey: 'subscription.price_change', to: m.email, lang: m.lang, variables: v, fallback: noticeWords(m.lang, v) }).catch(() => false);
      if (ok) sent++;
      else errors.push(`Price change ${change.id}: notice to enrollment ${m.enrollmentId} was not sent`);
    }
    await db.from('subscription_price_changes').update({ notice_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', change.id);
  }
  return { sent, errors };
}

/** On a change's date, the product price (or the plan's own price) moves to the new price. */
export async function applyDuePriceChanges(): Promise<{ applied: number; errors: string[] }> {
  const db = createAdminClient();
  const errors: string[] = [];
  let applied = 0;
  const { data, error } = await db
    .from('subscription_price_changes')
    .select('*')
    .is('cancelled_at', null)
    .is('applied_at', null)
    .lte('effective_date', today());
  if (error) return { applied, errors: [] }; // table not created yet
  for (const change of (data || []) as PriceChange[]) {
    const res = change.payment_plan_id
      ? await db.from('payment_plans').update({ subscription_amount: change.new_amount }).eq('id', change.payment_plan_id)
      : await db.from('products').update({ price: change.new_amount }).eq('id', change.product_id).eq('tenant_id', change.tenant_id);
    if (res.error) {
      errors.push(`Price change ${change.id}: ${res.error.message}`);
      continue;
    }
    await db.from('subscription_price_changes').update({ applied_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', change.id);
    applied++;
  }
  return { applied, errors };
}

/** A cancelled change members were told about: they hear that the price stays. Returns how many were emailed. */
export async function sendPriceChangeCancelledNotices(change: PriceChange): Promise<number> {
  const db = createAdminClient();
  const { data: product } = await db.from('products').select('title').eq('id', change.product_id).maybeSingle();
  const members = await membersFor(db, { ...change, cancelled_at: null, effective_date: String(change.effective_date).slice(0, 10) });
  let told = 0;
  for (const m of members) {
    const v = { userName: m.name, productName: product?.title || '', oldPrice: money(Number(change.old_amount), change.currency, m.lang) };
    const ok = await sendNotice({ db, tenantId: change.tenant_id, templateKey: 'subscription.price_change_cancelled', to: m.email, lang: m.lang, variables: v, fallback: cancelledWords(m.lang, v) }).catch(() => false);
    if (ok) told++;
  }
  return told;
}
