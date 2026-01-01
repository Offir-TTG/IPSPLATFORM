import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsersAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Users Report API...\n');

    // Get all enrollments with user and payment data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, user_id')
      .eq('tenant_id', tenantId);

    console.log(`Found ${enrollments?.length || 0} enrollments\n`);

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found.');
      return;
    }

    // Get user IDs
    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    console.log(`Found ${userIds.length} unique users\n`);

    // Get all users with their roles
    const { data: users } = await supabase
      .from('users')
      .select('id, role')
      .in('id', userIds);

    console.log(`User roles:`);
    users?.forEach(u => {
      console.log(`  - ${u.role}`);
    });

    // Get enrollment IDs
    const enrollmentIds = enrollments.map(e => e.id);

    // Get all payment schedules for these enrollments
    const { data: paymentSchedules } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, amount, status, scheduled_date')
      .in('enrollment_id', enrollmentIds);

    console.log(`\nFound ${paymentSchedules?.length || 0} payment schedules\n`);

    // Create user role map
    const userRoleMap = new Map(users?.map(u => [u.id, u.role]) || []);

    // Create schedules by enrollment map
    const schedulesByEnrollment = new Map<string, any[]>();
    paymentSchedules?.forEach(schedule => {
      if (!schedulesByEnrollment.has(schedule.enrollment_id)) {
        schedulesByEnrollment.set(schedule.enrollment_id, []);
      }
      schedulesByEnrollment.get(schedule.enrollment_id)!.push(schedule);
    });

    // Group by user role/segment
    const segmentStats = new Map<string, { users: Set<string>; revenue: number }>();

    enrollments.forEach((enrollment: any) => {
      const userId = enrollment.user_id;
      const userRole = userRoleMap.get(userId) || 'student';

      // Map role to segment
      const segment = userRole === 'instructor' ? 'instructors' :
                      userRole === 'admin' ? 'staff' : 'students';

      if (!segmentStats.has(segment)) {
        segmentStats.set(segment, { users: new Set(), revenue: 0 });
      }

      const stats = segmentStats.get(segment)!;
      stats.users.add(userId);

      // Calculate revenue from payment schedules
      const schedules = schedulesByEnrollment.get(enrollment.id) || [];
      schedules.forEach((schedule: any) => {
        if (schedule.status === 'paid') {
          stats.revenue += parseFloat(schedule.amount?.toString() || '0');
        }
      });
    });

    // Convert to array format
    const userSegments = Array.from(segmentStats.entries()).map(([segment, stats]) => ({
      segment,
      users: stats.users.size,
      revenue: Math.round(stats.revenue * 100) / 100,
      avg: stats.users.size > 0 ? Math.round((stats.revenue / stats.users.size) * 100) / 100 : 0
    }));

    console.log('=== User Segments ===\n');
    userSegments.forEach(seg => {
      console.log(`${seg.segment}:`);
      console.log(`  Users: ${seg.users}`);
      console.log(`  Revenue: $${seg.revenue.toLocaleString()}`);
      console.log(`  Average: $${seg.avg.toLocaleString()}`);
      console.log('');
    });

    console.log('✅ Users Report data is ready!');

  } catch (error) {
    console.error('Error:', error);
  }
}

testUsersAPI();
