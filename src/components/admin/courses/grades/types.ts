/**
 * Shared shapes and small helpers for the course Grades tab.
 */

export type Client = { id: string; full_name: string; email: string };

export type GradeItemRow = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  max_points: number;
  due_date: string | null;
  available_from: string | null;
  available_until: string | null;
  is_published: boolean;
  is_extra_credit: boolean;
  allow_late_submission: boolean;
  display_order: number;
};

export type GradeGroup = {
  id: string;
  name: string;
  weight_percentage: number;
  drop_lowest: number;
  display_order: number;
  color_code: string | null;
};

export type SavedGrade = {
  id?: string;
  grade_item_id: string;
  student_id: string;
  points_earned: number | null;
  is_excused: boolean;
};

export type GradingConfig = { passing_percentage: number; use_weighted_categories: boolean };

export type ScaleRange = { label: string; min: number; max: number; color: string | null };

export type CourseScale = {
  scale_id: string | null;
  scale_name: string | null;
  used_tenant_default: boolean;
  ranges: ScaleRange[];
};

export type TFn = (key: string, fallback: string) => string;

export const cellKey = (studentId: string, itemId: string) => `${studentId}:${itemId}`;

/** What a cell holds, read from what was typed. */
export type CellValue =
  | { kind: 'empty' }
  | { kind: 'excused' }
  | { kind: 'points'; points: number }
  | { kind: 'invalid' };

/** Typing one of these in a cell marks the client exempt. */
const EXCUSED_WORDS = ['פ', 'פטור', 'ex', 'excused'];

/** The text a cell starts with: "פ" for exempt, the points, or empty. */
export const EXCUSED_MARK = 'פ';

export function parseCell(raw: string, max: number): CellValue {
  const s = raw.trim();
  if (!s) return { kind: 'empty' };
  if (EXCUSED_WORDS.includes(s.toLowerCase())) return { kind: 'excused' };
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > max) return { kind: 'invalid' };
  return { kind: 'points', points: n };
}

export function savedToRaw(g: SavedGrade | undefined): string {
  if (!g) return '';
  if (g.is_excused) return EXCUSED_MARK;
  return g.points_earned == null ? '' : String(Number(g.points_earned));
}

export function savedToValue(g: SavedGrade | undefined): CellValue {
  if (!g) return { kind: 'empty' };
  if (g.is_excused) return { kind: 'excused' };
  if (g.points_earned == null) return { kind: 'empty' };
  return { kind: 'points', points: Number(g.points_earned) };
}

export function sameValue(a: CellValue, b: CellValue): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'points' && b.kind === 'points') return a.points === b.points;
  return true;
}

/** Black or white text, whichever reads better on this background colour. */
export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.45 ? '#1d1830' : '#ffffff';
}

/** "2026-12-15T00:00:00" → "2026-12-15" for a date input. */
export const toDateInput = (v: string | null | undefined) => (v ? v.split('T')[0] : '');

export const fieldClass =
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export const errorBorder = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
