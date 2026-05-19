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
  /** Single-line address string from the enrollment wizard's profile
   *  step. Forwarded to IParentingSchool's get-or-create to populate
   *  the CRM contact's address_line1 on initial create. */
  addressLine1?: string | null;
  /** Structured address parts parsed from Google Places' address_components.
   *  Each field becomes its own column on crm_contacts so the CRM admin can
   *  filter/segment by city / region / postal. Only the create-time fill
   *  semantic applies (never overwrite admin-curated values). */
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
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
    /** CRM tag slugs from the purchased product. Forwarded in the
     *  outbox event payload; IParentingSchool resolves slugs →
     *  tag_ids and applies them to crm_contact_tags. */
    crmTagSlugs?: string[];
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
    addressLine1,
    city,
    region,
    postalCode,
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
  // Always call get-or-create when we have profile/address data to push.
  // The signed token (when present) is only a resilience fallback for the
  // case where IParentingSchool is unreachable — it lets us link the user
  // locally without a round-trip. But we cannot use the token as a shortcut
  // and skip the call entirely, because get-or-create is also the channel
  // that delivers the wizard's name / phone / address parts to the CRM.
  let personId: string | null = null;
  let resolutionFailed = false;

  const tokenClaims = verifyPersonToken(personToken ?? null);
  const tokenMatchesEmail =
    !!tokenClaims &&
    tokenClaims.email.trim().toLowerCase() === email.trim().toLowerCase();

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
    address_line1: addressLine1 ?? null,
    city: city ?? null,
    region: region ?? null,
    postal_code: postalCode ?? null,
    source: safeSource,
  });

  if (outcome.ok) {
    personId = outcome.person_id;
  } else if (tokenMatchesEmail && tokenClaims) {
    // Cross-app call failed but we have a trusted token — use its
    // person_id so the local user.person_id stamp can still happen.
    // The address/profile parts the token didn't carry will land
    // later via the person.enrollment_pending fallback below.
    personId = tokenClaims.person_id;
    resolutionFailed = true;
    console.warn(
      "[persons/attach] get-or-create unreachable; falling back to token person_id and queueing enrollment_pending:",
      outcome.reason,
    );
  } else {
    resolutionFailed = true;
    console.warn(
      "[persons/attach] get-or-create unreachable; queueing enrollment_pending:",
      outcome.reason,
    );
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
      crmTagSlugs: emitBecameCustomer.crmTagSlugs ?? [],
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
      addressLine1: addressLine1 ?? null,
      city: city ?? null,
      region: region ?? null,
      postalCode: postalCode ?? null,
      source: source ?? null,
    });
  }

  return { personId, pending: resolutionFailed };
}
