'use client';

/**
 * What a client gets from one reminder step, as it is configured right now:
 * the email exactly as it is built when sent (in the school's email design,
 * with sample details) and the portal bell. Updates with every change.
 */

import { useEffect, useMemo, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { fillPlaceholders, sampleValues, type CatalogEvent } from '@/lib/messaging/catalog';
import { actionPath } from '@/lib/messaging/context';
import { buildStandardEmail, type EmailBrand } from '@/lib/messaging/emailLook';
import { htmlToText, sanitizeMessageHtml } from '@/lib/messaging/html';
import type { StepInput } from '@/lib/messaging/admin';

let brandCache: { brand: EmailBrand; portal: string } | null = null;

/** The school's email design and portal address (Communications settings), loaded once. */
export function useEmailBrand() {
  const [b, setB] = useState(brandCache);
  useEffect(() => {
    if (brandCache) return;
    fetch('/api/admin/tenant', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        const d = j?.data ?? {};
        brandCache = {
          brand: {
            name: d.name || '',
            primaryColor: d.email_primary_color || d.primary_color || undefined,
            buttonColor: d.email_button_color || d.email_primary_color || d.primary_color || undefined,
            logoUrl: d.email_logo_url || d.logo_url || undefined,
            headerStyle: d.email_header_style || undefined,
            footerNote: d.email_footer_text || undefined,
          },
          portal: String(d.portal_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, ''),
        };
        setB(brandCache);
      })
      .catch(() => {
        brandCache = { brand: { name: '' }, portal: typeof window !== 'undefined' ? window.location.origin : '' };
        setB(brandCache);
      });
  }, []);
  return b;
}

export function MessagePreview({ ev, step, height = 560 }: { ev: CatalogEvent; step: StepInput; height?: number }) {
  const { t } = useAdminLanguage();
  const brand = useEmailBrand();
  const [view, setView] = useState<'email' | 'bell'>(step.send_email ? 'email' : 'bell');

  useEffect(() => {
    if (!step.send_email) setView('bell');
  }, [step.send_email]);

  const built = useMemo(() => {
    const values = sampleValues(ev, 'he');
    const title = fillPlaceholders(step.title_he, ev, values);
    const html = fillPlaceholders(step.body_he, ev, values);
    const action = ev.actions.find((a) => a.key === step.action_key);
    const path = actionPath(step.action_key, {});
    const portal = brand?.portal ?? '';
    const mail = buildStandardEmail({
      lang: 'he',
      firstName: values.name ?? '',
      title,
      body: htmlToText(html),
      bodyHtml: html,
      actionUrl: path ? `${portal}${path}` : null,
      actionLabel: action?.he ?? null,
      settingsUrl: ev.audience === 'team' ? null : `${portal}/profile?tab=notify`,
      school: brand?.brand ?? { name: '' },
    });
    return { title, html, text: htmlToText(html), action, mail };
  }, [ev, step, brand]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={joinedBar}>
          <button type="button" aria-pressed={view === 'email'} onClick={() => setView('email')} className={joinedSegment(view === 'email')}>
            <Mail className="h-4 w-4" aria-hidden />
            {t('admin.reminders.preview.email', 'Email')}
          </button>
          <button type="button" aria-pressed={view === 'bell'} onClick={() => setView('bell')} className={joinedSegment(view === 'bell')}>
            <Bell className="h-4 w-4" aria-hidden />
            {t('admin.reminders.preview.bell', 'Portal bell')}
          </button>
        </div>
        <span className="text-[12.5px] text-muted-foreground">{t('admin.reminders.preview.sample', 'With sample details')}</span>
      </div>

      {view === 'email' ? (
        <>
          {!step.send_email && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {t('admin.reminders.preview.noEmail', "This step doesn't send an email; it goes to the portal bell only.")}
            </p>
          )}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-muted/40 px-3.5 py-2 text-[13px]">
              <span className="text-muted-foreground">{t('admin.reminders.preview.subject', 'Subject')}: </span>
              <b dir="rtl">{built.mail.subject || '—'}</b>
            </div>
            <iframe title={t('admin.reminders.preview.emailTitle', 'How the email looks')} srcDoc={built.mail.html} sandbox="" className="w-full border-0 bg-white" style={{ height }} />
          </div>
        </>
      ) : (
        <div dir="rtl" className="rounded-xl border border-border bg-[#faf8fd] p-4 dark:bg-muted/30">
          <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 shadow-sm dark:bg-card">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden>
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="font-bold [overflow-wrap:anywhere]">{built.title || '—'}</div>
              <div className="prose prose-sm mt-1 max-w-none text-[14px] dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(built.html) }} />
              {built.action && <span className="mt-2 inline-block text-sm font-semibold text-primary">{built.action.he} ←</span>}
            </div>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{t('admin.reminders.preview.bellNote', 'Every client sees this in the portal bell, whatever their settings.')}</p>
        </div>
      )}
    </div>
  );
}
