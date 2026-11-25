/**
 * The daily summary: clients who chose "one email a day" get every update of
 * the day in one email, at the school's summary time (Sending settings).
 * Updates wait in digest_items until then.
 *
 * Server only.
 */

import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { renderEmailLayout } from '@/lib/email/layout';
import { DEFAULT_FALLBACK_TIMEZONE, wallTimeToUTC } from '@/lib/datetime/timezone';
import { loadSchool } from './deliver';
import { CATEGORY_LABEL_EN, CATEGORY_LABEL_HE, type MessageCategory } from './categories';

type Db = ReturnType<typeof createAdminClient>;

const ORDER: MessageCategory[] = ['payment', 'lesson', 'assignment', 'enrollment', 'achievement', 'announcement', 'system'];

interface Item {
  id: string;
  user_id: string;
  category: string | null;
  title: string;
  body: string | null;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function noHandlebars(s: string): string {
  return s.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;');
}

/** The latest summary moment at or before `now`, in the school's zone. */
export function lastSummaryMoment(now: Date, timezone: string, digestTime: string): Date {
  const hhmm = (digestTime || '18:00').slice(0, 5);
  const ymd = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const today = new Date(wallTimeToUTC(`${ymd(now)}T${hhmm}`, timezone));
  if (today.getTime() <= now.getTime()) return today;
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return new Date(wallTimeToUTC(`${ymd(yesterday)}T${hhmm}`, timezone));
}

export function buildSummaryEmail(args: {
  lang: 'he' | 'en';
  firstName: string;
  items: Item[];
  settingsUrl: string | null;
  school: Awaited<ReturnType<typeof loadSchool>>;
}) {
  const { lang, firstName, items, settingsUrl, school } = args;
  const he = lang === 'he';
  const labels = he ? CATEGORY_LABEL_HE : CATEGORY_LABEL_EN;
  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const key = it.category && (ORDER as string[]).includes(it.category) ? it.category : 'announcement';
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const ordered = ORDER.filter((c) => groups.has(c));
  const subject = he ? `הסיכום היומי שלך · ${items.length} עדכונים` : `Your daily summary · ${items.length} updates`;
  const sections = ordered
    .map((cat) => {
      const rows = groups
        .get(cat)!
        .map((it) => {
          const link = it.action_url
            ? `<br><a href="${escapeHtml(it.action_url)}" style="color:${escapeHtml(school.buttonColor || '#6B4590')};font-weight:700;font-size:14px;">${escapeHtml(it.action_label || (he ? 'לפרטים' : 'Details'))}</a>`
            : '';
          const body = it.body ? `<br><span style="color:#4b5563;">${escapeHtml(it.body).replace(/\n/g, '<br>')}</span>` : '';
          return `<tr><td style="padding:8px 0;font-size:15px;line-height:1.6;"><strong>${escapeHtml(it.title)}</strong>${body}${link}</td></tr>`;
        })
        .join('');
      return `<div style="border-top:1px solid #eeeaf3;padding:14px 0 6px;"><div style="font-size:13px;font-weight:800;color:${escapeHtml(
        school.primaryColor || '#6B4590',
      )};margin-bottom:4px;">${escapeHtml(labels[cat])}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></div>`;
    })
    .join('');
  const greeting = firstName ? (he ? `שלום ${firstName},` : `Hi ${firstName},`) : he ? 'שלום,' : 'Hi,';
  const inner = [
    `<p style="margin:0 0 6px;font-size:17px;font-weight:700;">${escapeHtml(greeting)}</p>`,
    `<p style="margin:0 0 16px;color:#4b5563;">${he ? 'אלה העדכונים של היום.' : "Here are today's updates."}</p>`,
    sections,
    settingsUrl
      ? `<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">${
          he ? 'קיבלת סיכום אחד ביום לפי ההגדרות שלך.' : 'You get one summary a day, as you chose.'
        } <a href="${escapeHtml(settingsUrl)}" style="color:#6b7280;">${he ? 'שינוי הגדרות העדכונים' : 'Change update settings'}</a></p>`
      : '',
  ].join('\n');
  const html = renderEmailLayout(inner, {
    language: lang,
    organizationName: school.name,
    primaryColor: school.primaryColor,
    buttonColor: school.buttonColor,
    logoUrl: school.logoUrl,
    headerStyle: school.headerStyle,
    footerNote: school.footerNote,
    preheader: items[0]?.title,
  });
  const text = [
    greeting,
    '',
    ...ordered.flatMap((cat) => [
      labels[cat],
      ...groups.get(cat)!.map((it) => `• ${it.title}${it.body ? ` — ${it.body}` : ''}${it.action_url ? `\n  ${it.action_url}` : ''}`),
      '',
    ]),
    settingsUrl ?? '',
  ].join('\n');
  return { subject, html, text };
}

/** Sends every summary that is due. Returns how many were queued. */
export async function sendDueSummaries(opts: { dryRun?: boolean } = {}): Promise<{ queued: number; clients: number }> {
  const db: Db = createAdminClient();
  const now = new Date();
  const { data: waiting, error } = await db
    .from('digest_items')
    .select('id, tenant_id, user_id, category, title, body, action_url, action_label, created_at')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(2000);
  if (error) throw new Error(`digest_items: ${error.message}`);
  if (!waiting?.length) return { queued: 0, clients: 0 };

  // Per school: the latest summary moment; items from before it are due.
  const tenants = [...new Set(waiting.map((w: any) => w.tenant_id as string))];
  const cutoff = new Map<string, Date>();
  for (const t of tenants) {
    const [{ data: s }, school] = await Promise.all([
      db.from('message_settings').select('digest_time').eq('tenant_id', t).maybeSingle(),
      loadSchool(db, t),
    ]);
    cutoff.set(t, lastSummaryMoment(now, school.timezone || DEFAULT_FALLBACK_TIMEZONE, s?.digest_time || '18:00'));
  }

  const byUser = new Map<string, { tenantId: string; items: Item[] }>();
  for (const w of waiting as any[]) {
    if (new Date(w.created_at).getTime() > cutoff.get(w.tenant_id)!.getTime()) continue;
    const entry = byUser.get(w.user_id) ?? { tenantId: w.tenant_id as string, items: [] as Item[] };
    entry.items.push(w);
    byUser.set(w.user_id, entry);
  }
  if (opts.dryRun) return { queued: 0, clients: byUser.size };

  let queued = 0;
  for (const [userId, { tenantId, items }] of byUser) {
    const [{ data: u }, school] = await Promise.all([
      db.from('users').select('email, first_name, last_name, preferred_language').eq('id', userId).maybeSingle(),
      loadSchool(db, tenantId),
    ]);
    const ids = items.map((i) => i.id);
    if (!u?.email) {
      await db.from('digest_items').update({ sent_at: now.toISOString() }).in('id', ids);
      continue;
    }
    const lang: 'he' | 'en' = u.preferred_language === 'en' ? 'en' : 'he';
    const settingsUrl = school.portalBase ? `${school.portalBase}/profile?tab=notify` : null;
    const mail = buildSummaryEmail({ lang, firstName: (u.first_name || '').trim(), items, settingsUrl, school });
    const logId = randomUUID();
    const queueId = randomUUID();
    const { error: logError } = await db.from('message_log').insert({
      id: logId,
      tenant_id: tenantId,
      user_id: userId,
      to_email: u.email,
      source: 'digest',
      category: null,
      title: mail.subject,
      outcome: 'email_only',
      email_queue_id: queueId,
    });
    const { error: qError } = await db.from('email_queue').insert({
      id: queueId,
      tenant_id: tenantId,
      to_email: u.email,
      to_name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      user_id: userId,
      language_code: lang,
      subject: noHandlebars(mail.subject),
      body_html: noHandlebars(mail.html),
      body_text: noHandlebars(mail.text),
      template_variables: {},
      priority: 'normal',
      status: 'pending',
      trigger_type: 'automated',
      trigger_event: 'daily_summary',
      message_log_id: logError ? null : logId,
    });
    if (qError) {
      console.error('[daily summary] queue insert failed', qError.message);
      continue;
    }
    await db.from('digest_items').update({ sent_at: now.toISOString() }).in('id', ids);
    queued++;
  }
  return { queued, clients: byUser.size };
}
