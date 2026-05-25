'use client';

/**
 * Pretty renderer for `cron_runs.summary` (JSONB) values.
 *
 * Crons emit small JSON objects: { sent: 9, failed: 0, success: true,
 * message: "..." }. Showing raw `JSON.stringify(summary)` in the
 * monitor table is technically informative but unreadable. This
 * component picks out the keys we know about and renders them as
 * coloured chips (collapsed) or a key/value grid (expanded).
 *
 * Anything unrecognised falls through to a `key: value` row so we
 * never silently lose information.
 */

import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

type Summary = Record<string, unknown> | null;

// Keys that already have a dedicated badge somewhere on the row, or
// that are redundant noise. Hide them from the rendered output.
const HIDE_KEYS = new Set(['dry_run', 'ok']);

// Numeric metric keys that get a coloured chip. The tone hints at
// severity: greens for completion, reds for failures, blues for
// throughput, neutral grey for raw counts.
const METRIC_TONE: Record<string, string> = {
  sent: 'text-emerald-700 dark:text-emerald-300',
  delivered: 'text-emerald-700 dark:text-emerald-300',
  completed: 'text-emerald-700 dark:text-emerald-300',
  failed: 'text-red-700 dark:text-red-300',
  errors: 'text-red-700 dark:text-red-300',
  processed: 'text-sky-700 dark:text-sky-300',
  enqueued: 'text-sky-700 dark:text-sky-300',
  picked: 'text-sky-700 dark:text-sky-300',
  found: 'text-sky-700 dark:text-sky-300',
  would_send: 'text-amber-700 dark:text-amber-300',
  would_retry: 'text-amber-700 dark:text-amber-300',
  would_suspend: 'text-amber-700 dark:text-amber-300',
  advanced: 'text-muted-foreground',
};

// English defaults for keys we recognise. Used as the `t()` fallback
// so the table still reads sensibly before translations are seeded.
const KEY_LABEL: Record<string, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  completed: 'Completed',
  failed: 'Failed',
  errors: 'Errors',
  processed: 'Processed',
  enqueued: 'Enqueued',
  picked: 'Picked',
  found: 'Found',
  advanced: 'Advanced',
  would_send: 'Would send',
  would_retry: 'Would retry',
  would_suspend: 'Would suspend',
  message: 'Message',
  success: 'Success',
  reason: 'Reason',
  total: 'Total',
  total_overdue: 'Overdue',
};

function snakeToTitle(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// `t` is the translation function from useAdminLanguage. We pass it
// rather than calling the hook here because both the chips and grid
// components share this lookup.
function humanKey(t: (k: string, fallback: string) => string, key: string): string {
  return t(`admin.crons.summary.${key}`, KEY_LABEL[key] ?? snakeToTitle(key));
}

// Known cron-summary `message` strings. The cron files emit these as
// English literals; translating them client-side means we don't have
// to schema-change cron returns. Two flavours:
//   - STATIC: exact match → translation key
//   - DYNAMIC: regex match → translation key + named placeholders
// Anything not matched falls through as the raw string (still
// readable, just not translated).
const STATIC_MESSAGES: Record<string, string> = {
  'No overdue payments': 'admin.crons.message.noOverduePayments',
  'No upcoming lessons': 'admin.crons.message.noUpcomingLessons',
  'No pending emails': 'admin.crons.message.noPendingEmails',
  'No payments to retry': 'admin.crons.message.noPaymentsToRetry',
  'Email queue processing completed': 'admin.crons.message.emailQueueDone',
  'Lesson reminder job completed': 'admin.crons.message.lessonReminderDone',
  'Dry-run enabled; skipped invoice creation': 'admin.crons.message.dryRunInvoicesSkipped',
};

type DynamicMessage = {
  re: RegExp;
  key: string;
};

const DYNAMIC_MESSAGES: DynamicMessage[] = [
  { re: /^Dry-run enabled; would suspend (\d+) enrollments$/, key: 'admin.crons.message.dryRunWouldSuspend' },
  { re: /^Suspended (\d+) enrollments with overdue payments$/, key: 'admin.crons.message.suspendedOverdue' },
  { re: /^Created (\d+) invoices, (\d+) failed$/, key: 'admin.crons.message.createdInvoices' },
  { re: /^Dry-run enabled; would scan (\d+) lessons for reminders$/, key: 'admin.crons.message.dryRunWouldScan' },
  { re: /^Dry-run enabled; would send (\d+) emails$/, key: 'admin.crons.message.dryRunWouldSend' },
  { re: /^Dry-run enabled; would retry (\d+) schedules$/, key: 'admin.crons.message.dryRunWouldRetry' },
  { re: /^Retried (\d+) payments, (\d+) failed$/, key: 'admin.crons.message.retriedPayments' },
];

function translateMessage(
  t: (k: string, fallback: string) => string,
  msg: string,
): string {
  // Exact match first.
  const staticKey = STATIC_MESSAGES[msg];
  if (staticKey) return t(staticKey, msg);
  // Then patterns.
  for (const { re, key } of DYNAMIC_MESSAGES) {
    const m = msg.match(re);
    if (m) {
      // The translation value uses {{0}}, {{1}}, … placeholders for
      // each capture group, kept simple so we don't reinvent ICU.
      let out = t(key, msg);
      m.slice(1).forEach((cap, i) => {
        out = out.replace(`{{${i}}}`, cap);
      });
      return out;
    }
  }
  return msg;
}

function isMetric(key: string, value: unknown): boolean {
  return typeof value === 'number' && key in METRIC_TONE;
}

/** Inline collapsed view. Shows everything useful:
 *  - error message (if any) in red
 *  - all numeric metrics as coloured chips
 *  - the `message` field (if present) as muted italic
 *  - any other non-noise key/value pairs (booleans, strings, nums
 *    we don't know about) as plain `key: value` chips
 *  Nothing in the summary should silently disappear.
 */
export function SummaryChips({
  summary,
  errorMessage,
}: {
  summary: Summary;
  errorMessage: string | null;
}) {
  const { t } = useAdminLanguage();

  if (errorMessage) {
    return (
      <span className="block truncate text-xs text-destructive" dir="ltr">
        {errorMessage}
      </span>
    );
  }
  if (!summary || typeof summary !== 'object') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const entries = Object.entries(summary).filter(([k]) => !HIDE_KEYS.has(k));
  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const knownMetrics: Array<[string, number]> = [];
  const otherNumbers: Array<[string, number]> = [];
  const messageEntries: Array<[string, string]> = [];
  const otherEntries: Array<[string, unknown]> = [];

  for (const [k, v] of entries) {
    if (typeof v === 'number') {
      if (k in METRIC_TONE) knownMetrics.push([k, v]);
      else otherNumbers.push([k, v]);
    } else if (k === 'message' && typeof v === 'string') {
      messageEntries.push([k, v]);
    } else {
      otherEntries.push([k, v]);
    }
  }

  return (
    <div className="flex flex-col gap-1 text-xs">
      {/* Message gets its own full-width line on top so it never gets
          pushed off-screen by chips. Translated via the known-message
          map so e.g. "No pending emails" appears in Hebrew. */}
      {messageEntries.map(([, v]) => (
        <span key="msg" className="text-muted-foreground italic break-words" dir="auto">
          {translateMessage(t, v)}
        </span>
      ))}
      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
        {/* Coloured metric chips */}
        {knownMetrics.map(([k, v]) => (
          <span key={k} className="inline-flex items-baseline gap-1">
            <span className={`tabular-nums font-semibold ${METRIC_TONE[k] ?? ''}`}>{v}</span>
            <span className="text-muted-foreground">{humanKey(t, k).toLowerCase()}</span>
          </span>
        ))}
        {otherNumbers.map(([k, v]) => (
          <span key={k} className="inline-flex items-baseline gap-1">
            <span className="tabular-nums font-semibold">{v}</span>
            <span className="text-muted-foreground">{humanKey(t, k).toLowerCase()}</span>
          </span>
        ))}
        {otherEntries.map(([k, v]) => (
          <span key={k} className="inline-flex items-baseline gap-1">
            <span className="text-muted-foreground">{humanKey(t, k).toLowerCase()}:</span>
            <span className="font-medium truncate max-w-[10rem]" dir="auto">
              {typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Expanded view: full key/value grid with formatting. */
export function SummaryGrid({
  summary,
  errorMessage,
}: {
  summary: Summary;
  errorMessage: string | null;
}) {
  const { t } = useAdminLanguage();

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs space-y-1">
        <div className="flex items-center gap-1 font-medium text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          {t('admin.crons.summary.error', 'Error')}
        </div>
        <p className="text-muted-foreground break-words font-mono" dir="ltr">
          {errorMessage}
        </p>
      </div>
    );
  }
  if (!summary || typeof summary !== 'object' || Object.keys(summary).length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const entries = Object.entries(summary).filter(([k]) => !HIDE_KEYS.has(k));

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs rounded-md border bg-muted/30 p-3">
      {entries.map(([k, v]) => (
        <SummaryRow key={k} k={k} v={v} t={t} />
      ))}
    </dl>
  );
}

function SummaryRow({ k, v, t }: { k: string; v: unknown; t: (k: string, fb: string) => string }) {
  const label = humanKey(t, k);

  // Boolean: green check / red x + translated "yes" / "no" label
  // (rather than the raw English "true" / "false").
  if (typeof v === 'boolean') {
    return (
      <>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="flex items-center gap-1">
          {v ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className="text-muted-foreground">
            {v ? t('common.yes', 'Yes') : t('common.no', 'No')}
          </span>
        </dd>
      </>
    );
  }

  // Numeric metric: coloured value.
  if (typeof v === 'number') {
    const tone = METRIC_TONE[k] ?? '';
    return (
      <>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className={`tabular-nums font-semibold ${tone}`}>{v}</dd>
      </>
    );
  }

  // Message: italic + translated via the known-message map.
  if (k === 'message' && typeof v === 'string') {
    return (
      <>
        <dt className="text-muted-foreground flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          {label}
        </dt>
        <dd className="text-muted-foreground italic break-words" dir="auto">
          {translateMessage(t, v)}
        </dd>
      </>
    );
  }

  // String: plain.
  if (typeof v === 'string') {
    return (
      <>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="break-words" dir="auto">
          {v}
        </dd>
      </>
    );
  }

  // Nested object / array: pretty JSON in a small <code>.
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <code className="block font-mono text-[10px] whitespace-pre-wrap break-all">
          {JSON.stringify(v, null, 2)}
        </code>
      </dd>
    </>
  );
}
