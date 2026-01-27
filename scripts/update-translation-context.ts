import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function update() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  const keys = [
    'admin.payments.reports.afterRefunds',
    'admin.payments.reports.collectionRate',
    'admin.payments.reports.ofExpected',
  ];

  for (const key of keys) {
    const { error } = await supabase
      .from('translations')
      .update({ context: 'admin' })
      .eq('tenant_id', tenantId)
      .eq('translation_key', key);

    console.log(error ? `Error ${key}: ${error.message}` : `✅ Updated ${key}`);
  }
}

update().then(() => process.exit(0));
