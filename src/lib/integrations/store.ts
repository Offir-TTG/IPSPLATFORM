import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * The one place integration settings (Stripe, Zoom, DocuSign, Daily, ...) are
 * read and written.
 *
 * - Server only, with the service key and an explicit tenant filter, so the
 *   database can refuse the `integrations` table to browsers entirely.
 * - Secret values are encrypted at rest (AES-256-GCM) when
 *   INTEGRATIONS_ENCRYPTION_KEY is set. Values saved before encryption was
 *   switched on are still read as they are, until they're saved again or the
 *   one-off script encrypts them.
 * - The admin screen only ever receives masked secrets.
 */

export type IntegrationRow = {
  id: string;
  tenant_id: string | null;
  integration_key: string;
  integration_name?: string | null;
  is_enabled: boolean;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  updated_at?: string | null;
  [column: string]: any;
};

const PREFIX = 'enc:v1:';

function encryptionKey(): Buffer | null {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY must be 32 bytes, base64 encoded');
  }
  return key;
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

function encryptValue(value: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}

function decryptValue(value: string, key: Buffer | null): string {
  if (!key) {
    throw new Error('Integration secrets are encrypted but INTEGRATIONS_ENCRYPTION_KEY is not set');
  }
  const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

/** Encrypts every non-empty string value. Unchanged when no key is set. */
export function encryptCredentials(credentials: Record<string, any> | null | undefined): Record<string, any> {
  const key = encryptionKey();
  const out: Record<string, any> = {};
  for (const [name, value] of Object.entries(credentials ?? {})) {
    out[name] = key && typeof value === 'string' && value.length > 0 && !isEncrypted(value)
      ? encryptValue(value, key)
      : value;
  }
  return out;
}

export function decryptCredentials(credentials: Record<string, any> | null | undefined): Record<string, any> {
  const key = encryptionKey();
  const out: Record<string, any> = {};
  for (const [name, value] of Object.entries(credentials ?? {})) {
    out[name] = isEncrypted(value) ? decryptValue(value as string, key) : value;
  }
  return out;
}

/** Names that hold identifiers rather than secrets, shown in full to the admin. */
const NOT_SECRET = new Set([
  'publishable_key', 'client_id', 'account_id', 'integration_key', 'user_id', 'oauth_base_path',
  'base_path', 'base_url', 'api_url', 'domain', 'from_email', 'from_name', 'sdk_key', 'region', 'mode',
  // SMTP: the server, its port and security, and the login name (the password stays secret).
  'host', 'port', 'security', 'username',
]);

const MASK = '••••••••';

/** What the admin screen may see: secrets reduced to their last 4 characters. */
export function maskCredentials(credentials: Record<string, any> | null | undefined): Record<string, any> {
  const plain = decryptCredentials(credentials);
  const out: Record<string, any> = {};
  for (const [name, value] of Object.entries(plain)) {
    out[name] =
      typeof value === 'string' && value.length > 0 && !NOT_SECRET.has(name)
        ? `${MASK}${value.length > 8 ? value.slice(-4) : ''}`
        : value;
  }
  return out;
}

export function isMasked(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(MASK);
}

/**
 * Merges what the admin submitted into what's saved: a masked value sent back
 * unchanged keeps the saved secret; anything else replaces it.
 */
export function mergeSubmittedCredentials(
  saved: Record<string, any> | null | undefined,
  submitted: Record<string, any> | null | undefined,
): Record<string, any> {
  const current = decryptCredentials(saved);
  const next: Record<string, any> = { ...current };
  for (const [name, value] of Object.entries(submitted ?? {})) {
    if (isMasked(value)) continue;
    next[name] = value;
  }
  return next;
}

function decryptRow(row: any): IntegrationRow {
  return { ...row, credentials: decryptCredentials(row?.credentials), settings: row?.settings ?? {} };
}

type Result<T> = { data: T; error: { message: string } | null };

/**
 * One tenant's integration, secrets decrypted. Same `{ data, error }` shape as
 * a Supabase `.single()` call: a missing integration is an error.
 * `tenantId: null` reads the platform-wide row.
 */
export async function loadIntegration(
  tenantId: string | null,
  integrationKey: string,
  options: { enabledOnly?: boolean } = {},
): Promise<Result<IntegrationRow | null>> {
  const supabase = createAdminClient();
  let query = supabase.from('integrations').select('*').eq('integration_key', integrationKey);
  query = tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
  if (options.enabledOnly) query = query.eq('is_enabled', true);
  const { data, error } = await query.maybeSingle();
  if (error) return { data: null, error: { message: error.message } };
  if (!data) return { data: null, error: { message: `${integrationKey} is not set up` } };
  try {
    return { data: decryptRow(data), error: null };
  } catch (e: any) {
    return { data: null, error: { message: e?.message ?? 'Could not read integration secrets' } };
  }
}

/** The same integration for every tenant, for webhooks that must find the sender. */
export async function listIntegrations(
  integrationKey: string,
  options: { enabledOnly?: boolean } = {},
): Promise<Result<IntegrationRow[]>> {
  const supabase = createAdminClient();
  let query = supabase.from('integrations').select('*').eq('integration_key', integrationKey);
  if (options.enabledOnly) query = query.eq('is_enabled', true);
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) return { data: [], error: { message: error.message } };
  const rows: IntegrationRow[] = [];
  for (const row of data ?? []) {
    try {
      rows.push(decryptRow(row));
    } catch (e) {
      console.error(`[integrations] Could not read ${integrationKey} secrets for tenant ${row.tenant_id}`);
    }
  }
  return { data: rows, error: null };
}

/** Every integration of one tenant, for the admin screen (secrets masked). */
export async function listTenantIntegrationsMasked(tenantId: string): Promise<Result<IntegrationRow[]>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('integration_name', { ascending: true });
  if (error) return { data: [], error: { message: error.message } };
  return {
    data: (data ?? []).map((row) => ({ ...row, credentials: maskCredentials(row.credentials), settings: row.settings ?? {} })),
    error: null,
  };
}

/**
 * Saves one tenant's integration, encrypting secrets. Only the given fields
 * change; credentials are saved exactly as passed (merge first if needed).
 */
export async function saveIntegration(
  tenantId: string,
  integrationKey: string,
  fields: { integration_name?: string; is_enabled?: boolean; credentials?: Record<string, any>; settings?: Record<string, any>; [column: string]: any },
): Promise<Result<IntegrationRow | null>> {
  const supabase = createAdminClient();
  const values: Record<string, any> = { ...fields, updated_at: new Date().toISOString() };
  if (fields.credentials) values.credentials = encryptCredentials(fields.credentials);

  const { data: existing, error: findError } = await supabase
    .from('integrations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('integration_key', integrationKey)
    .maybeSingle();
  if (findError) return { data: null, error: { message: findError.message } };

  const { data, error } = existing
    ? await supabase.from('integrations').update(values).eq('id', existing.id).select('*').single()
    : await supabase
        .from('integrations')
        .insert({
          tenant_id: tenantId,
          integration_key: integrationKey,
          webhook_url: `/api/webhooks/${integrationKey}`,
          ...values,
        })
        .select('*')
        .single();
  if (error) return { data: null, error: { message: error.message } };
  return { data: decryptRow(data), error: null };
}
