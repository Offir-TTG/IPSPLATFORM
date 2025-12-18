import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Sample translation row:', JSON.stringify(data, null, 2));
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
