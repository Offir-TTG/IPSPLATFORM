import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslation() {
  console.log('Adding "Showing" translation...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenant found');
    return;
  }

  const tenantId = tenants[0].id;

  // Add English
  const { error: enError } = await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'en',
    translation_key: 'emails.queue.showing_prefix',
    translation_value: 'Showing',
    category: 'emails',
    context: 'admin'
  });

  if (enError && !enError.message.includes('duplicate')) {
    console.error('❌ Error adding EN:', enError.message);
  } else {
    console.log('✅ Added EN: "Showing"');
  }

  // Add Hebrew
  const { error: heError } = await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'he',
    translation_key: 'emails.queue.showing_prefix',
    translation_value: 'מציג',
    category: 'emails',
    context: 'admin'
  });

  if (heError && !heError.message.includes('duplicate')) {
    console.error('❌ Error adding HE:', heError.message);
  } else {
    console.log('✅ Added HE: "מציג"');
  }

  console.log('\n✅ Done!');
}

addTranslation().catch(console.error);
