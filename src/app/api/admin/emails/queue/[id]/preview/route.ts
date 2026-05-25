import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { renderEmailTemplate } from '@/lib/email/templateEngine';

export const dynamic = 'force-dynamic';

// GET /api/admin/emails/queue/[id]/preview
// Returns the rendered subject / body_html / body_text for a queue
// row — i.e. what the recipient actually sees.
//
// Why this endpoint exists: `queue_triggered_email` stores the raw
// template body in `email_queue` (placeholders intact) and renders
// only at SMTP-send time inside `process-email-queue`. The queue
// preview modal would otherwise show literal `{{notificationTitle}}`
// text, which is useless for "what will this look like".
//
// This route applies the same Handlebars engine the send pipeline
// uses, so what you see here matches what goes out the wire.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: caller } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('email_queue')
    .select('id, subject, body_html, body_text, template_variables, language_code, to_name, to_email')
    .eq('id', params.id)
    .eq('tenant_id', caller.tenant_id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: 'Queue row not found' }, { status: 404 });
  }

  // Pull tenant branding so {{organizationName}} / {{primaryColor}}
  // etc. resolve the same way the send pipeline does.
  const { data: tenant } = await admin
    .from('tenants')
    .select('name, primary_color, email_primary_color, email_button_color')
    .eq('id', caller.tenant_id)
    .single();

  // Compose the variables map the way process-email-queue would —
  // stored template_variables, plus per-row context (recipient name)
  // and tenant branding fallbacks. Any value already present in
  // template_variables wins, so admin-set fields aren't shadowed.
  const stored = (row.template_variables ?? {}) as Record<string, any>;
  const variables: Record<string, any> = {
    organizationName: tenant?.name || 'Learning Platform',
    primaryColor: tenant?.email_primary_color || tenant?.primary_color || '#667eea',
    secondaryColor: tenant?.email_button_color || '#764ba2',
    userName: row.to_name || row.to_email || 'there',
    language: row.language_code || 'en',
    ...stored,
  };

  const result = renderEmailTemplate(
    row.body_html || '',
    row.body_text || '',
    variables,
  );

  // Subject is its own template too — render with the same engine.
  const subjectResult = renderEmailTemplate(row.subject || '', '', variables);

  // Handlebars sometimes throws on the notification.generic template
  // (sub-expressions, mixed HTML, etc.) and returns an empty rendered
  // string. As a safety net we fall back to a manual substitution so
  // at minimum the top-level `{{placeholder}}` values render and the
  // admin sees meaningful copy instead of raw braces. Conditional
  // priority banners may still appear if Handlebars failed, but the
  // headline + body always render.
  const manual = manualSubstitute(row.body_html || '', variables, row.language_code || 'en');
  const manualText = manualSubstitute(row.body_text || '', variables, row.language_code || 'en');
  const manualSubject = manualSubstitute(row.subject || '', variables, row.language_code || 'en');

  const finalBodyHtml = result.html && result.html.trim() !== '' ? result.html : manual;
  const finalBodyText = result.text && result.text.trim() !== '' ? result.text : manualText;
  const finalSubject = subjectResult.html && subjectResult.html.trim() !== '' ? subjectResult.html : manualSubject;

  if (result.error || subjectResult.error) {
    console.error('[email queue preview] handlebars render error:', {
      bodyErr: result.error,
      subjectErr: subjectResult.error,
      queueId: row.id,
    });
  }

  return NextResponse.json({
    subject: finalSubject || row.subject || '',
    bodyHtml: finalBodyHtml,
    bodyText: finalBodyText,
    variables,
    error: result.error || subjectResult.error || null,
    renderer: result.error || subjectResult.error ? 'fallback' : 'handlebars',
  });
}

// Minimal stand-in for the Handlebars renderer used when Handlebars
// throws. Handles:
//   * `{{var}}` simple substitution
//   * `{{#if (eq <var> "<value>")}}...{{else if (eq <var> "<value>")}}...{{/if}}`
//     blocks — strips the false branch, keeps the matching one. This
//     is the only sub-expression the notification.generic template
//     uses, so covering it makes the preview look right even if
//     full Handlebars can't compile.
//   * `{{formatCurrency amount currency}}` / `{{formatDate date lang}}`
//     using Intl.
// Anything else (nested if blocks, helpers we don't recognise) is
// left intact so the admin can still see the template's intent.
function manualSubstitute(
  template: string,
  vars: Record<string, any>,
  lang: string,
): string {
  if (!template) return '';
  let out = template;

  // {{#if (eq var "value")}}...{{else if (eq var "value")}}...{{/if}}
  out = out.replace(
    /\{\{#if\s+\(eq\s+(\w+)\s+"([^"]+)"\)\}\}([\s\S]*?)(?:\{\{else\s+if\s+\(eq\s+\1\s+"([^"]+)"\)\}\}([\s\S]*?))?\{\{\/if\}\}/g,
    (_match, key, val1, branch1, val2, branch2) => {
      const actual = String(vars[key] ?? '');
      if (actual === val1) return branch1 ?? '';
      if (val2 && actual === val2) return branch2 ?? '';
      return '';
    },
  );

  // {{#if var}}...{{/if}}
  out = out.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key, content) => (vars[key] ? content : ''),
  );

  // {{formatCurrency amount currency}}
  out = out.replace(
    /\{\{formatCurrency\s+(\w+)\s+(\w+)\}\}/g,
    (match, amountKey, currencyKey) => {
      const amount = vars[amountKey];
      if (amount === undefined || amount === null || amount === '') return match;
      const currency = vars[currencyKey] || 'USD';
      try {
        return new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-US', {
          style: 'currency',
          currency,
        }).format(parseFloat(String(amount)));
      } catch {
        return `${amount} ${currency}`;
      }
    },
  );

  // {{formatDate date lang}}
  out = out.replace(/\{\{formatDate\s+(\w+)\s+\w+\}\}/g, (match, dateKey) => {
    const d = vars[dateKey];
    if (!d) return match;
    try {
      return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(d));
    } catch {
      return String(d);
    }
  });

  // {{var}} simple substitution — last so the helpers above had a
  // chance to consume their own patterns.
  out = out.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return match;
    return String(v);
  });

  return out;
}
