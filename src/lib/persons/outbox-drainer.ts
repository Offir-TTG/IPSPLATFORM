/**
 * Outbox drainer — IPSPlatform side.
 *
 * Polls `public.outbox_events` for pending rows, POSTs each one to
 * IParentingSchool's inbound endpoint, and marks the row delivered or
 * schedules the next retry. Designed for at-least-once delivery: the
 * receiver de-dupes by `event_id`.
 *
 * Backoff:
 *   attempt N → next_attempt_at = now() + min(2^N seconds, 1 hour)
 *   attempts >= 12 → dead_letter = true (admin must replay manually)
 *
 * Run via /api/cron/drain-outbox at a 1-minute cadence on Vercel cron.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { PersonEventEnvelope, PersonEventType } from "./types";

const BATCH_SIZE = 50;
const MAX_BACKOFF_SECONDS = 3600;
const MAX_ATTEMPTS = 12;
const HTTP_TIMEOUT_MS = 8000;

type OutboxRow = {
  id: string;
  event_type: string;
  person_id: string | null;
  user_id: string | null;
  payload: unknown;
  attempts: number;
  created_at: string;
};

export type DrainResult = {
  picked: number;
  delivered: number;
  retried: number;
  dead_lettered: number;
  configured: boolean;
};

/** Target URL of the peer. The plan calls the IParentingSchool host
 *  `IPARENTING_URL`; we already use `NEXT_PUBLIC_IPARENTING_URL` in
 *  the admin CRM-tags fetch (src/app/api/admin/crm/tags/route.ts:44),
 *  so reuse that for consistency. Falls back to `IPARENTING_URL` so
 *  ops can pin a private hostname for the cron worker. */
function getPeerUrl(): string {
  const raw =
    process.env.IPARENTING_URL ?? process.env.NEXT_PUBLIC_IPARENTING_URL ?? "";
  return raw.replace(/\/$/, "");
}

export async function drainOutbox(): Promise<DrainResult> {
  const peerUrl = getPeerUrl();
  const secret = process.env.CRM_LOOKUP_SECRET ?? "";
  if (!peerUrl || !secret) {
    return { picked: 0, delivered: 0, retried: 0, dead_lettered: 0, configured: false };
  }

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("outbox_events")
    .select("id, event_type, person_id, user_id, payload, attempts, created_at")
    .is("delivered_at", null)
    .eq("dead_letter", false)
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[outbox-drainer] select failed:", error.message);
    return { picked: 0, delivered: 0, retried: 0, dead_lettered: 0, configured: true };
  }

  const events = (rows ?? []) as OutboxRow[];
  let delivered = 0;
  let retried = 0;
  let deadLettered = 0;

  for (const ev of events) {
    const envelope: PersonEventEnvelope = {
      event_id: ev.id,
      event_type: ev.event_type as PersonEventType,
      source: "ipsplatform",
      emitted_at: ev.created_at,
      payload: ev.payload,
    };

    const outcome = await postWithTimeout(
      `${peerUrl}/api/admin/persons/inbound`,
      secret,
      envelope,
    );

    if (outcome.ok) {
      await supabase
        .from("outbox_events")
        .update({
          delivered_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", ev.id);
      delivered++;
      continue;
    }

    const nextAttempts = ev.attempts + 1;
    const isPermanent =
      outcome.statusGroup === "4xx" &&
      outcome.status !== 408 &&
      outcome.status !== 429;
    const giveUp = nextAttempts >= MAX_ATTEMPTS || isPermanent;

    if (giveUp) {
      await supabase
        .from("outbox_events")
        .update({
          attempts: nextAttempts,
          last_error: outcome.error.slice(0, 1000),
          dead_letter: true,
        })
        .eq("id", ev.id);
      deadLettered++;
      console.error(
        `[outbox-drainer] dead-letter ${ev.id} (${ev.event_type}): ${outcome.error}`,
      );
      continue;
    }

    const backoffSeconds = Math.min(
      Math.pow(2, nextAttempts),
      MAX_BACKOFF_SECONDS,
    );
    const nextAttemptAt = new Date(
      Date.now() + backoffSeconds * 1000,
    ).toISOString();
    await supabase
      .from("outbox_events")
      .update({
        attempts: nextAttempts,
        last_error: outcome.error.slice(0, 1000),
        next_attempt_at: nextAttemptAt,
      })
      .eq("id", ev.id);
    retried++;
  }

  return {
    picked: events.length,
    delivered,
    retried,
    dead_lettered: deadLettered,
    configured: true,
  };
}

type PostOutcome =
  | { ok: true; status: number }
  | {
      ok: false;
      status: number;
      statusGroup: "4xx" | "5xx" | "network";
      error: string;
    };

async function postWithTimeout(
  url: string,
  bearer: string,
  envelope: PersonEventEnvelope,
): Promise<PostOutcome> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify(envelope),
      signal: ctrl.signal,
      cache: "no-store",
    });

    if (res.ok) return { ok: true, status: res.status };

    const text = await res.text().catch(() => "");
    const group: "4xx" | "5xx" =
      res.status >= 500 || res.status === 408 || res.status === 429
        ? "5xx"
        : "4xx";
    return {
      ok: false,
      status: res.status,
      statusGroup: group,
      error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      statusGroup: "network",
      error: e instanceof Error ? e.message : "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}
