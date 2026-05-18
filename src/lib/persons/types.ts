/**
 * Cross-platform Person Identity — shared type contract (IPSPlatform mirror).
 *
 * These types describe the wire format of events that travel between
 * IPSPlatform (this app) and IParentingSchool. Keep them in lockstep
 * with src/lib/persons/types.ts in the IParentingSchool repo — any
 * change to event_type or payload shape must be applied to both files
 * in the same release.
 *
 * Architecture: see C:\Users\OffirOmer\.claude\plans\structured-conjuring-lake.md
 */

/** A person's identifying details as carried across the wire. Used by
 *  both directions of communication (inbound + outbox events) so admins
 *  can rebuild the local projection from any envelope. */
export type PersonPassport = {
  person_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  locale: string | null;
  marketing_opt_in: boolean;
  lifecycle_stage: "lead" | "contact" | "customer";
  source: {
    type: "course" | "program" | "lecture" | "form" | "import";
    id: string | null;
    slug: string | null;
  } | null;
  archived_at: string | null;
  source_updated_at: string;
  version: number;
};

/** Envelope wrapping every event. `event_id` is the idempotency key —
 *  the receiver writes it to `inbound_events` and rejects duplicates. */
export type PersonEventEnvelope<P = unknown> = {
  event_id: string;
  event_type: PersonEventType;
  source: "iparentingschool" | "ipsplatform";
  emitted_at: string;
  source_updated_at?: string;
  version?: number;
  payload: P;
};

export type PersonEventType =
  // IParentingSchool → IPSPlatform
  | "person.upserted"
  | "persons.bulk_upserted"
  | "person.archived"
  | "person.email_changed"
  | "person.linked"
  // IPSPlatform → IParentingSchool
  | "person.enrolled"
  | "person.became_customer"
  | "person.enrollment_pending";

export type PersonUpsertedPayload = { person: PersonPassport };

export type PersonsBulkUpsertedPayload = { persons: PersonPassport[] };

export type PersonArchivedPayload = {
  person_id: string;
  archived_at: string;
};

export type PersonEmailChangedPayload = {
  person_id: string;
  old_email: string;
  new_email: string;
};

export type PersonLinkedPayload = {
  ips_user_id: string;
  person_id: string;
};

export type PersonEnrolledPayload = {
  person_id: string;
  enrolled_at: string;
  source_type: "course" | "program" | "lecture" | null;
  source_id: string | null;
};

export type PersonBecameCustomerPayload = {
  person_id: string;
  first_purchase_at: string;
  product_summary?: {
    product_name: string;
    product_type: string | null;
    amount: number;
    currency: string;
  } | null;
};

export type PersonEnrollmentPendingPayload = {
  ips_user_id: string;
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
};
