/**
 * Seed Email Templates Script
 * Seeds the database with system email templates
 *
 * Usage: npx ts-node scripts/seed-email-templates.ts [tenant-id]
 */

import { createClient } from '@supabase/supabase-js';
import { SYSTEM_TEMPLATES } from '../src/lib/email/systemTemplates.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTemplates(tenantId?: string) {
  console.log('🌱 Seeding email templates...\n');

  // If no tenant ID provided, get all tenants
  let tenantIds: string[] = [];

  if (tenantId) {
    tenantIds = [tenantId];
  } else {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id');

    if (error) {
      console.error('Error fetching tenants:', error);
      process.exit(1);
    }

    tenantIds = tenants?.map(t => t.id) || [];
  }

  console.log(`Found ${tenantIds.length} tenant(s) to seed\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const tid of tenantIds) {
    console.log(`\n📧 Seeding templates for tenant: ${tid}`);
    console.log('='.repeat(60));

    for (const template of SYSTEM_TEMPLATES) {
      try {
        // Check if template already exists
        const { data: existing } = await supabase
          .from('email_templates')
          .select('id')
          .eq('tenant_id', tid)
          .eq('template_key', template.key)
          .single();

        if (existing) {
          console.log(`⏭️  Skipping ${template.key} (already exists)`);
          continue;
        }

        // Insert template
        const { data: newTemplate, error: templateError } = await supabase
          .from('email_templates')
          .insert({
            tenant_id: tid,
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
          console.error(`❌ Error creating template ${template.key}:`, templateError);
          errorCount++;
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
            version: 1,
            is_current: true,
          });

        if (enVersionError) {
          console.error(`❌ Error creating EN version for ${template.key}:`, enVersionError);
          errorCount++;
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
            version: 1,
            is_current: true,
          });

        if (heVersionError) {
          console.error(`❌ Error creating HE version for ${template.key}:`, heVersionError);
          errorCount++;
          continue;
        }

        console.log(`✅ Created ${template.key}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing ${template.key}:`, error);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Seeding complete!`);
  console.log(`   ✅ Success: ${successCount} templates`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');
}

// Run the script
const tenantId = process.argv[2];
seedTemplates(tenantId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
