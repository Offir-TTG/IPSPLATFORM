/**
 * GET /api/admin/users/[id]/tags
 *
 * Returns the aggregate set of tags that have been (or will be) applied
 * to the user as a result of their product enrollments. Two sources:
 *
 *   1. `products.keap_tag`        — a single Keap tag string
 *   2. `products.crm_tag_slugs`   — array of CRM tag slugs applied to
 *                                   the IParentingSchool CRM contact
 *
 * Both are configured on the *product* (see admin/payments/products);
 * they're applied to the contact when the enrollment completes. Here
 * we just surface what's configured so the admin can see, on the user's
 * Overview tab, every tag that ever got (or will get) attached because
 * of this user's enrollments.
 *
 * Each returned tag carries the list of products that contributed it so
 * the admin can trace "why does this user have tag X?" → "because of
 * enrollment in product Y".
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type EnrichedTag = {
  /** The tag value itself (Keap tag name or CRM slug). */
  value: string;
  /** Product titles that contributed this tag — for traceability. */
  from_products: string[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: caller } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!caller || !['admin', 'super_admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Pull the user's enrollments + the tag-relevant product columns
    // in one query. Inactive enrollments still count — the tag was
    // applied at purchase time and (per the existing data model) is
    // not unapplied on cancellation.
    const { data: rows, error } = await supabase
      .from('enrollments')
      .select(
        `id, status, product_id,
         products!inner(id, title, keap_tag, crm_tag_slugs)`,
      )
      .eq('user_id', params.id)
      .eq('tenant_id', caller.tenant_id);

    if (error) {
      console.error('[GET users/:id/tags] enrollments query failed:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    // Aggregate by tag value, collecting the contributing product titles
    // so the UI can show a "from: X, Y" hover.
    const keapByValue = new Map<string, Set<string>>();
    const crmByValue = new Map<string, Set<string>>();

    for (const row of (rows ?? []) as any[]) {
      const productTitle = (row.products?.title as string) ?? '—';

      const keap = row.products?.keap_tag as string | null | undefined;
      if (keap && keap.trim()) {
        const set = keapByValue.get(keap) ?? new Set<string>();
        set.add(productTitle);
        keapByValue.set(keap, set);
      }

      const crmSlugs = (row.products?.crm_tag_slugs as string[] | null | undefined) ?? [];
      for (const slug of crmSlugs) {
        if (!slug || !slug.trim()) continue;
        const set = crmByValue.get(slug) ?? new Set<string>();
        set.add(productTitle);
        crmByValue.set(slug, set);
      }
    }

    const keap_tags: EnrichedTag[] = Array.from(keapByValue.entries())
      .map(([value, products]) => ({ value, from_products: Array.from(products).sort() }))
      .sort((a, b) => a.value.localeCompare(b.value));

    const crm_tag_slugs: EnrichedTag[] = Array.from(crmByValue.entries())
      .map(([value, products]) => ({ value, from_products: Array.from(products).sort() }))
      .sort((a, b) => a.value.localeCompare(b.value));

    return NextResponse.json({
      user_id: params.id,
      keap_tags,
      crm_tag_slugs,
      summary: {
        total_keap_tags: keap_tags.length,
        total_crm_tag_slugs: crm_tag_slugs.length,
        total_enrollments_scanned: rows?.length ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/users/[id]/tags:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
