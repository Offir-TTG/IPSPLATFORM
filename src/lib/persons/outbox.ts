/**
 * Outbox emitter helpers — IPSPlatform side.
 *
 * Used by registration / Stripe webhook / any other site that needs
 * to notify IParentingSchool about a state change. Errors are logged
 * but never thrown — the originating write has already committed and
 * we don't want a downstream notification glitch to surface as a 500
 * on the user's flow. A failed emit can be replayed manually from the
 * admin Outbox view (future work).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Emit `person.enrolled` when a user finishes credential creation
 *  via the enrollment flow. Promotes lead→contact on IParentingSchool. */
export async function emitPersonEnrolled(
  supabase: SupabaseClient,
  args: {
    personId: string;
    userId: string;
    enrolledAt: string;
    sourceType: "course" | "program" | "lecture" | null;
    sourceId: string | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("outbox_events").insert({
      event_type: "person.enrolled",
      person_id: args.personId,
      user_id: args.userId,
      payload: {
        person_id: args.personId,
        enrolled_at: args.enrolledAt,
        source_type: args.sourceType,
        source_id: args.sourceId,
      },
    });
    if (error) {
      console.error("[outbox] insert person.enrolled failed:", error.message);
    }
  } catch (e) {
    console.error("[outbox] person.enrolled unexpected:", e);
  }
}

/** Emit `person.became_customer` when a Stripe payment succeeds for
 *  the linked user. IParentingSchool stamps lifecycle_stage='customer'. */
export async function emitPersonBecameCustomer(
  supabase: SupabaseClient,
  args: {
    personId: string;
    userId: string;
    firstPurchaseAt: string;
    productSummary?: {
      product_name: string;
      product_type: string | null;
      amount: number;
      currency: string;
    } | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("outbox_events").insert({
      event_type: "person.became_customer",
      person_id: args.personId,
      user_id: args.userId,
      payload: {
        person_id: args.personId,
        first_purchase_at: args.firstPurchaseAt,
        product_summary: args.productSummary ?? null,
      },
    });
    if (error) {
      console.error("[outbox] insert person.became_customer failed:", error.message);
    }
  } catch (e) {
    console.error("[outbox] person.became_customer unexpected:", e);
  }
}

/** Emit `person.enrollment_pending` when get-or-create was unreachable
 *  during registration. Carries the full seed payload so IParentingSchool
 *  can populate the eventual crm_contacts row with all the user's input.
 *  IParentingSchool will reply via its outbox with `person.linked`. */
export async function emitPersonEnrollmentPending(
  supabase: SupabaseClient,
  args: {
    userId: string;
    email: string;
    name: string | null;
    phone: string | null;
    locale: string | null;
    country: string | null;
    source: {
      type: "course" | "program" | "lecture";
      id: string;
      slug: string | null;
    } | null;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from("outbox_events").insert({
      event_type: "person.enrollment_pending",
      person_id: null,
      user_id: args.userId,
      payload: {
        ips_user_id: args.userId,
        email: args.email,
        name: args.name,
        phone: args.phone,
        locale: args.locale,
        country: args.country,
        source: args.source,
      },
    });
    if (error) {
      console.error("[outbox] insert person.enrollment_pending failed:", error.message);
    }
  } catch (e) {
    console.error("[outbox] person.enrollment_pending unexpected:", e);
  }
}
