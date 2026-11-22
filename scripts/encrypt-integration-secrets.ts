/**
 * One-off: encrypts the integration secrets saved before encryption existed.
 *
 *   1. Set INTEGRATIONS_ENCRYPTION_KEY in .env.local (and the same value on
 *      Vercel). Make one with:
 *        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *   2. Deploy the code that reads encrypted secrets.
 *   3. Run:  npx tsx scripts/encrypt-integration-secrets.ts          (dry run)
 *            npx tsx scripts/encrypt-integration-secrets.ts --write  (saves)
 *
 * Safe to run again: values already encrypted are left alone. Nothing secret
 * is printed. Keep the key safe: without it the saved secrets can't be read.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const write = process.argv.includes('--write');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase settings missing from .env.local');
  if (!process.env.INTEGRATIONS_ENCRYPTION_KEY) throw new Error('Set INTEGRATIONS_ENCRYPTION_KEY first');

  // Same code the app uses, so the format can't drift.
  const { encryptCredentials, decryptCredentials, isEncrypted } = await import('../src/lib/integrations/store');

  const supabase = createClient(url, serviceKey);
  const { data: rows, error } = await supabase.from('integrations').select('id, tenant_id, integration_key, credentials');
  if (error) throw error;

  let changed = 0;
  for (const row of rows ?? []) {
    const credentials = (row.credentials ?? {}) as Record<string, unknown>;
    const plainFields = Object.entries(credentials).filter(
      ([, v]) => typeof v === 'string' && v.length > 0 && !isEncrypted(v),
    );
    if (plainFields.length === 0) continue;

    const encrypted = encryptCredentials(credentials as Record<string, any>);
    // Prove it reads back identically before saving anything.
    const roundTrip = decryptCredentials(encrypted);
    for (const [name, value] of Object.entries(credentials)) {
      if (roundTrip[name] !== value) throw new Error(`Round trip failed for ${row.integration_key}.${name}; nothing saved`);
    }

    console.log(`${write ? 'Encrypting' : 'Would encrypt'} ${row.integration_key} (tenant ${row.tenant_id ?? 'platform'}): ${plainFields.map(([k]) => k).join(', ')}`);
    if (write) {
      const { error: updateError } = await supabase.from('integrations').update({ credentials: encrypted }).eq('id', row.id);
      if (updateError) throw updateError;
    }
    changed++;
  }
  console.log(`\n${changed} integration(s) ${write ? 'encrypted' : 'to encrypt (dry run; add --write to save)'}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
