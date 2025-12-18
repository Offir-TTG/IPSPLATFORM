import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkContexts() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
  const tenantId = tenants?.id;

  const { data } = await supabase
    .from('translations')
    .select('context')
    .eq('tenant_id', tenantId)
    .limit(100);

  const uniqueContexts = [...new Set(data?.map(t => t.context))];
  console.log('Unique context values found:', uniqueContexts);

  process.exit(0);
}

checkContexts();
