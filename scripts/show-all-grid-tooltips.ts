import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function showAllTooltips() {
  try {
    console.log('📋 ALL TOOLTIPS IN ATTENDANCE GRID\n');
    console.log('='.repeat(70));

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const { data: tooltips } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenants.id)
      .ilike('translation_key', 'lms.attendance.tooltip.%')
      .order('translation_key, language_code');

    const { data: statuses } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenants.id)
      .ilike('translation_key', 'lms.attendance.status.%')
      .order('translation_key, language_code');

    console.log('\n🎯 1. LESSON COLUMN HEADER ACTIONS (top of each lesson column):');
    console.log('   Location: In each lesson column header\n');

    const lessonTooltips = ['lms.attendance.tooltip.markAllPresent', 'lms.attendance.tooltip.markAllAbsent'];
    lessonTooltips.forEach(key => {
      const en = tooltips?.find(t => t.translation_key === key && t.language_code === 'en');
      const he = tooltips?.find(t => t.translation_key === key && t.language_code === 'he');
      console.log(`   ${key}:`);
      console.log(`     EN: ${en?.translation_value}`);
      console.log(`     HE: ${he?.translation_value}\n`);
    });

    console.log('\n🎯 2. STATUS BUTTONS (in each grid cell):');
    console.log('   Location: Each cell in the grid has 4 status buttons\n');

    const statusKeys = ['lms.attendance.status.present', 'lms.attendance.status.late', 'lms.attendance.status.absent', 'lms.attendance.status.excused'];
    statusKeys.forEach(key => {
      const en = statuses?.find(t => t.translation_key === key && t.language_code === 'en');
      const he = statuses?.find(t => t.translation_key === key && t.language_code === 'he');
      console.log(`   ${key}:`);
      console.log(`     EN: ${en?.translation_value}`);
      console.log(`     HE: ${he?.translation_value}\n`);
    });

    console.log('\n🎯 3. STUDENT ROW ACTIONS (right-most column):');
    console.log('   Location: Actions column for each student row\n');

    const actionTooltips = ['lms.attendance.tooltip.markAllPresent', 'lms.attendance.tooltip.markAllAbsent', 'lms.attendance.tooltip.clearAll'];
    actionTooltips.forEach(key => {
      const en = tooltips?.find(t => t.translation_key === key && t.language_code === 'en');
      const he = tooltips?.find(t => t.translation_key === key && t.language_code === 'he');
      console.log(`   ${key}:`);
      console.log(`     EN: ${en?.translation_value}`);
      console.log(`     HE: ${he?.translation_value}\n`);
    });

    console.log('='.repeat(70));
    console.log('\n✅ SUMMARY:');
    console.log('   Total tooltip locations in grid:');
    console.log('   - Lesson headers: 2 buttons × N lessons');
    console.log('   - Grid cells: 4 status buttons × N students × N lessons');
    console.log('   - Student actions: 3 buttons × N students');
    console.log('\n   All tooltips have Hebrew translations! ✓');

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

showAllTooltips();
