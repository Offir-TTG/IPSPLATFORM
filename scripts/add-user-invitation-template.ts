/**
 * Add User Invitation Email Template
 * Adds the system.user_invitation template to existing tenants
 *
 * Usage: npx tsx scripts/add-user-invitation-template.ts
 */

import { createClient } from '@supabase/supabase-js';
import { SYSTEM_TEMPLATES } from '../src/lib/email/systemTemplates.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTemplate() {
  console.log('📧 Adding user invitation email template...\n');

  // Get the user_invitation template
  const template = SYSTEM_TEMPLATES.find(t => t.key === 'system.user_invitation');

  if (!template) {
    console.error('❌ Template not found in systemTemplates.ts');
    process.exit(1);
  }

  // Get all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name');

  if (tenantsError) {
    console.error('❌ Error fetching tenants:', tenantsError);
    process.exit(1);
  }

  console.log(`Found ${tenants?.length || 0} tenant(s)\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (const tenant of tenants || []) {
    console.log(`\n📧 Processing tenant: ${tenant.name} (${tenant.id})`);

    // Check if template already exists
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('template_key', template.key)
      .single();

    if (existing) {
      console.log(`  ⏭️  Template already exists`);
      skippedCount++;
      continue;
    }

    // Insert template
    const { data: newTemplate, error: templateError } = await supabase
      .from('email_templates')
      .insert({
        tenant_id: tenant.id,
        template_key: template.key,
        template_name: template.name,
        template_category: template.category,
        description: template.description,
        is_system: true,
        is_active: true,
        allow_customization: true,
        variables: template.variables,
      })
      .select('id')
      .single();

    if (templateError || !newTemplate) {
      console.error(`  ❌ Error creating template:`, templateError);
      continue;
    }

    // Insert English version
    const { error: enVersionError } = await supabase
      .from('email_template_versions')
      .insert({
        template_id: newTemplate.id,
        language_code: 'en',
        subject: template.versions.en.subject,
        body_html: template.versions.en.bodyHtml,
        body_text: template.versions.en.bodyText,
        is_current: true,
        version: 1,
      });

    if (enVersionError) {
      console.error(`  ❌ Error creating English version:`, enVersionError);
      continue;
    }

    // Insert Hebrew version
    const { error: heVersionError } = await supabase
      .from('email_template_versions')
      .insert({
        template_id: newTemplate.id,
        language_code: 'he',
        subject: template.versions.he.subject,
        body_html: template.versions.he.bodyHtml,
        body_text: template.versions.he.bodyText,
        is_current: true,
        version: 1,
      });

    if (heVersionError) {
      console.error(`  ❌ Error creating Hebrew version:`, heVersionError);
      continue;
    }

    console.log(`  ✅ Template created successfully`);
    successCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📊 Total tenants: ${tenants?.length || 0}`);
  console.log('');
}

addTemplate()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
