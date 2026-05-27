'use client';

/**
 * CourseGradingScalePicker — small inline control that sets the
 * `courses.grading_scale_id` for a course. Renders a card-style row
 * with a Select of every active scale in the tenant + a "Tenant
 * default" option (sets the column to NULL so the read pipeline falls
 * back to whatever scale is `is_default=true`).
 *
 * Wire-up:
 *   - GET  /api/admin/grading/scales        — list scales
 *   - GET  /api/admin/lms/courses/[id]      — read current scale
 *   - PATCH /api/admin/lms/courses/[id]     — write { grading_scale_id }
 */

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, Loader2, CheckCircle2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';

// Sentinel used in the Select since Radix doesn't allow an empty
// string as an item value. Translated to NULL on the wire.
const DEFAULT_VALUE = '__tenant_default__';

interface Scale {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export function CourseGradingScalePicker({
  courseId,
  onChange,
}: {
  courseId: string;
  /** Fires after a successful save so a parent (e.g. the gradebook)
   *  can refetch data to reflect the new scale. */
  onChange?: () => void;
}) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();

  const [scales, setScales] = useState<Scale[]>([]);
  const [selected, setSelected] = useState<string>(DEFAULT_VALUE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [scalesRes, courseRes] = await Promise.all([
          fetch('/api/admin/grading/scales'),
          fetch(`/api/admin/lms/courses/${courseId}`),
        ]);
        const scalesJson = await scalesRes.json();
        const courseJson = await courseRes.json();
        if (cancelled) return;
        const rawScales: Scale[] = scalesJson.data ?? scalesJson ?? [];
        setScales(rawScales.filter((s) => s.is_active));
        const current =
          courseJson?.data?.grading_scale_id ?? courseJson?.grading_scale_id ?? null;
        setSelected(current ?? DEFAULT_VALUE);
      } catch (err) {
        console.error('Failed to load grading scales:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function handleChange(value: string) {
    setSelected(value);
    setSaving(true);
    try {
      // Dedicated endpoint: updates `courses.grading_scale_id` AND
      // clears stored `student_grades.letter_grade` for every grade in
      // this course. Clearing the stored letters is what makes the
      // change actually "reflect" — the read pipelines live-compute
      // the letter against the new scale when the column is NULL.
      const res = await fetch(`/api/admin/lms/courses/${courseId}/grading/scale`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grading_scale_id: value === DEFAULT_VALUE ? null : value,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Save failed');
      }
      const cleared = json?.cleared ?? 0;
      onChange?.();
      toast({
        title: t('common.success', 'Success'),
        description:
          cleared > 0
            ? t(
                'admin.grading.scale.savedAndRecomputedToast',
                'Grading scale updated · {{n}} grades will use the new scale',
              ).replace('{{n}}', String(cleared))
            : t(
                'admin.grading.scale.savedToast',
                'Grading scale updated for this course',
              ),
      });
    } catch (err: any) {
      toast({
        title: t('common.error', 'Error'),
        description: err?.message ?? 'Failed to save grading scale',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  // Default scale label shows in parentheses next to "Tenant default"
  // so the admin can see which scale that resolves to.
  const tenantDefaultName = scales.find((s) => s.is_default)?.name;

  return (
    <Card className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {t('admin.grading.scale.label', 'Grading scale')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              'admin.grading.scale.help',
              'Letters for this course are looked up against this scale. "Tenant default" uses whichever scale is marked default.',
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Select value={selected} onValueChange={handleChange} disabled={loading || saving}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder={loading ? '…' : undefined} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_VALUE}>
              {t('admin.grading.scale.tenantDefault', 'Tenant default')}
              {tenantDefaultName ? ` (${tenantDefaultName})` : ''}
            </SelectItem>
            {scales.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.is_default
                  ? ` · ${t('admin.grading.scale.defaultMarker', 'default')}`
                  : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        ) : !loading ? (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        ) : null}
      </div>
    </Card>
  );
}
