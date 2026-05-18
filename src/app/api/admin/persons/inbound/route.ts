import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PersonEventEnvelope,
  PersonPassport,
  PersonUpsertedPayload,
  PersonsBulkUpsertedPayload,
  PersonArchivedPayload,
  PersonEmailChangedPayload,
  PersonLinkedPayload,
} from "@/lib/persons/types";

export const dynamic = "force-dynamic";

/**
 * Inbound endpoint for person-identity events from IParentingSchool.
 *
 *   POST /api/admin/persons/inbound
 *   Authorization: Bearer <CRM_LOOKUP_SECRET>
 *   Body: PersonEventEnvelope
 *
 * Supported event_types (events arriving FROM IParentingSchool):
 *   - person.upserted          → upsert external_persons + link to
 *                                public.users when a matching email
 *                                exists with NULL person_id
 *   - persons.bulk_upserted    → iterate (legacy-CRM import case)
 *   - person.archived          → stamp external_persons.archived_at
 *                                (does NOT disable auth.users)
 *   - person.email_changed     → update external_persons.email and
 *                                public.users.email by person_id
 *   - person.linked            → IParentingSchool's reply to an
 *                                earlier person.enrollment_pending —
 *                                stamp public.users.person_id
 *
 * Every event_id is recorded in `inbound_events`; duplicates 200-no-op.
 * Out-of-order events (older source_updated_at than what we already
 * have on the row) are silently dropped.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRM_LOOKUP_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRM_LOOKUP_SECRET is not configured" },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let envelope: PersonEventEnvelope;
  try {
    envelope = (await request.json()) as PersonEventEnvelope;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !envelope ||
    typeof envelope.event_id !== "string" ||
    typeof envelope.event_type !== "string" ||
    typeof envelope.source !== "string"
  ) {
    return NextResponse.json(
      { error: "Malformed envelope" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Idempotency gate.
  const { error: idemErr } = await supabase.from("inbound_events").insert({
    event_id: envelope.event_id,
    source: envelope.source,
    event_type: envelope.event_type,
  });

  if (idemErr) {
    if (idemErr.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    console.error("[persons/inbound] idempotency insert failed:", idemErr);
    return NextResponse.json(
      { error: "Idempotency check failed" },
      { status: 500 },
    );
  }

  try {
    switch (envelope.event_type) {
      case "person.upserted":
        await handleUpserted(
          supabase,
          (envelope.payload as PersonUpsertedPayload).person,
        );
        break;
      case "persons.bulk_upserted": {
        const persons = (envelope.payload as PersonsBulkUpsertedPayload).persons;
        if (Array.isArray(persons)) {
          for (const p of persons) await handleUpserted(supabase, p);
        }
        break;
      }
      case "person.archived":
        await handleArchived(
          supabase,
          envelope.payload as PersonArchivedPayload,
        );
        break;
      case "person.email_changed":
        await handleEmailChanged(
          supabase,
          envelope.payload as PersonEmailChangedPayload,
        );
        break;
      case "person.linked":
        await handleLinked(
          supabase,
          envelope.payload as PersonLinkedPayload,
        );
        break;
      default:
        console.warn(
          "[persons/inbound] unknown event_type:",
          envelope.event_type,
        );
    }
  } catch (e) {
    console.error("[persons/inbound] handler failed:", envelope.event_type, e);
    // Roll back idempotency so the sender's retry can re-process.
    await supabase
      .from("inbound_events")
      .delete()
      .eq("event_id", envelope.event_id);
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** Split a "First Last" name into the two columns we store. Falls
 *  back to putting the whole string in first_name when there's only
 *  one token — Hebrew + multi-word names common, so we split on the
 *  first whitespace and bucket the remainder as family_name. */
function splitName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const t = full.trim();
  if (!t) return { first: null, last: null };
  const i = t.indexOf(" ");
  if (i < 0) return { first: t, last: null };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() || null };
}

/** Apply a Person passport to local state.
 *
 *   1. Upsert external_persons by person_id, dropping the write when
 *      the incoming source_updated_at is older than what we have.
 *   2. If a public.users row already exists with matching email and
 *      NULL person_id, stamp it and copy the projection fields.
 *
 *  Field ownership: name/phone/country/locale are IParentingSchool-
 *  owned. external_persons is therefore the SOURCE OF TRUTH on this
 *  side for those fields — public.users carries them only as a cache
 *  for performance, kept in lockstep on each upsert here. */
async function handleUpserted(supabase: SupabaseClient, p: PersonPassport) {
  if (!p?.person_id || !p.email) return;
  const emailNorm = p.email.trim().toLowerCase();
  const { first, last } = splitName(p.name);

  // Drop stale events on the external_persons projection.
  const { data: existing } = await supabase
    .from("external_persons")
    .select("source_updated_at")
    .eq("person_id", p.person_id)
    .maybeSingle();

  if (
    existing &&
    new Date(p.source_updated_at).getTime() <
      new Date(existing.source_updated_at).getTime()
  ) {
    return; // older than what we have — drop
  }

  const projection = {
    person_id: p.person_id,
    email: emailNorm,
    first_name: first,
    last_name: last,
    phone: p.phone,
    country: p.country,
    locale: p.locale,
    marketing_opt_in: !!p.marketing_opt_in,
    lifecycle_stage: p.lifecycle_stage,
    archived_at: p.archived_at,
    source_updated_at: p.source_updated_at,
    version: p.version,
  };

  await supabase
    .from("external_persons")
    .upsert(projection, { onConflict: "person_id" });

  // Link existing user (created by an earlier signup-pending fallback,
  // OR a pre-existing local row we hadn't reconciled) to this person_id.
  // Match by email when person_id is NULL.
  const { data: matchByPid } = await supabase
    .from("users")
    .select("id, person_id")
    .eq("person_id", p.person_id)
    .maybeSingle();

  if (matchByPid) {
    // Already linked — refresh the projection mirror on users so name
    // and phone stay in lockstep with IParentingSchool.
    await supabase
      .from("users")
      .update({
        first_name: first,
        last_name: last,
        phone: p.phone,
        person_source_updated_at: p.source_updated_at,
        person_version: p.version,
      })
      .eq("id", matchByPid.id);
    // Mark linkage on external_persons (one-time stamp).
    await supabase
      .from("external_persons")
      .update({ linked_user_id: matchByPid.id })
      .eq("person_id", p.person_id)
      .is("linked_user_id", null);
    return;
  }

  // No user with this person_id. Try by email — common case when this
  // is the first projection of a CRM contact that hasn't yet registered.
  const { data: byEmail } = await supabase
    .from("users")
    .select("id, person_id")
    .ilike("email", emailNorm)
    .is("person_id", null)
    .maybeSingle();

  if (byEmail) {
    await supabase
      .from("users")
      .update({
        person_id: p.person_id,
        first_name: first,
        last_name: last,
        phone: p.phone,
        person_source_updated_at: p.source_updated_at,
        person_version: p.version,
      })
      .eq("id", byEmail.id);
    await supabase
      .from("external_persons")
      .update({ linked_user_id: byEmail.id })
      .eq("person_id", p.person_id);
  }
}

async function handleArchived(
  supabase: SupabaseClient,
  payload: PersonArchivedPayload,
) {
  if (!payload?.person_id) return;
  await supabase
    .from("external_persons")
    .update({ archived_at: payload.archived_at })
    .eq("person_id", payload.person_id);
  // Deliberately do NOT touch public.users or auth.users — archiving
  // on the CRM side is a marketing-visibility flag, not an account
  // disable. Account suspension is a separate admin action.
}

async function handleEmailChanged(
  supabase: SupabaseClient,
  payload: PersonEmailChangedPayload,
) {
  if (!payload?.person_id || !payload.new_email) return;
  const next = payload.new_email.trim().toLowerCase();
  if (!next) return;
  await supabase
    .from("external_persons")
    .update({ email: next })
    .eq("person_id", payload.person_id);
  // Also propagate to public.users when this person already has a user
  // row. auth.users.email change requires the Supabase Auth Admin API
  // and is intentionally NOT done here — admin-initiated email edits
  // are a separate, audited flow. We update only the mirrored email
  // on public.users for display/lookup consistency.
  await supabase
    .from("users")
    .update({ email: next })
    .eq("person_id", payload.person_id);
}

/** IParentingSchool's reply to a `person.enrollment_pending` we sent
 *  earlier. Stamp users.person_id so future events resolve cleanly. */
async function handleLinked(
  supabase: SupabaseClient,
  payload: PersonLinkedPayload,
) {
  if (!payload?.ips_user_id || !payload.person_id) return;
  await supabase
    .from("users")
    .update({ person_id: payload.person_id })
    .eq("id", payload.ips_user_id)
    .is("person_id", null); // never overwrite an already-linked user
}
