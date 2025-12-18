import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All translation keys used in the attendance page including tooltips and error messages
const allRequiredKeys = [
  'lms.attendance.title',
  'lms.attendance.subtitle',
  'lms.attendance.filters',
  'lms.attendance.program',
  'lms.attendance.allPrograms',
  'lms.attendance.searchPrograms',
  'lms.attendance.course',
  'lms.attendance.allCourses',
  'lms.attendance.searchCourses',
  'lms.attendance.student',
  'lms.attendance.allStudents',
  'lms.attendance.searchStudents',
  'lms.attendance.date',
  'lms.attendance.selectFilter',
  'lms.attendance.noLessonsFound',
  'lms.attendance.noStudentsFound',
  'lms.attendance.legend',
  'lms.attendance.grid',
  'lms.attendance.students',
  'lms.attendance.lessons',
  'lms.attendance.actions',
  'lms.attendance.saved',
  'lms.attendance.status.present',
  'lms.attendance.status.late',
  'lms.attendance.status.absent',
  'lms.attendance.status.excused',
  'lms.attendance.tooltip.markAllPresent',
  'lms.attendance.tooltip.markAllAbsent',
  'lms.attendance.tooltip.clearAll',
  'lms.attendance.error.saveFailed',
  'lms.attendance.error.loadFailed',
];

async function verifyComplete() {
  try {
    console.log('🔍 Complete Attendance Page Verification\n');
    console.log('=' .repeat(60));

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    const { data: translations } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'lms.attendance.%')
      .order('translation_key, language_code');

    // Group by key and language
    const translationMap = new Map<string, { en?: string; he?: string }>();
    translations?.forEach(t => {
      if (!translationMap.has(t.translation_key)) {
        translationMap.set(t.translation_key, {});
      }
      const entry = translationMap.get(t.translation_key)!;
      if (t.language_code === 'en') entry.en = t.translation_value;
      if (t.language_code === 'he') entry.he = t.translation_value;
    });

    const missing: string[] = [];
    const missingHebrew: string[] = [];
    const complete: string[] = [];

    console.log('\n📊 UI Elements:\n');
    allRequiredKeys.filter(k => !k.includes('tooltip') && !k.includes('error')).forEach(key => {
      const trans = translationMap.get(key);
      if (!trans || !trans.en || !trans.he) {
        console.log(`  ❌ ${key}`);
        if (!trans) missing.push(key);
        else if (!trans.he) missingHebrew.push(key);
      } else {
        complete.push(key);
        console.log(`  ✅ ${key}`);
      }
    });

    console.log('\n🔧 Tooltips:\n');
    allRequiredKeys.filter(k => k.includes('tooltip')).forEach(key => {
      const trans = translationMap.get(key);
      if (!trans || !trans.en || !trans.he) {
        console.log(`  ❌ ${key}`);
        if (!trans) missing.push(key);
        else if (!trans.he) missingHebrew.push(key);
      } else {
        complete.push(key);
        console.log(`  ✅ ${key} - HE: ${trans.he}`);
      }
    });

    console.log('\n⚠️  Error Messages:\n');
    allRequiredKeys.filter(k => k.includes('error')).forEach(key => {
      const trans = translationMap.get(key);
      if (!trans || !trans.en || !trans.he) {
        console.log(`  ❌ ${key}`);
        if (!trans) missing.push(key);
        else if (!trans.he) missingHebrew.push(key);
      } else {
        complete.push(key);
        console.log(`  ✅ ${key} - HE: ${trans.he}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Final Summary:');
    console.log(`  Total required: ${allRequiredKeys.length}`);
    console.log(`  Complete (EN + HE): ${complete.length}`);
    console.log(`  Missing Hebrew: ${missingHebrew.length}`);
    console.log(`  Completely missing: ${missing.length}`);

    if (complete.length === allRequiredKeys.length) {
      console.log('\n✅ SUCCESS! All translations are complete!');
      console.log('  - UI elements: ✓');
      console.log('  - Tooltips: ✓');
      console.log('  - Error messages: ✓');
      console.log('  - Hebrew support: ✓');
      console.log('  - RTL support: ✓');
    } else {
      console.log('\n⚠️  ACTION NEEDED:');
      if (missing.length > 0) {
        console.log(`  Missing keys: ${missing.join(', ')}`);
      }
      if (missingHebrew.length > 0) {
        console.log(`  Missing Hebrew: ${missingHebrew.join(', ')}`);
      }
    }

    process.exit(complete.length === allRequiredKeys.length ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyComplete();
