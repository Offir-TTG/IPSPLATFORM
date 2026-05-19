/**
 * HTTP client for IParentingSchool's /api/admin/persons/get-or-create.
 *
 * Called during registration (and at invitation-accept) to atomically
 * mint or resolve a person_id by email. IPSPlatform never generates
 * person_ids locally — IParentingSchool is the only minter.
 *
 * Behaviour:
 *   - 2xx → returns { person_id, was_created }.
 *   - non-2xx / timeout / config missing → returns { ok: false } so the
 *     caller can fall back to the person.enrollment_pending outbox
 *     event. Never throws.
 */

const HTTP_TIMEOUT_MS = 4000;

type Source = {
  type: "course" | "program" | "lecture" | "form" | "import";
  id: string | null;
  slug: string | null;
};

export type GetOrCreatePersonInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
  locale?: string | null;
  country?: string | null;
  /** Single-line address string from the enrollment wizard. Stored
   *  on the CRM contact's address_line1 (only when the contact is
   *  new — admin-curated address values are not overwritten). */
  address_line1?: string | null;
  /** Structured address parts parsed from Google Places' address_components.
   *  Same create-time fill semantic as address_line1 — only populated when
   *  the corresponding column on crm_contacts is still NULL. */
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  source?: Source | null;
  marketing_opt_in?: boolean;
};

export type GetOrCreatePersonOutcome =
  | { ok: true; person_id: string; was_created: boolean }
  | { ok: false; reason: "not_configured" | "timeout" | "http_error" | "network"; status?: number; message?: string };

function getPeerUrl(): string {
  const raw =
    process.env.IPARENTING_URL ?? process.env.NEXT_PUBLIC_IPARENTING_URL ?? "";
  return raw.replace(/\/$/, "");
}

export async function getOrCreatePerson(
  input: GetOrCreatePersonInput,
): Promise<GetOrCreatePersonOutcome> {
  const peerUrl = getPeerUrl();
  const secret = process.env.CRM_LOOKUP_SECRET ?? "";
  if (!peerUrl || !secret) {
    return { ok: false, reason: "not_configured" };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(`${peerUrl}/api/admin/persons/get-or-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(input),
      signal: ctrl.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "http_error",
        status: res.status,
        message: text.slice(0, 200),
      };
    }

    const data = await res.json();
    if (typeof data?.person_id !== "string") {
      return {
        ok: false,
        reason: "http_error",
        status: res.status,
        message: "Response missing person_id",
      };
    }
    return {
      ok: true,
      person_id: data.person_id,
      was_created: !!data.was_created,
    };
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      reason: isAbort ? "timeout" : "network",
      message: e instanceof Error ? e.message : "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}
