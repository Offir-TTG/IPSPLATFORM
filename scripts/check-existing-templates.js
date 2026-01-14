// Quick script to check what email templates exist in database
// Run with: node scripts/check-existing-templates.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTemplates() {
  console.log('Checking existing email templates...\n');

  // Get all templates
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('template_key, template_name, template_category, is_active, tenant_id')
    .order('template_category')
    .order('template_key');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${templates?.length || 0} templates:\n`);

  if (templates && templates.length > 0) {
    console.log('╔════════════════════════════╤══════════════════════════╤════════════╤════════════════════════════════════╗');
    console.log('║ Template Key               │ Template Name            │ Category   │ Tenant ID                          ║');
    console.log('╠════════════════════════════╪══════════════════════════╪════════════╪════════════════════════════════════╣');

    templates.forEach(t => {
      const key = t.template_key.padEnd(26);
      const name = (t.template_name || '').padEnd(24);
      const category = (t.template_category || '').padEnd(10);
      const tenantId = (t.tenant_id || 'NULL').substring(0, 36);
      console.log(`║ ${key} │ ${name} │ ${category} │ ${tenantId} ║`);
    });

    console.log('╚════════════════════════════╧══════════════════════════╧════════════╧════════════════════════════════════╝');
  } else {
    console.log('❌ No templates found in database!');
  }

  // Check what we need for triggers
  console.log('\n\n📋 Templates needed for trigger system:');
  console.log('   ✓ = exists, ✗ = missing\n');

  const needed = [
    { key: 'enrollment_invitation', event: 'enrollment.created' },
    { key: 'enrollment_confirmation', event: 'enrollment.completed' },
    { key: 'payment_receipt', event: 'payment.completed' },
    { key: 'payment_failed', event: 'payment.failed' },
    { key: 'recording_available', event: 'recording.ready' },
    { key: 'lesson_reminder', event: 'lesson.reminder' },
  ];

  needed.forEach(n => {
    const exists = templates?.some(t => t.template_key === n.key);
    const status = exists ? '✓' : '✗';
    console.log(`   [${status}] ${n.key.padEnd(30)} → ${n.event}`);
  });
}

checkTemplates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
