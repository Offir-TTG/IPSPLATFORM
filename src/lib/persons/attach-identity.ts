/**
 * Shared person-identity helper for every IPSPlatform route that
 * creates a user. Resolves the user to a canonical person_id on
 * IParentingSchool, stamps it on public.users, and emits the right
 * outbox event(s).
 *
 * Five entry points use this:
 *   - /api/auth/signup
 *   - /api/auth/signup/organization
 *   - /api/enrollments/token/[token]/complete (wizard)
 *   - /api/invitations/accept
 *   - /api/admin/tenant/users (admin-created)
 *
 * The helper is best-effort: if the cross-app call fails, we leave
 * users.person_id NULL and queue a person.enrollment_pending event.
 * The drainer + IParentingSchool's person.linked reply will resolve
 * it asynchronously. The local user creation NEVER blocks on the
 * cross-app round-trip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyPersonToken } from "./signed-token";
import { getOrCreatePerson } from "./get-or-create-client";
import {
  emitPersonEnrolled,
  emitPersonEnrollmentPending,
  emitPersonBecameCustomer,
} from "./outbox";

export type AttachIdentityInput = {
  /** Service-role Supabase client (RLS bypass). */
  supabase: SupabaseClient;
  /** The auth.users.id / public.users.id row that was just created. */
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  locale?: string | null;
  country?: string | null;
  /** Optional signed token from IParentingSchool's Register redirect.
   *  When present + email matches, skips the get-or-create round-trip. */
  personToken?: string | null;
  /** Originating IParentingSchool content (when applicable). */
  source?: {
    type: "course" | "program" | "lecture";
    id: string;
    slug: string | null;
  } | null;
  /** Set to true for any flow that represents an "enrolled" milestone
   *  (signup-via-Register, invitation-accept, wizard-complete). */
  emitEnrolledEvent?: boolean;
  /** Set when the flow ALSO completes an enrollment (free product OR
   *  paid enrollment finalisation). Carries the product summary so
   *  IParentingSchool's customer card has rich data. */
  emitBecameCustomer?: {
    firstPurchaseAt: string;
    productSummary?: {
      product_name: string;
      product_type: string | null;
      amount: number;
      currency: string;
    } | null;
  } | null;
};

export type AttachIdentityOutcome = {
  personId: string | null;
  /** True when we couldn't resolve and queued enrollment_pending. */
  pending: boolean;
};

const SOURCE_TYPES = new Set(["course", "program", "lecture"]);

export async function attachPersonIdentity(
  input: AttachIdentityInput,
): Promise<AttachIdentityOutcome> {
  const {
    supabase,
    userId,
    email,
    firstName,
    lastName,
    phone,
    locale,
    country,
    personToken,
    source,
    emitEnrolledEvent,
    emitBecameCustomer,
  } = input;

  if (!userId || !email) {
    console.error("[persons/attach] missing required fields");
    return { personId: null, pending: false };
  }

  // ─── Resolve person_id ─────────────────────────────────────────────
  let personId: string | null = null;
  let resolutionFailed = false;

  const tokenClaims = verifyPersonToken(personToken ?? null);
  if (
    tokenClaims &&
    tokenClaims.email.trim().toLowerCase() === email.trim().toLowerCase()
  ) {
    personId = tokenClaims.person_id;
  } else {
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || null;
    const safeSource =
      source && SOURCE_TYPES.has(source.type)
        ? { type: source.type, id: source.id, slug: source.slug }
        : null;

    const outcome = await getOrCreatePerson({
      email,
      name: fullName,
      phone: phone ?? null,
      locale: locale ?? null,
      country: country ?? null,
      source: safeSource,
    });

    if (outcome.ok) {
      personId = outcome.person_id;
    } else {
      resolutionFailed = true;
      console.warn(
        "[persons/attach] get-or-create unreachable; queueing enrollment_pending:",
        outcome.reason,
      );
    }
  }

  // ─── Stamp users.person_id ─────────────────────────────────────────
  if (personId) {
    const { error } = await supabase
      .from("users")
      .update({ person_id: personId })
      .eq("id", userId)
      .is("person_id", null); // never overwrite an already-linked user
    if (error) {
      console.error("[persons/attach] failed to stamp person_id:", error.message);
      // Continue — the link can be backfilled later via inbound events.
    }
  }

  // ─── Emit events ───────────────────────────────────────────────────
  if (personId && emitEnrolledEvent) {
    await emitPersonEnrolled(supabase, {
      personId,
      userId,
      enrolledAt: new Date().toISOString(),
      sourceType: source?.type ?? null,
      sourceId: source?.id ?? null,
    });
  }

  if (personId && emitBecameCustomer) {
    await emitPersonBecameCustomer(supabase, {
      personId,
      userId,
      firstPurchaseAt: emitBecameCustomer.firstPurchaseAt,
      productSummary: emitBecameCustomer.productSummary ?? null,
    });
  }

  // Fallback path: couldn't resolve. Queue the seed data so
  // IParentingSchool can mint the person_id later and reply with
  // person.linked. We deliberately DO emit enrollment_pending even
  // when emitEnrolledEvent was true — the receiver will resolve to a
  // person_id then send back the link.
  if (resolutionFailed) {
    await emitPersonEnrollmentPending(supabase, {
      userId,
      email,
      name: [firstName, lastName].filter(Boolean).join(" ").trim() || null,
      phone: phone ?? null,
      locale: locale ?? null,
      country: country ?? null,
      source: source ?? null,
    });
  }

  return { personId, pending: resolutionFailed };
}
