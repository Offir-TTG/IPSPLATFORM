/**
 * Single source of truth for Handlebars helpers used across the
 * email pipeline. Anywhere that compiles a template — the
 * templateEngine, the process-email-queue cron, the queue preview
 * endpoint — must import this file so the helpers below are
 * registered on the same Handlebars singleton before compile() runs.
 *
 * Why centralised: the same Node Handlebars instance is shared
 * across imports, but only modules that get IMPORTED have their
 * side-effect code execute. Registering `eq` in templateEngine.ts
 * doesn't help the cron route if the cron route never imports
 * templateEngine.ts — and that mismatch is exactly the bug we hit
 * ("Missing helper: 'eq'" when process-email-queue rendered the
 * notification.generic template).
 */

import Handlebars from 'handlebars';

let registered = false;

// Public, explicitly-callable registration so consumers don't rely
// on side-effect import behaviour. Next.js' webpack will tree-shake
// a bare `import '...handlebarsHelpers'` when the importer doesn't
// reference any exported symbol, which is exactly the bug that
// resurrected "Missing helper: eq" in production. Call this from
// every Handlebars-compiling route at module top.
export function ensureHandlebarsHelpers(): void {
  if (registered) return;
  registered = true;

  Handlebars.registerHelper('formatCurrency', function (amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  });

  Handlebars.registerHelper('formatDate', function (date: string | Date, locale: string) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  });

  Handlebars.registerHelper('formatTime', function (date: string | Date, locale: string) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale || 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  });

  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  Handlebars.registerHelper('ne', function (a: any, b: any) {
    return a !== b;
  });

  Handlebars.registerHelper('gt', function (a: number, b: number) {
    return a > b;
  });

  Handlebars.registerHelper('lt', function (a: number, b: number) {
    return a < b;
  });

  Handlebars.registerHelper('or', function (...args: any[]) {
    // Strip the Handlebars options object that always comes last.
    return args.slice(0, -1).some((v) => !!v);
  });

  Handlebars.registerHelper('and', function (...args: any[]) {
    return args.slice(0, -1).every((v) => !!v);
  });
}

// Module-load side-effect as a defence-in-depth: in builds that
// don't tree-shake the side-effect import, this still runs.
ensureHandlebarsHelpers();
