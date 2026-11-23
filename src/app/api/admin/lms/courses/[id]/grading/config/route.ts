/**
 * GET / PUT /api/admin/lms/courses/[id]/grading/config
 *
 * A course's grading settings (Grades → Settings): the pass mark and whether
 * the final grade is weighted by groups (grade categories). Stored in
 * course_grading_config, one row per course. A course without a row uses
 * the defaults: pass mark 60, no weighting (all points count together).
 *
 * The final grade is computed with lib/grading/gradeCalculator from these
 * settings, the items, categories and grades.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const GRADING_DEFAULTS ={ passing_percentage: 60, use_weighted_categories: false };

async function staffCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: me } = await admin.from('users').select('role, tenant_id').eq('id', user.id).maybeSingle();
  if (!me || !['admin', 'super_admin', 'instructor'].includes(me.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const { data: course } = await admin.from('courses').select('id, tenant_id, grading_scale_id').eq('id', courseId).maybeSingle();
  if (!course || course.tenant_id !== me.tenant_id) {
    return { error: NextResponse.json({ error: 'Course not found' }, { status: 404 }) };
  }
  return { admin, course };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await staffCourse(params.id);
  if ('error' in ctx) return ctx.error;
  const { data: row } = await ctx.admin
    .from('course_grading_config')
    .select('passing_percentage, use_weighted_categories')
    .eq('course_id', params.id)
    .maybeSingle();
  return NextResponse.json({
    success: true,
    data: {
      passing_percentage: row?.passing_percentage != null ? Number(row.passing_percentage) : GRADING_DEFAULTS.passing_percentage,
      use_weighted_categories: row ? !!row.use_weighted_categories : GRADING_DEFAULTS.use_weighted_categories,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await staffCourse(params.id);
  if ('error' in ctx) return ctx.error;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.passing_percentage !== undefined) {
    const pass = Number(body.passing_percentage);
    if (!Number.isFinite(pass) || pass < 0 || pass > 100) {
      return NextResponse.json({ error: 'passing_percentage must be between 0 and 100', field: 'passing_percentage' }, { status: 400 });
    }
    update.passing_percentage = pass;
  }
  if (body.use_weighted_categories !== undefined) update.use_weighted_categories = !!body.use_weighted_categories;

  const { data: existing } = await ctx.admin.from('course_grading_config').select('id').eq('course_id', params.id).maybeSingle();
  if (existing) {
    const { error } = await ctx.admin.from('course_grading_config').update(update).eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // The row needs a scale: the course's own, else the school's default.
    let scaleId: string | null = ctx.course.grading_scale_id ?? null;
    if (!scaleId) {
      const { data: def } = await ctx.admin
        .from('grading_scales')
        .select('id')
        .eq('tenant_id', ctx.course.tenant_id)
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      scaleId = def?.id ?? null;
    }
    if (!scaleId) {
      return NextResponse.json({ error: 'Choose a grading scale first', field: 'grading_scale_id' }, { status: 400 });
    }
    const { error } = await ctx.admin.from('course_grading_config').insert({
      tenant_id: ctx.course.tenant_id,
      course_id: params.id,
      grading_scale_id: scaleId,
      passing_percentage: update.passing_percentage ?? GRADING_DEFAULTS.passing_percentage,
      use_weighted_categories: update.use_weighted_categories ?? GRADING_DEFAULTS.use_weighted_categories,
      grade_calculation_method: 'weighted_average',
      allow_extra_credit: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
