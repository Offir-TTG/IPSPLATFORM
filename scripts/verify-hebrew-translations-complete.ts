/**
 * Complete verification of Hebrew refund translations
 * Run: npx ts-node scripts/verify-hebrew-translations-complete.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyComplete() {
  try {
    console.log('🔍 COMPLETE HEBREW TRANSLATION VERIFICATION\n');
    console.log('='.repeat(70));

    const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

    // ========================================================================
    // 1. Check User Language Preferences
    // ========================================================================
    console.log('\n1️⃣  USER LANGUAGE PREFERENCES (users table)');
    console.log('-'.repeat(70));

    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, preferred_language')
      .eq('tenant_id', tenantId);

    if (users && users.length > 0) {
      users.forEach(user => {
        const langStatus = user.preferred_language === 'he' ? '✅' : '❌';
        console.log(`${langStatus} ${user.email}: ${user.preferred_language || 'NULL'}`);
      });
    }

    // ========================================================================
    // 2. Check All Refund Translation Keys
    // ========================================================================
    console.log('\n2️⃣  REFUND TRANSLATIONS IN DATABASE');
    console.log('-'.repeat(70));

    const refundKeys = [
      'user.payments.statusRefunded',
      'user.payments.statusPartiallyRefunded',
      'user.payments.status.refunded',
      'user.payments.status.partially_refunded',
      'admin.payments.transactions.status.refunded',
      'invoices.status.refunded',
      'invoices.status.partially_refunded',
      'invoices.refunded_amount',
    ];

    let allKeysExist = true;

    for (const key of refundKeys) {
      const { data: translations } = await supabase
        .from('translations')
        .select('language_code, translation_value, context, updated_at')
        .eq('translation_key', key)
        .eq('tenant_id', tenantId)
        .order('language_code');

      if (translations && translations.length >= 2) {
        const enTrans = translations.find(t => t.language_code === 'en');
        const heTrans = translations.find(t => t.language_code === 'he');

        if (enTrans && heTrans) {
          console.log(`✅ ${key}`);
          console.log(`   en: "${enTrans.translation_value}"`);
          console.log(`   he: "${heTrans.translation_value}"`);
        } else {
          console.log(`⚠️  ${key} - Missing language`);
          allKeysExist = false;
        }
      } else {
        console.log(`❌ ${key} - NOT FOUND or incomplete`);
        allKeysExist = false;
      }
    }

    // ========================================================================
    // 3. Check Payment Schedule Status
    // ========================================================================
    console.log('\n3️⃣  PAYMENT SCHEDULE WITH REFUNDED STATUS');
    console.log('-'.repeat(70));

    const { data: refundedSchedules } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, payment_number, enrollment_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'refunded')
      .limit(5);

    if (refundedSchedules && refundedSchedules.length > 0) {
      refundedSchedules.forEach(schedule => {
        console.log(`✅ Schedule ${schedule.id.substring(0, 8)}...`);
        console.log(`   Status: ${schedule.status}`);
        console.log(`   Amount: ${schedule.amount}`);
        console.log(`   Payment #: ${schedule.payment_number}`);
      });
    } else {
      console.log('⚠️  No refunded schedules found (this is OK if no refunds exist yet)');
    }

    // ========================================================================
    // 4. Check Payment Records with Refund Data
    // ========================================================================
    console.log('\n4️⃣  PAYMENT RECORDS WITH REFUND DATA');
    console.log('-'.repeat(70));

    const { data: refundedPayments } = await supabase
      .from('payments')
      .select('id, status, refunded_amount, refunded_at, payment_schedule_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'refunded')
      .limit(5);

    if (refundedPayments && refundedPayments.length > 0) {
      refundedPayments.forEach(payment => {
        console.log(`✅ Payment ${payment.id.substring(0, 8)}...`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Refunded Amount: ${payment.refunded_amount || 'NULL'}`);
        console.log(`   Refunded At: ${payment.refunded_at || 'NULL'}`);
      });
    } else {
      console.log('⚠️  No refunded payment records found');
    }

    // ========================================================================
    // 5. Check Cache Version in Code
    // ========================================================================
    console.log('\n5️⃣  TRANSLATION CACHE VERSION');
    console.log('-'.repeat(70));

    const fs = await import('fs');
    const appContextPath = 'src/context/AppContext.tsx';
    const appContextContent = fs.readFileSync(appContextPath, 'utf8');
    const cacheVersionMatch = appContextContent.match(/TRANSLATION_CACHE_VERSION\s*=\s*(\d+)/);

    if (cacheVersionMatch) {
      const version = parseInt(cacheVersionMatch[1]);
      console.log(`✅ Cache version: ${version}`);
      if (version >= 13) {
        console.log('   Cache version is up to date (≥13)');
      } else {
        console.log('   ⚠️  Cache version should be 13 or higher');
      }
    } else {
      console.log('❌ Could not find TRANSLATION_CACHE_VERSION in AppContext.tsx');
    }

    // ========================================================================
    // FINAL CHECKLIST
    // ========================================================================
    console.log('\n6️⃣  FINAL CHECKLIST');
    console.log('-'.repeat(70));

    const checks = [
      { name: 'Users have preferred_language = "he"', pass: users?.every(u => u.preferred_language === 'he') || false },
      { name: 'All refund translation keys exist', pass: allKeysExist },
      { name: 'Hebrew translations have correct values', pass: allKeysExist },
      { name: 'Cache version bumped to 13+', pass: cacheVersionMatch && parseInt(cacheVersionMatch[1]) >= 13 },
      { name: 'Refunded schedules exist in DB', pass: (refundedSchedules?.length || 0) > 0 },
      { name: 'Refunded payments exist in DB', pass: (refundedPayments?.length || 0) > 0 },
    ];

    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '⚠️ '} ${check.name}`);
    });

    const allPassed = checks.filter(c => c.pass).length;
    const total = checks.length;

    console.log('\n' + '='.repeat(70));
    console.log(`SCORE: ${allPassed}/${total} checks passed`);
    console.log('='.repeat(70));

    // ========================================================================
    // USER INSTRUCTIONS
    // ========================================================================
    console.log('\n📌 WHAT TO DO NEXT:\n');

    if (allPassed >= 4) {
      console.log('✅ Backend is configured correctly!');
      console.log('');
      console.log('🔄 TO SEE HEBREW TRANSLATIONS, DO ONE OF THE FOLLOWING:');
      console.log('');
      console.log('   OPTION 1 - Hard Refresh (Recommended):');
      console.log('   • Windows/Linux: Ctrl + Shift + R');
      console.log('   • Mac: Cmd + Shift + R');
      console.log('   • This will clear the browser cache and load fresh translations');
      console.log('');
      console.log('   OPTION 2 - Clear localStorage:');
      console.log('   • Open browser DevTools (F12)');
      console.log('   • Go to Console tab');
      console.log('   • Type: localStorage.clear()');
      console.log('   • Press Enter');
      console.log('   • Refresh the page (F5)');
      console.log('');
      console.log('   OPTION 3 - Clear all cache:');
      console.log('   • Open browser DevTools (F12)');
      console.log('   • Go to Application tab (Chrome) or Storage tab (Firefox)');
      console.log('   • Click "Clear storage" or "Clear site data"');
      console.log('   • Refresh the page');
      console.log('');
      console.log('After doing any of the above, you should see:');
      console.log('   • "הוחזר" instead of "refunded"');
      console.log('   • "הוחזר חלקית" instead of "partially refunded"');
      console.log('');
    } else {
      console.log('⚠️  Some backend issues need to be fixed first.');
      console.log('   Review the checklist above and fix any failing checks.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyComplete();
