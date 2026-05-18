/**
 * Signed-token codec for the IParentingSchool → IPSPlatform redirect.
 *
 * When a known visitor (someone IParentingSchool already has a
 * crm_contacts row for) clicks a Register CTA, the redirect URL
 * carries this token in `?person=...` so IPSPlatform can stamp
 * users.person_id directly without making a cross-app HTTP call.
 *
 * Format (compact, URL-safe):
 *   base64url(JSON.stringify({ person_id, email, name, exp })) +
 *   "." + base64url(HMAC-SHA256(secret, body))
 *
 * Secret: PERSON_TOKEN_SECRET env var, shared between the two repos.
 * Expiry: signed-in payload's `exp` (unix seconds); 30 minutes default.
 *
 * IParentingSchool mints the token with the same secret; the codec
 * here decodes + verifies it. Both repos ship an identical file.
 */

import { createHmac, timingSafeEqual } from "crypto";

export type PersonToken = {
  person_id: string;
  email: string;
  name: string | null;
  /** Unix epoch seconds; tokens past this are rejected. */
  exp: number;
};

const DEFAULT_TTL_SECONDS = 30 * 60;

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(secret: string, body: string): string {
  return b64url(createHmac("sha256", secret).update(body).digest());
}

/** Build the token. Used by IParentingSchool's enroll-redirect helper. */
export function signPersonToken(
  payload: Omit<PersonToken, "exp"> & { exp?: number },
  secret = process.env.PERSON_TOKEN_SECRET ?? "",
): string {
  if (!secret) throw new Error("PERSON_TOKEN_SECRET is not configured");
  const exp =
    payload.exp ?? Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
  const claims: PersonToken = {
    person_id: payload.person_id,
    email: payload.email,
    name: payload.name ?? null,
    exp,
  };
  const body = b64url(JSON.stringify(claims));
  return `${body}.${sign(secret, body)}`;
}

/** Verify + parse the token. Returns null on any failure (bad signature,
 *  expired, malformed). Callers must treat null as "no signed identity
 *  available" — fall back to anonymous flow / get-or-create. */
export function verifyPersonToken(
  token: string | null | undefined,
  secret = process.env.PERSON_TOKEN_SECRET ?? "",
): PersonToken | null {
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Constant-time compare to avoid timing leaks on the signature.
  const expected = sign(secret, body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  let claims: PersonToken;
  try {
    claims = JSON.parse(b64urlDecode(body).toString("utf8")) as PersonToken;
  } catch {
    return null;
  }
  if (
    typeof claims?.person_id !== "string" ||
    typeof claims?.email !== "string" ||
    typeof claims?.exp !== "number"
  ) {
    return null;
  }
  if (claims.exp < Math.floor(Date.now() / 1000)) return null;
  return claims;
}
