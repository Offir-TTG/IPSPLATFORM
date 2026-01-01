import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExistingEnrollments() {
  try {
    console.log('\n=== Fixing Existing Enrollments with user_id but no wizard_profile_data ===\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    // Find all enrollments that have user_id but incomplete wizard_profile_data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, user_id, wizard_profile_data')
      .eq('tenant_id', tenantId)
      .not('user_id', 'is', null);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return;
    }

    console.log(`Found ${enrollments?.length || 0} enrollments with user_id\n`);

    let updatedCount = 0;

    for (const enrollment of enrollments || []) {
      // Check if wizard_profile_data is missing or incomplete
      const profileData = enrollment.wizard_profile_data || {};
      const hasCompleteProfile =
        profileData.email &&
        profileData.first_name &&
        profileData.last_name &&
        profileData.phone &&
        profileData.address;

      if (hasCompleteProfile) {
        console.log(`✓ Enrollment ${enrollment.id} already has complete wizard_profile_data`);
        continue;
      }

      console.log(`→ Enrollment ${enrollment.id} needs profile data update`);

      // Fetch user's complete profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, first_name, last_name, phone, location')
        .eq('id', enrollment.user_id)
        .single();

      if (userError || !user) {
        console.error(`  ✗ Error fetching user ${enrollment.user_id}:`, userError);
        continue;
      }

      // Update enrollment with complete profile data
      const completeProfileData = {
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.location || '', // Using location field from users table
      };

      console.log(`  → Updating with data:`, completeProfileData);

      const { data: updateResult, error: updateError } = await supabase
        .from('enrollments')
        .update({ wizard_profile_data: completeProfileData })
        .eq('id', enrollment.id)
        .select();

      if (updateError) {
        console.error(`  ✗ Error updating enrollment ${enrollment.id}:`, updateError);
        continue;
      }

      console.log(`  → Update result:`, updateResult);

      updatedCount++;
      console.log(`  ✓ Updated enrollment ${enrollment.id} with complete profile:`);
      console.log(`    - Email: ${user.email}`);
      console.log(`    - Name: ${user.first_name} ${user.last_name}`);
      console.log(`    - Has phone: ${!!user.phone}`);
      console.log(`    - Has location: ${!!user.location}`);
    }

    console.log(`\n✅ Fixed ${updatedCount} enrollments`);

  } catch (error) {
    console.error('Error:', error);
  }
}

fixExistingEnrollments();
