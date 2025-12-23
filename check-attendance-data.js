const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAttendance() {
  // Get student
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'offir.omer@gmail.com')
    .single();

  console.log('Student:', user.email);

  // Get all attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', user.id);

  console.log('\nTotal attendance records:', attendance.length);
  
  const statuses = attendance.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Status breakdown:', statuses);
  
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const rate = attendance.length > 0 ? (presentCount / attendance.length * 100).toFixed(1) : 0;
  
  console.log('\nPresent count:', presentCount);
  console.log('Calculated attendance rate:', rate + '%');
  console.log('\nExpected: Only "present" counts as attended');
  console.log('Should we count "late" and "excused" as attended too?');
}

checkAttendance();
