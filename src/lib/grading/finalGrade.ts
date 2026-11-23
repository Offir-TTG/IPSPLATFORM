/**
 * A client's final grade in a course, from the gradebook's own data (grade
 * items, their scores, the course's groups and settings). One rule set, used
 * by the admin gradebook and by what clients see, so both show the same.
 *
 * - Only graded items count: an exempt item, or one with no score yet, is
 *   left out (the grade so far).
 * - Bonus (extra-credit) items add their points to what was earned, never to
 *   what was possible.
 * - No weighting: all points together (earned / possible).
 * - Weighting by groups: each group's own points percentage, after dropping
 *   its N lowest items, weighted by the group's %. Items with no group form
 *   one more group with the weight left over (100 minus the groups'); with
 *   nothing left over they don't count. Groups with no graded item are
 *   skipped and the rest are scaled up to 100.
 * - The letter comes from the grading scale's ranges; passing is at or above
 *   the course's pass mark.
 */

export type FinalGradeItem = {
  id: string;
  max_points: number;
  category_id: string | null;
  is_extra_credit?: boolean | null;
};

export type FinalGradeScore = { points: number | null; excused?: boolean | null };

export type FinalGradeCategory = { id: string; weight_percentage: number; drop_lowest?: number | null };

export type FinalGradeRange = { grade_label: string; min_percentage: number; max_percentage: number; color_code?: string | null; is_passing?: boolean | null };

export type FinalGradeInput = {
  items: FinalGradeItem[];
  /** Scores by item id. */
  scores: Record<string, FinalGradeScore | undefined>;
  categories: FinalGradeCategory[];
  weighted: boolean;
  passMark: number;
  ranges: FinalGradeRange[];
};

export type FinalGrade = {
  /** 0–100 (bonus can take it higher); null when nothing is graded yet. */
  percent: number | null;
  letter: string | null;
  letterColor: string | null;
  passing: boolean | null;
  earned: number;
  possible: number;
  gradedCount: number;
};

type Graded = { item: FinalGradeItem; points: number };

const round1 = (n: number) => Math.round(n * 10) / 10;

function pointsPercent(rows: Graded[]): { pct: number | null; earned: number; possible: number } {
  const earned = rows.reduce((a, r) => a + r.points, 0);
  const possible = rows.filter((r) => !r.item.is_extra_credit).reduce((a, r) => a + Number(r.item.max_points || 0), 0);
  return { pct: possible > 0 ? (earned / possible) * 100 : null, earned, possible };
}

function dropLowest(rows: Graded[], n: number): Graded[] {
  if (!n || n <= 0) return rows;
  const regular = rows.filter((r) => !r.item.is_extra_credit);
  if (regular.length <= n) return rows;
  const byPct = [...regular].sort((a, b) => a.points / (a.item.max_points || 1) - b.points / (b.item.max_points || 1));
  const dropped = new Set(byPct.slice(0, n).map((r) => r.item.id));
  return rows.filter((r) => !dropped.has(r.item.id));
}

export function letterFor(percent: number | null, ranges: FinalGradeRange[]): FinalGradeRange | null {
  if (percent == null || !ranges.length) return null;
  const p = Math.min(percent, 100);
  return ranges.find((r) => p >= Number(r.min_percentage) && p <= Number(r.max_percentage)) ?? null;
}

export function computeFinalGrade(input: FinalGradeInput): FinalGrade {
  const graded: Graded[] = [];
  for (const item of input.items) {
    const s = input.scores[item.id];
    if (!s || s.excused || s.points == null || !Number.isFinite(Number(s.points))) continue;
    graded.push({ item, points: Number(s.points) });
  }
  const all = pointsPercent(graded);

  let percent: number | null;
  if (!input.weighted || !input.categories.length) {
    percent = all.pct;
  } else {
    const groups: { weight: number; rows: Graded[]; drop: number }[] = input.categories.map((c) => ({
      weight: Number(c.weight_percentage) || 0,
      drop: Number(c.drop_lowest) || 0,
      rows: graded.filter((g) => g.item.category_id === c.id),
    }));
    const known = new Set(input.categories.map((c) => c.id));
    const leftover = Math.max(0, 100 - groups.reduce((a, g) => a + g.weight, 0));
    const loose = graded.filter((g) => !g.item.category_id || !known.has(g.item.category_id));
    if (leftover > 0 && loose.length) groups.push({ weight: leftover, drop: 0, rows: loose });

    let sum = 0;
    let weights = 0;
    for (const g of groups) {
      if (!g.rows.length || g.weight <= 0) continue;
      const { pct } = pointsPercent(dropLowest(g.rows, g.drop));
      if (pct == null) continue;
      sum += pct * g.weight;
      weights += g.weight;
    }
    percent = weights > 0 ? sum / weights : null;
  }

  if (percent != null) percent = round1(percent);
  const range = letterFor(percent, input.ranges);
  return {
    percent,
    letter: range?.grade_label ?? null,
    letterColor: range?.color_code ?? null,
    passing: percent == null ? null : percent >= input.passMark,
    earned: all.earned,
    possible: all.possible,
    gradedCount: graded.length,
  };
}
