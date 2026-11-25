'use client';

/**
 * The building blocks of the IParentingSchool admin, copied for the
 * notifications pages so they look and behave the same: list pieces
 * (header, toolbar, pills, the list card and its rows, the footer with
 * pages) and wizard pieces (a step screen with its help box, choice cards,
 * summary rows, the "what's missing" note).
 *
 * IParentingSchool's purple accent is IPSPlatform's primary colour here, so
 * the pages fit this admin and follow its dark mode. Only the look lives
 * here; each page keeps its own data and actions.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Sparkles, X, type LucideIcon } from 'lucide-react';

export const LIST_PAGE_SIZE = 10;

export const kitButton = {
  primary:
    'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
  secondary:
    'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-4 text-sm font-medium text-primary hover:bg-muted disabled:opacity-50',
  back: 'min-h-11 px-1 text-sm font-medium text-primary underline-offset-2 hover:underline',
};

// ─── Page top ─────────────────────────────────────────────────────────

export function ListHeader({
  title,
  count,
  description,
  actions,
}: {
  title: ReactNode;
  count?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {count != null && <span className="text-base text-muted-foreground">{count}</span>}
        </div>
        {description && <p className="mt-1 max-w-3xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function NewButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={kitButton.primary}>
      <Plus className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}

// ─── Numbers ──────────────────────────────────────────────────────────

/**
 * A number tile, as on the IParentingSchool dashboard: icon and label, the
 * number, a small line under it. `highlight` marks one that needs action.
 */
export function KpiTile({
  icon,
  label,
  value,
  subtitle,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`relative h-full rounded-2xl border bg-card p-4 ${highlight ? 'border-primary' : 'border-border'}`}>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold leading-none tabular-nums">{value}</div>
      {subtitle && <div className="mt-1 text-xs tabular-nums text-muted-foreground">{subtitle}</div>}
    </div>
  );
}

// ─── Search and filters ───────────────────────────────────────────────

export function ListToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function ListSearch({
  value,
  onChange,
  placeholder,
  clearLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
}) {
  return (
    <label className="relative flex h-11 min-w-0 flex-1 basis-64 items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
      <Search className="h-5 w-5 shrink-0" aria-hidden />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={clearLabel} className="grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-muted">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </label>
  );
}

export function ListSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 max-w-[14rem] rounded-lg border border-border bg-card px-2 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPills<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm ${
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            {o.label}
            {o.count != null && <span className={on ? 'opacity-80' : 'text-muted-foreground'}>{o.count.toLocaleString()}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ClearFilters({ show, onClear, label }: { show: boolean; onClear: () => void; label: string }) {
  if (!show) return null;
  return (
    <button type="button" onClick={onClear} className="min-h-10 px-1 text-sm text-primary underline-offset-2 hover:underline">
      {label}
    </button>
  );
}

// ─── The list itself ──────────────────────────────────────────────────

const colsStyle = (columns: string) => ({ '--list-cols': `${columns} 20px` }) as CSSProperties;
const gridClass = 'md:grid md:grid-cols-[var(--list-cols)] md:items-center md:gap-4';

/** The box around a list. On a phone the column names hide and rows stack. */
export function ListCard({
  columns,
  head,
  children,
  empty,
}: {
  columns: string;
  head: ReactNode[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div
        style={colsStyle(columns)}
        className={`hidden rounded-t-xl border-b border-border bg-muted/40 px-5 py-3 text-sm font-medium text-muted-foreground ${gridClass}`}
      >
        {head.map((h, i) => (
          <span key={i} className="min-w-0">
            {h}
          </span>
        ))}
        <span />
      </div>
      {empty ?? children}
    </div>
  );
}

export function ListEmpty({ children }: { children: ReactNode }) {
  return <p className="p-8 text-center text-muted-foreground">{children}</p>;
}

/** One row; pressing anywhere on it opens the item. */
export function ListRow({
  columns,
  onOpen,
  label,
  selected,
  children,
  rtl,
}: {
  columns: string;
  onOpen: () => void;
  label: string;
  selected?: boolean;
  children: ReactNode;
  rtl?: boolean;
}) {
  const Arrow = rtl ? ChevronLeft : ChevronRight;
  return (
    <div
      style={colsStyle(columns)}
      className={`relative flex flex-col gap-1.5 border-b border-border/70 px-5 py-3 first:rounded-t-xl last:rounded-b-xl last:border-b-0 ${gridClass} ${
        selected ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <button
        type="button"
        aria-label={label}
        onClick={onOpen}
        className="absolute inset-0 z-[1] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      />
      {children}
      <span className="absolute end-3 top-3 z-10 flex items-center md:static md:justify-end">
        <Arrow className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
      </span>
    </div>
  );
}

export function ListRowMain({ title, sub, extra, lead }: { title: ReactNode; sub?: ReactNode; extra?: ReactNode; lead?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 pe-10 md:pe-0">
      {lead}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium [overflow-wrap:anywhere]">{title}</span>
          {extra}
        </div>
        {sub && <div className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{sub}</div>}
      </div>
    </div>
  );
}

export function ListCell({ label, children, muted }: { label: string; children: ReactNode; muted?: boolean }) {
  return (
    <div className={`min-w-0 text-sm [overflow-wrap:anywhere] ${muted ? 'text-muted-foreground' : ''}`}>
      <span className="me-1.5 text-muted-foreground md:hidden">{label}:</span>
      {children}
    </div>
  );
}

/** A coloured dot and one plain word. */
export function StatusDot({ tone, children }: { tone: 'green' | 'grey' | 'orange' | 'red'; children: ReactNode }) {
  const dot = { green: 'bg-green-500', grey: 'bg-muted-foreground/40', orange: 'bg-amber-500', red: 'bg-red-500' }[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      {children}
    </span>
  );
}

// ─── Bottom line ──────────────────────────────────────────────────────

/** Splits a list into pages; back to page 1 when the filters change. */
export function usePagedList<T>(items: T[], resetKey: string, pageSize = LIST_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setPage(1);
  }
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);
  return { page: current, setPage, totalPages, start, pageItems };
}

export function ListFooter({
  showingText,
  pageText,
  page,
  totalPages,
  onPage,
  prevLabel,
  nextLabel,
  rtl,
}: {
  /** e.g. "Showing 1–10 of 13". */
  showingText: string;
  /** e.g. "Page 1 of 2". */
  pageText: string;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  prevLabel: string;
  nextLabel: string;
  rtl?: boolean;
}) {
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const arrow =
    'grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{showingText}</span>
      {totalPages > 1 && (
        <span className="flex items-center gap-2">
          <span>{pageText}</span>
          <button type="button" aria-label={prevLabel} onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className={arrow}>
            <Prev className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" aria-label={nextLabel} onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={arrow}>
            <Next className="h-4 w-4" aria-hidden />
          </button>
        </span>
      )}
    </div>
  );
}

// ─── List page template (approved 2026-11-22) ─────────────────────────
//
// The joined numbers strip, and one card holding search, filters, quick
// pills, the rows and the paging. Pages move to these one at a time; the
// older pieces above stay until every list has moved.

/** The small area name above a page title, and the count badge beside it. */
export function PageTitle({
  eyebrow,
  icon: Icon,
  title,
  badge,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  /** The page's icon, in the primary colour before the title. */
  icon?: LucideIcon;
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 basis-64">
        {eyebrow && <div className="text-[13px] font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-0.5 flex flex-wrap [font-family:inherit] items-center gap-x-2.5 gap-y-1 text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
          {Icon && <Icon className="h-7 w-7 shrink-0 text-primary" aria-hidden />}
          {title}
          {badge != null && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[13px] font-bold tracking-normal text-primary tabular-nums">{badge}</span>
          )}
        </h1>
        {description && <p className="mt-1.5 max-w-3xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const KPI_TONE = {
  primary: 'bg-primary/10 text-primary',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  grey: 'bg-muted text-foreground/70',
} as const;
export type KpiTone = keyof typeof KPI_TONE;

/** The numbers, joined in one strip: 2 × 2 on a phone, one row on a wide screen. */
export function KpiStrip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none"
    >
      {children}
    </section>
  );
}

/**
 * One number. With `onClick` it filters the list; `active` shows that it
 * is filtering now (tinted, underlined, and `activeNote` under the number).
 */
export function KpiItem({
  icon,
  tone = 'primary',
  label,
  value,
  subtitle,
  onClick,
  active = false,
  activeNote,
}: {
  icon: ReactNode;
  tone?: KpiTone;
  label: string;
  value: string;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  activeNote?: string;
}) {
  const body = (
    <>
      <span className={`flex items-center gap-2 text-[13px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg [&_svg]:h-[15px] [&_svg]:w-[15px] ${
            active ? 'bg-primary text-primary-foreground' : KPI_TONE[tone]
          }`}
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span className="text-2xl font-extrabold leading-tight tabular-nums sm:text-[30px]">{value}</span>
      {(subtitle || (active && activeNote)) && (
        <span className={`text-[13px] ${active ? 'text-primary' : 'text-muted-foreground'}`}>
          {[subtitle, active ? activeNote : null].filter(Boolean).join(' · ')}
        </span>
      )}
    </>
  );
  const cls = `flex min-w-0 flex-col gap-1.5 p-4 text-start sm:px-5 ${
    active ? 'bg-primary/5 shadow-[inset_0_-3px_0_hsl(var(--primary))]' : 'bg-card'
  }`;
  if (!onClick) return <div className={cls}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cls} transition-colors hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary`}
    >
      {body}
    </button>
  );
}

/**
 * A filter that reads "Sent to: Anyone ▾". Opens the admin's own styled
 * list (not the browser's), in the page's direction and dark mode.
 */
export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  dir,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  dir?: 'rtl' | 'ltr';
}) {
  const current = options.find((o) => o.value === value)?.label ?? '';
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onChange(v as T)} dir={dir}>
      <SelectPrimitive.Trigger
        aria-label={`${label}: ${current}`}
        className="inline-flex h-11 min-w-0 max-w-full items-center gap-1 rounded-lg border border-border bg-card pe-2.5 ps-3.5 text-sm text-muted-foreground outline-none hover:bg-muted/60 focus-visible:border-primary data-[state=open]:border-primary"
      >
        <span className="whitespace-nowrap">{label}:</span>
        <span className="min-w-0 max-w-[12rem] truncate font-semibold text-foreground">
          <SelectPrimitive.Value />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="ms-1 h-4 w-4 shrink-0" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          align="start"
          className="z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl dark:[color-scheme:dark]"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex min-h-10 cursor-pointer select-none items-center rounded-lg pe-3 ps-9 text-sm outline-none data-[highlighted]:bg-muted data-[state=checked]:font-semibold data-[state=checked]:text-primary"
              >
                <span className="absolute start-3 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/**
 * FilterSelect with a search box inside, for long lists (products, people).
 * Same button ("Product: All ▾"); the list opens with the search focused and
 * narrows as you type. The first option is the "all" choice.
 */
export function FilterCombo({
  label,
  value,
  onChange,
  options,
  searchPlaceholder,
  emptyText,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  searchPlaceholder: string;
  emptyText: string;
  dir?: 'rtl' | 'ltr';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = options.find((o) => o.value === value)?.label ?? '';
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o, i) => i === 0 || o.label.toLowerCase().includes(q)) : options;
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery('');
      }}
    >
      <PopoverPrimitive.Trigger
        aria-label={`${label}: ${current}`}
        className="inline-flex h-11 min-w-0 max-w-full items-center gap-1 rounded-lg border border-border bg-card pe-2.5 ps-3.5 text-sm text-muted-foreground outline-none hover:bg-muted/60 focus-visible:border-primary data-[state=open]:border-primary"
      >
        <span className="whitespace-nowrap">{label}:</span>
        <span className="min-w-0 max-w-[12rem] truncate font-semibold text-foreground">{current}</span>
        <ChevronDown className="ms-1 h-4 w-4 shrink-0" aria-hidden />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          dir={dir}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl dark:[color-scheme:dark]"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <div role="listbox" aria-label={label} className="max-h-72 overflow-y-auto p-1.5">
            {shown.length <= 1 && q ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : null}
            {shown.map((o, i) => {
              if (q && i === 0 && shown.length <= 1) return null;
              const on = o.value === value;
              return (
                <button
                  key={o.value || '__all'}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`relative flex min-h-10 w-full items-center rounded-lg pe-3 ps-9 text-start text-sm hover:bg-muted ${on ? 'font-semibold text-primary' : ''}`}
                >
                  <span className="absolute start-3 flex h-4 w-4 items-center justify-center">{on && <Check className="h-4 w-4" aria-hidden />}</span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{o.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** A square button with only an icon (Refresh); `label` is read aloud. */
export function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground/80 hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * The one card around a list: search and filters, quick pills (they scroll
 * sideways on a phone), the column names and rows, and the paging.
 */
export function ListPanel({
  label,
  toolbar,
  pills,
  extra,
  columns,
  head,
  state,
  footer,
  children,
}: {
  label: string;
  toolbar?: ReactNode;
  pills?: ReactNode;
  /** Extra filters that open under the pills (e.g. "More filters"). */
  extra?: ReactNode;
  columns: string;
  head: ReactNode[];
  /** Loading, empty, no results or error, shown instead of the rows. */
  state?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {toolbar && <div className="flex flex-wrap items-center gap-2.5 p-4">{toolbar}</div>}
      {pills && (
        <div className="-mt-1 flex items-center gap-2 overflow-x-auto px-4 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{pills}</div>
      )}
      {extra && <div className="border-t border-border bg-muted/30 px-4 py-4">{extra}</div>}
      {state ?? (
        <>
          <div
            style={colsStyle(columns)}
            className={`hidden border-y border-border bg-muted/40 px-5 py-2.5 text-[13px] font-semibold text-muted-foreground ${gridClass}`}
          >
            {head.map((h, i) => (
              <span key={i} className="min-w-0">
                {h}
              </span>
            ))}
            <span />
          </div>
          <div className="border-t border-border md:border-t-0">{children}</div>
        </>
      )}
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}

/** Quick filter pills on one line, for inside a ListPanel. */
/**
 * The standard choice chips: one connected bar with dividers, the chosen
 * segment filled. For hand-built groups: put joinedBar on the wrapper and
 * joinedSegment(on) on each button.
 */
export const joinedBar = 'inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-card [&>*+*]:border-s [&>*+*]:border-border';
export const joinedSegment = (on: boolean) =>
  `inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3.5 text-sm transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
    on ? 'bg-primary font-semibold text-primary-foreground' : 'text-foreground hover:bg-muted'
  }`;

export function QuickPills<T extends string>({
  label,
  value,
  onChange,
  options,
  joined = true,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  /** One connected bar with dividers; the chosen segment is filled (the standard). False = separate chips. */
  joined?: boolean;
}) {
  if (joined) {
    return (
      <div role="group" aria-label={label} className={joinedBar}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={joinedSegment(on)}
            >
              {o.label}
              {o.count != null && (
                <span className={`text-xs tabular-nums ${on ? 'rounded-full bg-white/20 px-1.5' : 'text-muted-foreground'}`}>{o.count.toLocaleString()}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm ${
              on ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            {o.label}
            {o.count != null && (
              <span className={`text-xs tabular-nums ${on ? 'rounded-full bg-white/20 px-1.5' : 'text-muted-foreground'}`}>{o.count.toLocaleString()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Loading: the rows keep their place and shimmer. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border-t border-border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border/70 px-5 py-3.5 last:border-b-0">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-3 animate-pulse rounded bg-muted" style={{ width: `${70 - (i % 3) * 10}%` }} />
            <span className="h-2.5 animate-pulse rounded bg-muted/70" style={{ width: `${45 - (i % 2) * 8}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

const STATE_TONE = {
  primary: 'bg-primary/10 text-primary',
  grey: 'bg-muted text-foreground/70',
  red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
} as const;

/** Nothing yet, no results, or could not load: an icon, plain words, one next step. */
export function ListState({
  icon: Icon,
  tone = 'primary',
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  tone?: keyof typeof STATE_TONE;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 border-t border-border px-6 py-12 text-center">
      <span className={`grid h-16 w-16 place-items-center rounded-[20px] ${STATE_TONE[tone]}`} aria-hidden>
        <Icon className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <h3 className="mt-1.5 text-lg font-extrabold [font-family:inherit]">{title}</h3>
      {text && <p className="max-w-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Saving (the one bar every editor uses) ───────────────────────────

/**
 * The floating save bar, as on the IParentingSchool admin: always at the
 * bottom of an editor. Something new: "Not saved yet · Cancel · Save".
 * Editing: "No changes" (Save and Discard greyed) until something changes,
 * then "You have unsaved changes · Discard · Save".
 */
export function SaveBar({
  isNew,
  dirty,
  saving,
  onSave,
  onDiscard,
  cancelHref,
  saveLabel,
  text,
}: {
  isNew: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  /** Something new: Cancel goes here instead of Discard. */
  cancelHref?: string;
  saveLabel: string;
  text: { newItem: string; clean: string; dirty: string; saving: string; discard: string; cancel: string };
}) {
  const canSave = isNew || dirty;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full bg-foreground py-2 pe-2 ps-5 text-sm text-background shadow-xl">
        <span className="inline-flex items-center gap-2">
          {!isNew && !dirty && !saving && <Check className="h-4 w-4 opacity-70" aria-hidden />}
          {saving ? text.saving : isNew ? text.newItem : dirty ? text.dirty : text.clean}
        </span>
        {isNew
          ? cancelHref && (
              <Link href={cancelHref} className="rounded-full px-4 py-2 font-medium hover:bg-background/10">
                {text.cancel}
              </Link>
            )
          : onDiscard && (
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving || !dirty}
                className="rounded-full px-4 py-2 font-medium hover:bg-background/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {text.discard}
              </button>
            )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSave}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Asks before leaving an editor with unsaved changes: links inside the
 * admin ask in the platform's dialog; closing or reloading the tab gets the
 * browser's own question. `allowLeave` lets the page leave on purpose
 * (after saving or deleting) without asking.
 */
export function useLeaveGuard(
  dirty: boolean,
  text: { title: string; body: string; stay: string; leave: string },
): { dialog: ReactNode; allowLeave: () => void } {
  const router = useRouter();
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    leaving.current = false;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (leaving.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      if (leaving.current) return;
      const link = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      // Ctrl/Cmd/Shift-click opens another tab, which loses nothing here.
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      if (link.getAttribute('href')?.startsWith('#')) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTo(link.href);
    };
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);

  const allowLeave = useCallback(() => {
    leaving.current = true;
  }, []);

  const go = () => {
    if (!leaveTo) return;
    const url = new URL(leaveTo, window.location.href);
    leaving.current = true;
    setLeaveTo(null);
    if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
    else window.location.href = url.href;
  };

  const dialog = leaveTo ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="leave-guard-title">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <h2 id="leave-guard-title" className="text-lg font-extrabold [font-family:inherit]">
          {text.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{text.body}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setLeaveTo(null)} className={kitButton.secondary} autoFocus>
            {text.stay}
          </button>
          <button
            type="button"
            onClick={go}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            {text.leave}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { dialog, allowLeave };
}

/** The bar's and the leave question's words, translated (shared by every editor). */
export function saveBarText(t: (key: string, fallback: string) => string) {
  return {
    bar: {
      newItem: t('admin.saveBar.new', 'Not saved yet'),
      clean: t('admin.saveBar.clean', 'No changes'),
      dirty: t('admin.saveBar.dirty', 'You have unsaved changes'),
      saving: t('admin.saveBar.saving', 'Saving…'),
      discard: t('admin.saveBar.discard', 'Discard'),
      cancel: t('admin.saveBar.cancel', 'Cancel'),
    },
    leave: {
      title: t('admin.saveBar.leaveTitle', 'Leave without saving?'),
      body: t('admin.saveBar.leaveBody', "You have changes on this page that aren't saved. If you leave now, they'll be lost."),
      stay: t('admin.saveBar.stay', 'Stay on this page'),
      leave: t('admin.saveBar.leave', 'Leave without saving'),
    },
  };
}

// ─── Wizard ───────────────────────────────────────────────────────────

/** One step: the content, and a help box beside it (under it on a phone). */
export function WizardScreen({
  title,
  intro,
  help,
  children,
}: {
  title: string;
  intro: string;
  help: { icon?: LucideIcon; title: string; lines: ReactNode[]; extra?: ReactNode };
  children: ReactNode;
}) {
  const Icon = help.icon ?? Sparkles;
  return (
    <div className="flex flex-wrap items-start gap-6 rounded-lg border border-border bg-card p-5">
      <div className="min-w-0 flex-[999_1_560px]">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">{intro}</p>
        {children}
      </div>
      <aside className="min-w-0 flex-[1_1_280px] rounded-lg bg-primary/10 p-4">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="mb-1 text-sm font-semibold">{help.title}</h3>
        {help.lines.map((line, i) => (
          <p key={i} className={`text-sm leading-relaxed ${i > 0 ? 'mt-2' : ''}`}>
            {line}
          </p>
        ))}
        {help.extra && <div className="mt-4">{help.extra}</div>}
      </aside>
    </div>
  );
}

const cardBase = 'flex w-full items-start gap-3 rounded-lg bg-card p-4 text-start transition-colors';

export function ChoiceCard({
  active,
  onClick,
  title,
  text,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cardBase} ${active ? 'border border-primary bg-primary/10' : 'border border-border hover:border-primary/60'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/50'
        }`}
      >
        {active && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

export function SummaryRow({
  label,
  onChange,
  changeLabel,
  children,
}: {
  label: string;
  onChange: () => void;
  changeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
      <span className="min-w-0 [overflow-wrap:anywhere]" dir="auto">
        <strong>{label}:</strong> {children}
      </span>
      <button type="button" onClick={onChange} className="min-h-11 font-medium text-primary underline">
        {changeLabel}
      </button>
    </div>
  );
}

/** What's still missing on a step, shown above Back / Continue. */
export function BlockedNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mb-3 flex items-start gap-2 rounded-md bg-red-100 p-3 text-sm font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}
