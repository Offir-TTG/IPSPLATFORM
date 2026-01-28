import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Debug script to check user profile completeness
 *
 * Usage: npx tsx scripts/debug-user-profile.ts <email>
 */

async function debugUserProfile() {
  const email = process.argv[2];

  if (!email) {
    console.log('❌ Please provide user email');
    console.log('Usage: npx tsx scripts/debug-user-profile.ts <email>');
    process.exit(1);
  }

  console.log('🔍 Debugging User Profile\n');
  console.log('=' .repeat(60));
  console.log(`Email: ${email}\n`);

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone, location, role')
    .eq('email', email)
    .single();

  if (userError || !user) {
    console.log('❌ User not found:', userError?.message);
    process.exit(1);
  }

  console.log('✅ User found:\n');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`\n📋 Profile Fields:\n`);

  const requiredFields = [
    { name: 'first_name', value: user.first_name },
    { name: 'last_name', value: user.last_name },
    { name: 'email', value: user.email },
    { name: 'phone', value: user.phone },
    { name: 'location', value: user.location }
  ];

  let missingCount = 0;

  requiredFields.forEach(field => {
    const isEmpty = !field.value || field.value === '' || field.value === null;
    const status = isEmpty ? '❌ MISSING' : '✅ Present';
    console.log(`   ${field.name.padEnd(15)} ${status}  ${isEmpty ? '' : `"${field.value}"`}`);
    if (isEmpty) missingCount++;
  });

  console.log('\n' + '='.repeat(60));

  const isComplete = missingCount === 0;

  if (isComplete) {
    console.log('✅ Profile is COMPLETE - All required fields present');
  } else {
    console.log(`❌ Profile is INCOMPLETE - Missing ${missingCount} field(s)`);
    console.log('\n💡 The user will be asked to fill out the profile in the enrollment wizard.');
    console.log('   To fix: Update the missing fields in the users table or user profile page.');
  }

  // Check enrollments for this user
  console.log('\n' + '='.repeat(60));
  console.log('📝 Recent Enrollments:\n');

  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      enrollment_token,
      wizard_profile_data,
      products (title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (enrollError || !enrollments || enrollments.length === 0) {
    console.log('   No enrollments found');
  } else {
    enrollments.forEach((enrollment, index) => {
      const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;
      console.log(`\n   ${index + 1}. ${product?.title || 'Unknown Product'}`);
      console.log(`      ID: ${enrollment.id}`);
      console.log(`      Status: ${enrollment.status}`);
      console.log(`      Token: ${enrollment.enrollment_token ? 'Present' : 'None'}`);

      const hasWizardData = enrollment.wizard_profile_data &&
                            Object.keys(enrollment.wizard_profile_data).length > 0;
      console.log(`      Wizard Data: ${hasWizardData ? 'Present' : 'Empty'}`);

      if (hasWizardData) {
        console.log(`      Wizard Data Fields:`, Object.keys(enrollment.wizard_profile_data));
      }
    });
  }

  console.log('\n' + '='.repeat(60));
}

debugUserProfile().then(() => process.exit(0));
