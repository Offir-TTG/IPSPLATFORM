'use client';

/**
 * Shared helpers for the child-coaching admin pages. The look follows the
 * other admin pages (enrollments, payment plans, products): ui Card, Button,
 * Badge, Input, Select, Label, Alert and the same header and spinner.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatInTimezone, utcToWallTime, wallTimeToUTC } from '@/lib/datetime/timezone';

/** All coaching times are shown and picked in Israel time. */
export const COACHING_TZ = 'Asia/Jerusalem';

export type TFn = (key: string, fallback?: any) => string;
export type Dir = 'ltr' | 'rtl';

/** Translate, then fill {name} placeholders. */
export function tf(t: TFn, key: string, fallback: string, vars: Record<string, string | number> = {}) {
  let s = t(key, fallback);
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** fetch + JSON; throws an Error carrying the server's {error} text. */
export async function api<T = any>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // The status and answer ride along, for callers that act on a specific refusal.
  if (!res.ok) throw Object.assign(new Error(data?.error || `${res.status} ${res.statusText}`), { status: res.status, data });
  return data as T;
}

export const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const localeOf = (language?: string) => (language === 'en' ? 'en-GB' : 'he-IL');

export function fmtDateTime(iso: string | null | undefined, language?: string) {
  if (!iso) return '';
  return formatInTimezone(iso, COACHING_TZ, { weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }, localeOf(language));
}

export function fmtDate(iso: string | null | undefined, language?: string) {
  if (!iso) return '';
  return formatInTimezone(iso, COACHING_TZ, { day: 'numeric', month: 'numeric', year: 'numeric' }, localeOf(language));
}

export function fmtTime(iso: string | null | undefined, language?: string) {
  if (!iso) return '';
  return formatInTimezone(iso, COACHING_TZ, { hour: '2-digit', minute: '2-digit', hour12: false }, localeOf(language));
}

/** "today, 09:12" / "yesterday, 20:40" / "3 days ago" */
export function fmtSent(iso: string, t: TFn, language?: string) {
  const day = (d: string) => utcToWallTime(d, COACHING_TZ).slice(0, 10);
  const diffDays = Math.round((Date.parse(day(new Date().toISOString())) - Date.parse(day(iso))) / 86400000);
  const time = fmtTime(iso, language);
  if (diffDays <= 0) return tf(t, 'admin.coaching.time.today', 'היום, {time}', { time });
  if (diffDays === 1) return tf(t, 'admin.coaching.time.yesterday', 'אתמול, {time}', { time });
  if (diffDays < 14) return tf(t, 'admin.coaching.time.daysAgo', 'לפני {n} ימים', { n: diffDays });
  return fmtDate(iso, language);
}

/** Picked Israel date ("YYYY-MM-DD") + time ("HH:MM") → UTC ISO. */
export function localToIso(date: string, time: string) {
  return wallTimeToUTC(`${date}T${time}`, COACHING_TZ);
}

/** UTC ISO → {date, time} in Israel time, for form inputs. */
export function isoToLocal(iso: string) {
  const wall = utcToWallTime(iso, COACHING_TZ);
  return { date: wall.slice(0, 10), time: wall.slice(11, 16) };
}

export function childLabel(t: TFn, name: string | null | undefined, age: number | null | undefined) {
  const n = name || t('admin.coaching.common.noChildName', 'ילד ללא שם');
  return age != null ? tf(t, 'admin.coaching.common.childWithAge', '{name}, גיל {age}', { name: n, age }) : n;
}

export function priceText(price: number | null | undefined, currency: string | null | undefined, language?: string) {
  if (price == null) return '';
  try {
    return new Intl.NumberFormat(localeOf(language), { style: 'currency', currency: currency || 'ILS', maximumFractionDigits: 2 }).format(price);
  } catch {
    return `${price} ${currency ?? ''}`.trim();
  }
}

export function coachOptionLabel(t: TFn, c: { name: string; weekly_hours: number }) {
  return c.weekly_hours > 0
    ? tf(t, 'admin.coaching.newPack.coachHours', '{name} · {hours} שעות פנויות בשבוע', { name: c.name, hours: c.weekly_hours })
    : tf(t, 'admin.coaching.newPack.coachNoHours', '{name} · עוד לא הוגדרו שעות', { name: c.name });
}

// ---------- UI pieces built on src/components/ui ----------

/** Large (44px) admin button on top of ui/Button. */
export function Btn({
  tone = 'outline',
  busy,
  className,
  children,
  disabled,
  ...rest
}: Omit<ButtonProps, 'variant'> & { tone?: 'primary' | 'outline' | 'primaryOutline' | 'danger' | 'ghost'; busy?: boolean }) {
  const variant: ButtonProps['variant'] = tone === 'primary' ? 'default' : tone === 'ghost' ? 'ghost' : 'outline';
  const extra = tone === 'primaryOutline' ? 'border-primary text-primary' : tone === 'danger' ? 'text-destructive hover:text-destructive' : '';
  return (
    <Button type="button" variant={variant} disabled={disabled || busy} className={cn('h-auto min-h-[44px] gap-2 py-2', extra, className)} {...rest}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}

/** Page header like the enrollments / plans pages. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1
          suppressHydrationWarning
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)' as any,
            color: 'hsl(var(--text-heading))',
          }}
        >
          {title}
        </h1>
        {description && (
          <p suppressHydrationWarning style={{ color: 'hsl(var(--muted-foreground))', fontSize: 'var(--font-size-sm)', marginTop: '0.25rem' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Card section with an optional title row. */
export function Section({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      {(title || action) && (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(!(title || action) && 'pt-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function BackLink({ href, children, isRtl }: { href: string; children: React.ReactNode; isRtl: boolean }) {
  const Icon = isRtl ? ArrowRight : ArrowLeft;
  return (
    <Button asChild variant="ghost" className="h-11 w-fit px-2 text-muted-foreground">
      <Link href={href}>
        <Icon className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
        {children}
      </Link>
    </Button>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  );
}

/** Label + control + red reason + optional hint. */
export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id?: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Spinner used by the other admin pages. */
export function Loading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center" role="status">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function ErrorBox({ t, message, onRetry }: { t: TFn; message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{t('admin.coaching.common.loadError', 'לא הצלחנו לטעון את המידע')}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <Btn onClick={onRetry}>{t('admin.coaching.common.retry', 'לנסות שוב')}</Btn>
      </AlertDescription>
    </Alert>
  );
}

/** Empty list, like "No enrollments found". */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-8 text-center text-muted-foreground">{children}</div>;
}

/** Status badge. Colours match the payment-status badges on the enrollments page. */
export function Pill({ tone = 'gray', children }: { tone?: 'gray' | 'blue' | 'green' | 'amber' | 'red'; children: React.ReactNode }) {
  if (tone === 'blue') return <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">{children}</Badge>;
  if (tone === 'gray') return <Badge variant="outline" className="px-3 py-1 text-xs font-medium">{children}</Badge>;
  const colours: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border-green-300',
    amber: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    red: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <Badge variant="outline" className={cn('px-3 py-1 text-xs font-medium', colours[tone])}>
      {children}
    </Badge>
  );
}

/** Note box ("what happens next", warnings) on ui/Alert. */
export function Note({ title, children, tone = 'info' }: { title?: React.ReactNode; children: React.ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <Alert className={tone === 'warn' ? 'border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100' : 'bg-muted/40'}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="space-y-1">{children}</AlertDescription>
    </Alert>
  );
}

/** ui/Select with the RTL handling the other admin pages use. */
export function UiSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  direction,
  className,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  direction: Dir;
  className?: string;
  ariaLabel?: string;
}) {
  const isRtl = direction === 'rtl';
  const align = isRtl ? 'text-right' : 'text-left';
  return (
    <Select value={value || undefined} onValueChange={onChange} dir={direction}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn('h-11', align, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir={direction} className={align}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className={align}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Row container used inside list cards (mobile-friendly). */
export const rowCls = 'flex flex-wrap items-center gap-3 border-b p-4 last:border-b-0';

/** Input height for the non-technical admin. */
export const inputCls = 'h-11';
