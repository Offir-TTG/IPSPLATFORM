/**
 * Debug Template Display
 * Checks why password reset template might not be showing in UI
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTemplate() {
  console.log('🔍 Debugging password reset template display...\n');

  const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1).single();

  if (!tenants) {
    console.log('No tenant found');
    return;
  }

  console.log(`Tenant: ${tenants.name}\n`);

  // Get the password reset template with full details
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenants.id)
    .eq('template_key', 'system.password_reset')
    .single();

  if (error || !template) {
    console.log('❌ Template not found!');
    console.log('Error:', error);
    return;
  }

  console.log('✅ Template found in database:\n');
  console.log('Full template data:');
  console.log(JSON.stringify(template, null, 2));

  // Check what the UI query returns
  console.log('\n\n🔍 Testing UI query (what the page actually loads):\n');

  const { data: allTemplates, error: allError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tenant_id', tenants.id)
    .order('template_category', { ascending: true })
    .order('template_name', { ascending: true });

  if (allError) {
    console.log('❌ Error loading templates:', allError);
    return;
  }

  console.log(`Found ${allTemplates?.length || 0} templates:\n`);

  allTemplates?.forEach((t, index) => {
    console.log(`${index + 1}. [${t.template_category}] ${t.template_key}`);
    console.log(`   Name: ${t.template_name}`);
    console.log(`   Active: ${t.is_active}`);
    console.log(`   ID: ${t.id}`);
    if (t.template_key === 'system.password_reset') {
      console.log('   ⭐ THIS IS THE PASSWORD RESET TEMPLATE');
    }
    console.log('');
  });

  // Check if there's a duplicate or conflict
  const { data: duplicates } = await supabase
    .from('email_templates')
    .select('id, template_key, template_name, is_active')
    .eq('tenant_id', tenants.id)
    .eq('template_key', 'system.password_reset');

  if (duplicates && duplicates.length > 1) {
    console.log('\n⚠️  WARNING: Multiple templates found with same key!');
    duplicates.forEach(d => {
      console.log(`   - ID: ${d.id}, Active: ${d.is_active}`);
    });
  }
}

debugTemplate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
