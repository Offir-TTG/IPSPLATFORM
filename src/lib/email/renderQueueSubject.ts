import { renderEmailTemplate } from './templateEngine';

// `queue_triggered_email` stores the raw template subject in
// `email_queue.subject` (e.g. literal `{{notificationTitle}}`). The
// schedules list and queue list display this column directly, so
// without rendering the admin sees the placeholder instead of the
// recipient-facing subject. This helper renders subjects at queue
// time using the same Handlebars engine the send pipeline uses, with
// a permissive fallback so we never overwrite a real subject with
// an empty string on render error.
//
// Returns the rendered string, or the raw template if rendering
// produced nothing usable.
export function renderQueueSubject(
  rawSubject: string,
  variables: Record<string, any>,
): string {
  if (!rawSubject) return rawSubject;
  // Quick exit: no placeholders, nothing to do.
  if (!rawSubject.includes('{{')) return rawSubject;

  const result = renderEmailTemplate(rawSubject, '', variables);
  if (result.html && result.html.trim() !== '') return result.html;

  // Handlebars couldn't compile — do a minimal `{{var}}` substitution
  // so common placeholders still render. Conditional helpers are
  // unusual in subjects, so this is enough in practice.
  return rawSubject.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    const v = variables[key];
    return v === undefined || v === null ? m : String(v);
  });
}
