/**
 * Saves the SMTP settings from .env.local as the SMTP integration (Settings →
 * Integrations → SMTP), encrypted, and switches it on. Lines may be commented
 * out (#SMTP_HOST=...); they are read either way. Prints no secrets.
 *
 *   npx tsx scripts/seed-smtp-from-env.ts            (every tenant)
 *   npx tsx scripts/seed-smtp-from-env.ts <tenantId> (one tenant)
 *
 * Reads: SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/ssl, false/tls, none),
 * SMTP_USER, SMTP_PASSWORD, SMTP_FROM ("Name <email>" or an email),
 * SMTP_FROM_EMAIL, SMTP_FROM_NAME.
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true } as any);

function readSmtpLines(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*#?\s*(SMTP_[A-Z_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    // An uncommented line wins over a commented one with the same name.
    if (!(m[1] in out) || !raw.trim().startsWith('#')) out[m[1]] = value;
  }
  return out;
}

async function main() {
  const env = readSmtpLines(path.resolve(process.cwd(), '.env.local'));
  if (!env.SMTP_HOST) throw new Error('No SMTP_HOST in .env.local');

  const fromLine = env.SMTP_FROM ?? '';
  const named = fromLine.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const fromEmail = env.SMTP_FROM_EMAIL || (named ? named[2].trim() : fromLine.trim()) || env.SMTP_USER || '';
  const fromName = env.SMTP_FROM_NAME || (named ? named[1].trim() : '') || '';
  const secure = (env.SMTP_SECURE ?? '').toLowerCase();
  const port = env.SMTP_PORT || (secure === 'true' || secure === 'ssl' ? '465' : '587');
  const security = secure === 'true' || secure === 'ssl' ? 'ssl' : secure === 'none' ? 'none' : port === '465' ? 'ssl' : 'tls';

  const credentials: Record<string, string> = {
    host: env.SMTP_HOST,
    port,
    security,
    ...(env.SMTP_USER ? { username: env.SMTP_USER } : {}),
    ...(env.SMTP_PASSWORD ? { password: env.SMTP_PASSWORD } : {}),
    ...(fromEmail ? { from_email: fromEmail } : {}),
    ...(fromName ? { from_name: fromName } : {}),
  };

  const { createAdminClient } = await import('../src/lib/supabase/server');
  const { saveIntegration } = await import('../src/lib/integrations/store');
  const { smtpConfigFrom, smtpTransport } = await import('../src/lib/email/send');

  // Check the settings work before saving them.
  try {
    await smtpTransport(smtpConfigFrom(credentials)!).verify();
    console.log(`Connected and logged in to ${credentials.host}:${port} (${security}).`);
  } catch (e: any) {
    console.log(`WARNING: could not log in to ${credentials.host}:${port} (${security}): ${e?.message ?? e}`);
    console.log('Saving anyway, so they can be corrected on the Integrations page.');
  }

  const tenantArg = process.argv[2];
  const db = createAdminClient();
  const { data: tenants, error } = tenantArg
    ? await db.from('tenants').select('id, name').eq('id', tenantArg)
    : await db.from('tenants').select('id, name');
  if (error) throw error;
  if (!tenants?.length) throw new Error('No tenant found');

  for (const t of tenants) {
    const { error: saveError } = await saveIntegration(t.id, 'smtp', {
      integration_name: 'SMTP',
      is_enabled: true,
      credentials,
      settings: {},
    });
    if (saveError) throw new Error(`${t.name}: ${(saveError as any).message ?? saveError}`);
    console.log(`Saved SMTP for "${t.name}": sender ${fromEmail ? fromEmail.replace(/^[^@]*/, '…') : '(none)'}${fromName ? ` as "${fromName}"` : ''}, password ${credentials.password ? 'set' : 'not set'}.`);
  }
}

main().catch((e) => {
  console.error('failed:', e?.message ?? e);
  process.exit(1);
});
