import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Checking for duplicate payment schedules...\n');

  // Get all schedules for the tenant
  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select('id, enrollment_id, payment_number, amount, scheduled_date, status')
    .eq('tenant_id', tenantId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    return;
  }

  console.log(`Total schedules found: ${schedules?.length || 0}\n`);

  if (schedules && schedules.length > 0) {
    // Group by enrollment_id and payment_number to find duplicates
    const grouped = schedules.reduce((acc: any, schedule) => {
      const key = `${schedule.enrollment_id}-${schedule.payment_number}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(schedule);
      return acc;
    }, {});

    // Find duplicates
    const duplicates = Object.entries(grouped).filter(([_, items]: [string, any]) => items.length > 1);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate schedule groups:\n`);
      duplicates.forEach(([key, items]: [string, any]) => {
        console.log(`Enrollment ${key.split('-')[0]}, Payment #${key.split('-')[1]}:`);
        items.forEach((item: any) => {
          console.log(`  - ID: ${item.id}, Date: ${item.scheduled_date}, Amount: ${item.amount}, Status: ${item.status}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ No duplicates found based on enrollment_id + payment_number');
    }

    // Check for exact duplicates (same ID appearing multiple times)
    const ids = schedules.map(s => s.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.log(`⚠️  Found ${ids.length - uniqueIds.size} duplicate IDs in the result!`);
    }

    // Show first 10 schedules
    console.log('\nFirst 10 schedules:');
    schedules.slice(0, 10).forEach((s, i) => {
      console.log(`${i + 1}. ID: ${s.id.substring(0, 8)}..., Enrollment: ${s.enrollment_id.substring(0, 8)}..., Payment #${s.payment_number}, Date: ${s.scheduled_date}, Amount: ${s.amount}`);
    });
  }
}

checkDuplicates().catch(console.error);
