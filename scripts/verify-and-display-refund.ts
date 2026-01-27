/**
 * Verify refund data is ready to display and show what user will see
 * Run: npx ts-node scripts/verify-and-display-refund.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyRefundDisplay() {
  try {
    console.log('🔍 Verifying refund data for display...\n');
    console.log('='.repeat(70));

    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';
    const paymentId = '2f4e2318-0de5-44cd-ada0-6a1d53501bbd';

    // Check schedule status
    console.log('\n1️⃣  SCHEDULE STATUS');
    console.log('-'.repeat(70));

    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, currency, payment_number, payment_type, scheduled_date, paid_date')
      .eq('id', scheduleId)
      .single();

    if (schedule) {
      console.log(`Schedule ID: ${schedule.id.substring(0, 8)}...`);
      console.log(`  Status: ${schedule.status}`);
      console.log(`  Amount: ${schedule.amount} ${schedule.currency}`);
      console.log(`  Payment Number: ${schedule.payment_number}`);
      console.log(`  Payment Type: ${schedule.payment_type}`);

      const correctStatus = schedule.status === 'paid' ? '✅' : '❌';
      console.log(`\n  ${correctStatus} Schedule status should be 'paid' for partial refund (currently: '${schedule.status}')`);

      if (schedule.status !== 'paid') {
        console.log(`\n  ⚠️  Need to fix! Run: npx ts-node scripts/fix-partial-refund-schedule-status.ts`);
      }
    }

    // Check payment record
    console.log('\n2️⃣  PAYMENT RECORD');
    console.log('-'.repeat(70));

    const { data: payment } = await supabase
      .from('payments')
      .select('id, status, amount, currency, refunded_amount, refunded_at, refund_reason')
      .eq('id', paymentId)
      .single();

    if (payment) {
      console.log(`Payment ID: ${payment.id.substring(0, 8)}...`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: ${payment.amount} ${payment.currency}`);
      console.log(`  Refunded Amount: ${payment.refunded_amount || '0'}`);
      console.log(`  Refunded At: ${payment.refunded_at || 'NULL'}`);

      const correctPaymentStatus = payment.status === 'partially_refunded' ? '✅' : '❌';
      console.log(`\n  ${correctPaymentStatus} Payment status should be 'partially_refunded' (currently: '${payment.status}')`);

      if (payment.refunded_amount) {
        const isPartial = parseFloat(payment.refunded_amount) < parseFloat(payment.amount);
        console.log(`  ${isPartial ? '✅' : '❌'} Refund is ${isPartial ? 'partial' : 'full'} (${payment.refunded_amount} out of ${payment.amount})`);
      }
    }

    // Simulate what the UI will show
    console.log('\n3️⃣  UI DISPLAY PREVIEW');
    console.log('-'.repeat(70));

    if (schedule && payment) {
      console.log('User will see in enrollment installment list:');
      console.log('');
      console.log('  Payment #' + schedule.payment_number);
      console.log('  ' + schedule.payment_type);
      console.log('  Due: ' + new Date(schedule.scheduled_date).toLocaleDateString());
      console.log('');
      console.log('  ' + schedule.amount + ' ' + schedule.currency);

      if (payment.refunded_amount && parseFloat(payment.refunded_amount) > 0) {
        console.log('  Refunded: ' + payment.refunded_amount + ' ' + payment.currency + ' (in red text)');
      } else {
        console.log('  ⚠️  No refund amount will show (refunded_amount is missing or 0)');
      }

      console.log('');

      // Check status badge
      let statusBadge = 'Pending';
      if (schedule.status === 'paid' && payment.status === 'partially_refunded') {
        statusBadge = 'Partially Refunded (הוחזר חלקית)';
      } else if (schedule.status === 'refunded') {
        statusBadge = 'Refunded (הוחזר)';
      } else if (schedule.status === 'paid') {
        statusBadge = 'Paid (שולם)';
      }

      console.log('  Status Badge: ' + statusBadge);
    }

    // Check translations
    console.log('\n4️⃣  TRANSLATIONS');
    console.log('-'.repeat(70));

    const { data: translations } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .in('translation_key', [
        'user.payments.detail.refunded',
        'user.profile.billing.refunded',
        'user.profile.billing.schedule.refunded',
        'user.profile.billing.schedule.partially_refunded'
      ])
      .order('translation_key')
      .order('language_code');

    if (translations && translations.length > 0) {
      console.log('Translation keys found:');
      const grouped = translations.reduce((acc: any, t) => {
        if (!acc[t.translation_key]) acc[t.translation_key] = {};
        acc[t.translation_key][t.language_code] = t.translation_value;
        return acc;
      }, {});

      Object.keys(grouped).forEach(key => {
        console.log(`\n  ${key}`);
        console.log(`    EN: ${grouped[key].en || 'MISSING'}`);
        console.log(`    HE: ${grouped[key].he || 'MISSING'}`);
      });
    } else {
      console.log('⚠️  No translations found!');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 ACTION ITEMS');
    console.log('='.repeat(70));
    console.log('');

    const actions = [];

    if (schedule && schedule.status !== 'paid') {
      actions.push('1. Fix schedule status: npx ts-node scripts/fix-partial-refund-schedule-status.ts');
    }

    if (!payment || !payment.refunded_amount) {
      actions.push('2. Verify payment has refunded_amount set in database');
    }

    if (!translations || translations.length === 0) {
      actions.push('3. Add translations (already done, may need cache clear)');
    }

    actions.push('4. Hard refresh browser (Ctrl+Shift+R) to clear caches');
    actions.push('5. Reload the page to see changes');

    actions.forEach(action => console.log('  ' + action));

    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyRefundDisplay();
