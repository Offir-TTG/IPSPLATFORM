/**
 * Add "users" resource type translation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslation() {
  console.log('Adding "users" resource translation...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  if (!tenantId) {
    console.error('No tenant found');
    process.exit(1);
  }

  // Hebrew
  await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'he',
    translation_key: 'audit.resource.users',
    translation_value: 'משתמשים',
    category: 'audit',
    context: 'admin',
  });

  console.log('✓ audit.resource.users (he): משתמשים');

  // English
  await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'en',
    translation_key: 'audit.resource.users',
    translation_value: 'Users',
    category: 'audit',
    context: 'admin',
  });

  console.log('✓ audit.resource.users (en): Users');

  // Also add singular forms just in case
  await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'he',
    translation_key: 'audit.resource.profile',
    translation_value: 'פרופיל',
    category: 'audit',
    context: 'admin',
  });

  console.log('✓ audit.resource.profile (he): פרופיל');

  await supabase.from('translations').insert({
    tenant_id: tenantId,
    language_code: 'en',
    translation_key: 'audit.resource.profile',
    translation_value: 'Profile',
    category: 'audit',
    context: 'admin',
  });

  console.log('✓ audit.resource.profile (en): Profile');

  console.log('\n✅ Done!');
}

addTranslation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
