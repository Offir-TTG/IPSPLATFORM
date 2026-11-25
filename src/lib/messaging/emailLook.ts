/**
 * How a message looks as an email: the greeting, the words, the button and
 * the settings line, inside the school's email layout. Used to send, and by
 * the wizard to show the admin exactly what clients will get.
 *
 * Pure, safe on the client.
 */

import { bulletproofButton, renderEmailLayout } from '@/lib/email/layout';
import { sanitizeMessageHtml } from './html';

/** The school's email look (Communications settings > Email branding). */
export interface EmailBrand {
  name: string;
  primaryColor?: string;
  buttonColor?: string;
  logoUrl?: string;
  headerStyle?: 'logo' | 'text' | 'none';
  footerNote?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildStandardEmail(args: {
  lang: 'he' | 'en';
  firstName: string;
  title: string;
  body: string;
  bodyHtml?: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  settingsUrl: string | null;
  school: EmailBrand;
}) {
  const { lang, firstName, title, body, bodyHtml, actionUrl, actionLabel, settingsUrl, school } = args;
  const he = lang === 'he';
  const greeting = firstName ? (he ? `שלום ${firstName},` : `Hi ${firstName},`) : he ? 'שלום,' : 'Hi,';
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const label = actionLabel || (he ? 'לפרטים' : 'View details');
  // A reminder step brings its own words, greeting included.
  const words = bodyHtml
    ? [sanitizeMessageHtml(bodyHtml).replace(/<p>/g, '<p style="margin:0 0 14px;">')]
    : [
        `<p style="margin:0 0 16px;font-size:17px;font-weight:700;">${escapeHtml(greeting)}</p>`,
        ...paragraphs.map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`),
      ];
  const inner = [
    ...words,
    actionUrl ? `<div style="margin:24px 0 8px;">${bulletproofButton(actionUrl, label, school.buttonColor)}</div>` : '',
    settingsUrl
      ? `<p style="margin:28px 0 0;font-size:13px;color:#6b7280;">${
          he ? 'ההודעה נשלחה לפי הגדרות העדכונים שלך.' : 'Sent according to your update settings.'
        } <a href="${escapeHtml(settingsUrl)}" style="color:#6b7280;">${he ? 'שינוי ההגדרות' : 'Change settings'}</a></p>`
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
    preheader: paragraphs[0]?.slice(0, 90),
  });
  const text = [...(bodyHtml ? [] : [greeting, '']), ...paragraphs.flatMap((p) => [p, '']), actionUrl ? `${label}: ${actionUrl}` : '', settingsUrl ? `\n${settingsUrl}` : '']
    .join('\n')
    .trim();
  return { subject: title, html, text };
}
