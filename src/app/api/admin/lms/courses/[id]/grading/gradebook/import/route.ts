/**
 * POST /api/admin/lms/courses/[id]/grading/gradebook/import
 *
 * Accepts the same CSV shape produced by /export and applies the grade
 * changes to student_grades via the existing bulk-save flow.
 *
 * Body: multipart/form-data
 *   file: <CSV file>
 *   dry_run: '1' to preview without writing (returns the same `changes`
 *            and `errors` shape; admin previews then re-submits without
 *            the flag to commit).
 *
 * Matching rules:
 *   - Student column: prefers `Student ID`, falls back to `Email`.
 *   - Grade-item columns: by case-insensitive name match against the
 *     item's `name`. The `(/max)` suffix in the header is stripped
 *     before matching, so exported headers re-import cleanly.
 *   - Cell value `EXCUSED` (case-insensitive) sets `is_excused=true`
 *     and clears points_earned.
 *   - Empty cell = "leave existing grade alone" (no-op, no overwrite).
 *   - Numeric cell = points_earned (rejected if > max_points).
 *
 * Totals/Percentage/Letter-grade columns from the export are ignored —
 * they're derived columns, not inputs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CsvRow = Record<string, string>;

interface ChangeRow {
  student_id: string;
  student_email: string;
  student_name: string;
  grade_item_id: string;
  grade_item_name: string;
  before: { points_earned: number | null; is_excused: boolean } | null;
  after: { points_earned: number | null; is_excused: boolean };
}

interface ImportError {
  row: number;
  student?: string;
  column?: string;
  message: string;
}

/**
 * Tiny CSV parser that handles quoted fields, escaped quotes ("") and
 * embedded newlines inside quotes. Returns `{ headers, rows }`. We don't
 * need a full-featured parser — the file shape is fixed by /export.
 */
function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // Strip BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const records: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        cur.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        cur.push(field);
        field = '';
        records.push(cur);
        cur = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    records.push(cur);
  }
  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    // Skip fully-empty trailing lines.
    if (rec.every((v) => v === '')) continue;
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (rec[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Strip the trailing `(/max)` suffix from an exported header so it
 * matches the grade_item.name. e.g. "Midterm (/100)" -> "midterm".
 */
function normalizeItemHeader(header: string): string {
  return header.replace(/\s*\(\/?[^)]*\)\s*$/, '').trim().toLowerCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const courseId = params.id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Course belongs to tenant.
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('tenant_id', userData.tenant_id)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const dryRun = String(form.get('dry_run') ?? '') === '1';
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV is empty' }, { status: 400 });
    }

    // Resolve the student-identifier column.
    const studentIdHeader = headers.find((h) => h.toLowerCase() === 'student id');
    const emailHeader = headers.find((h) => h.toLowerCase() === 'email');
    if (!studentIdHeader && !emailHeader) {
      return NextResponse.json(
        { error: 'CSV is missing a Student ID or Email column' },
        { status: 400 },
      );
    }
    const nameHeader = headers.find((h) => h.toLowerCase() === 'full name');

    // Skip derived/total columns when scanning for grade-item headers.
    const DERIVED = new Set(['student id', 'email', 'full name', 'total earned', 'total possible', 'percentage', 'total', 'letter grade']);
    const itemHeaders = headers.filter((h) => !DERIVED.has(h.toLowerCase()));

    // Service-role client for the lookups + write. Admin gate is above.
    const admin = createAdminClient();

    // Load this course's grade items so we can match by name.
    const { data: itemsRaw } = await admin
      .from('grade_items')
      .select('id, name, max_points')
      .eq('course_id', courseId)
      .eq('tenant_id', userData.tenant_id);
    const items = (itemsRaw ?? []) as Array<{ id: string; name: string; max_points: number }>;
    const itemByName = new Map<string, { id: string; name: string; max_points: number }>();
    items.forEach((i) => itemByName.set(i.name.toLowerCase(), i));

    // Map exported header -> grade_item. Headers that don't match a
    // grade_item are recorded as a header-level warning so the admin can
    // see what the importer ignored.
    const headerMapping: Array<{ header: string; itemId: string | null }> = itemHeaders.map((h) => {
      const norm = normalizeItemHeader(h);
      const item = itemByName.get(norm);
      return { header: h, itemId: item?.id ?? null };
    });

    // Resolve students. If Student ID is present, prefer it; else look up by email.
    const studentIds = new Set<string>();
    const emails = new Set<string>();
    rows.forEach((r) => {
      const sid = studentIdHeader ? r[studentIdHeader]?.trim() : '';
      const em = emailHeader ? r[emailHeader]?.trim().toLowerCase() : '';
      if (sid) studentIds.add(sid);
      else if (em) emails.add(em);
    });

    const { data: byIdRows } = studentIds.size > 0
      ? await admin
          .from('users')
          .select('id, email, first_name, last_name, tenant_id')
          .in('id', Array.from(studentIds))
          .eq('tenant_id', userData.tenant_id)
      : { data: [] as any[] };

    const { data: byEmailRows } = emails.size > 0
      ? await admin
          .from('users')
          .select('id, email, first_name, last_name, tenant_id')
          .in('email', Array.from(emails))
          .eq('tenant_id', userData.tenant_id)
      : { data: [] as any[] };

    const studentById = new Map<string, any>();
    [...(byIdRows ?? []), ...(byEmailRows ?? [])].forEach((u) => studentById.set(u.id, u));
    const studentByEmail = new Map<string, any>();
    (byEmailRows ?? []).forEach((u) => studentByEmail.set(u.email.toLowerCase(), u));

    // Existing grades for the (student, item) pairs we're about to touch
    // — needed for the before/after preview and to find the row id for
    // upsert/update.
    const studentIdsResolved = new Set<string>();
    rows.forEach((r) => {
      const sid = studentIdHeader ? r[studentIdHeader]?.trim() : '';
      const em = emailHeader ? r[emailHeader]?.trim().toLowerCase() : '';
      const student = sid ? studentById.get(sid) : em ? studentByEmail.get(em) : null;
      if (student) studentIdsResolved.add(student.id);
    });

    const itemIds = items.map((i) => i.id);
    const { data: existingGrades } = (studentIdsResolved.size > 0 && itemIds.length > 0)
      ? await admin
          .from('student_grades')
          .select('id, student_id, grade_item_id, points_earned, is_excused')
          .in('student_id', Array.from(studentIdsResolved))
          .in('grade_item_id', itemIds)
      : { data: [] as any[] };

    const existingByKey = new Map<string, any>();
    (existingGrades ?? []).forEach((g: any) =>
      existingByKey.set(`${g.student_id}-${g.grade_item_id}`, g),
    );

    // Walk the rows, build the change set + errors.
    const changes: ChangeRow[] = [];
    const errors: ImportError[] = [];

    // Header-level warnings for unmapped columns.
    headerMapping
      .filter((m) => m.itemId === null)
      .forEach((m) =>
        errors.push({
          row: 0,
          column: m.header,
          message: `No grade item named "${m.header}" — column ignored`,
        }),
      );

    rows.forEach((r, idx) => {
      const csvRowNumber = idx + 2; // header is row 1
      const sid = studentIdHeader ? r[studentIdHeader]?.trim() : '';
      const em = emailHeader ? r[emailHeader]?.trim().toLowerCase() : '';
      const student = sid ? studentById.get(sid) : em ? studentByEmail.get(em) : null;
      const displayName = nameHeader ? r[nameHeader] : (em || sid || '');

      if (!student) {
        errors.push({
          row: csvRowNumber,
          student: displayName,
          message: `Student not found (id=${sid || '—'}, email=${em || '—'})`,
        });
        return;
      }

      headerMapping.forEach(({ header, itemId }) => {
        if (!itemId) return;
        const item = items.find((i) => i.id === itemId)!;
        const raw = (r[header] ?? '').trim();

        // Empty cell — explicit no-op. Don't overwrite existing grades.
        if (raw === '') return;

        let after: { points_earned: number | null; is_excused: boolean };
        if (raw.toLowerCase() === 'excused') {
          after = { points_earned: null, is_excused: true };
        } else {
          const num = Number(raw);
          if (!Number.isFinite(num)) {
            errors.push({
              row: csvRowNumber,
              student: displayName,
              column: header,
              message: `Value "${raw}" is not a number`,
            });
            return;
          }
          if (num < 0 || num > item.max_points) {
            errors.push({
              row: csvRowNumber,
              student: displayName,
              column: header,
              message: `${num} out of range 0..${item.max_points}`,
            });
            return;
          }
          after = { points_earned: num, is_excused: false };
        }

        const existing = existingByKey.get(`${student.id}-${itemId}`);
        const before = existing
          ? { points_earned: existing.points_earned, is_excused: !!existing.is_excused }
          : null;

        // Skip no-op writes (same value already on row).
        if (
          before &&
          before.is_excused === after.is_excused &&
          Number(before.points_earned) === Number(after.points_earned)
        ) {
          return;
        }

        changes.push({
          student_id: student.id,
          student_email: student.email,
          student_name:
            `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email,
          grade_item_id: itemId,
          grade_item_name: item.name,
          before,
          after,
        });
      });
    });

    // Dry-run — return the preview, don't write.
    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        change_count: changes.length,
        error_count: errors.length,
        changes,
        errors,
      });
    }

    // Commit. Use the same bulk pattern as the manual save: upsert per
    // (grade_item_id, student_id). The existing bulk endpoint encodes
    // the percentage + status; mirror its logic here so a CSV save and a
    // UI save produce identical rows.
    const payload = changes.map((c) => {
      const item = items.find((i) => i.id === c.grade_item_id)!;
      const pct = c.after.is_excused
        ? null
        : c.after.points_earned == null
          ? null
          : (c.after.points_earned / item.max_points) * 100;
      const status = c.after.is_excused
        ? 'excused'
        : c.after.points_earned == null
          ? 'not_submitted'
          : 'graded';
      return {
        tenant_id: userData.tenant_id,
        grade_item_id: c.grade_item_id,
        student_id: c.student_id,
        points_earned: c.after.points_earned,
        percentage: pct,
        status,
        is_excused: c.after.is_excused,
        graded_at: c.after.is_excused || c.after.points_earned == null ? null : new Date().toISOString(),
      };
    });

    if (payload.length > 0) {
      const { error: writeErr } = await admin
        .from('student_grades')
        .upsert(payload, { onConflict: 'grade_item_id,student_id' });
      if (writeErr) {
        return NextResponse.json(
          { error: 'Failed to save grades', detail: writeErr.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      dry_run: false,
      change_count: changes.length,
      error_count: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error('Gradebook import error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
