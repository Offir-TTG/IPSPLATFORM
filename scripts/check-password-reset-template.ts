/**
 * Check Password Reset Template
 * Verifies if the password reset template exists in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTemplate() {
  console.log('🔍 Checking password reset template...\n');

  // Get all tenants
  const { data: tenants } = await supabase.from('tenants').select('id, name');

  if (!tenants || tenants.length === 0) {
    console.log('⚠️  No tenants found');
    return;
  }

  for (const tenant of tenants) {
    console.log(`\n📧 Tenant: ${tenant.name}`);
    console.log('='.repeat(60));

    // Check for password reset template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('template_key', 'system.password_reset')
      .single();

    if (error) {
      console.log('❌ Template NOT found');
      console.log('Error:', error.message);
      continue;
    }

    if (template) {
      console.log('✅ Template found:');
      console.log('   ID:', template.id);
      console.log('   Key:', template.template_key);
      console.log('   Name:', template.template_name);
      console.log('   Category:', template.template_category);
      console.log('   Active:', template.is_active);
      console.log('   System:', template.is_system);

      // Check versions
      const { data: versions } = await supabase
        .from('email_template_versions')
        .select('language_code, subject, is_current')
        .eq('template_id', template.id);

      console.log('\n   Versions:');
      if (versions && versions.length > 0) {
        versions.forEach(v => {
          console.log(`   - ${v.language_code.toUpperCase()}: "${v.subject}" (current: ${v.is_current})`);
        });
      } else {
        console.log('   ⚠️  No versions found!');
      }
    } else {
      console.log('❌ Template NOT found');
    }

    // Check all templates for this tenant
    const { data: allTemplates } = await supabase
      .from('email_templates')
      .select('template_key, template_name, template_category')
      .eq('tenant_id', tenant.id)
      .order('template_category');

    console.log('\n   All templates in database:');
    if (allTemplates && allTemplates.length > 0) {
      allTemplates.forEach(t => {
        console.log(`   - [${t.template_category}] ${t.template_key}: ${t.template_name}`);
      });
    } else {
      console.log('   ⚠️  No templates found!');
    }
  }
}

checkTemplate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
