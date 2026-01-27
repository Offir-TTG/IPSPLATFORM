/**
 * Check refund status in database
 * Run: npx ts-node scripts/check-refund-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRefundStatus() {
  try {
    console.log('🔍 Checking refund status in database...\n');

    // Get tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    // Check payment schedules with refunded status
    const { data: refundedSchedules, error: schedError } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, stripe_payment_intent_id, stripe_invoice_id, enrollment_id, payment_number, updated_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'refunded')
      .order('updated_at', { ascending: false });

    console.log('=== REFUNDED PAYMENT SCHEDULES ===');
    if (refundedSchedules && refundedSchedules.length > 0) {
      console.log(`Found ${refundedSchedules.length} refunded schedules:\n`);
      refundedSchedules.forEach(s => {
        console.log(`Schedule ID: ${s.id}`);
        console.log(`  Amount: ${s.amount}`);
        console.log(`  Status: ${s.status}`);
        console.log(`  Payment Number: ${s.payment_number}`);
        console.log(`  Enrollment ID: ${s.enrollment_id}`);
        console.log(`  Stripe Payment Intent: ${s.stripe_payment_intent_id || 'NULL'}`);
        console.log(`  Stripe Invoice: ${s.stripe_invoice_id || 'NULL'}`);
        console.log(`  Last Updated: ${s.updated_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No refunded payment schedules found');
    }

    if (schedError) {
      console.error('Error fetching schedules:', schedError);
    }

    // Check payments table for refund records
    console.log('\n=== REFUND RECORDS IN PAYMENTS TABLE ===');
    const { data: refundedPayments, error: payError } = await supabase
      .from('payments')
      .select('id, payment_schedule_id, enrollment_id, status, amount, refunded_amount, refunded_at, refund_reason')
      .eq('tenant_id', tenantId)
      .in('status', ['refunded', 'partially_refunded'])
      .order('refunded_at', { ascending: false });

    if (refundedPayments && refundedPayments.length > 0) {
      console.log(`Found ${refundedPayments.length} refund records:\n`);
      refundedPayments.forEach(p => {
        console.log(`Payment ID: ${p.id}`);
        console.log(`  Schedule ID: ${p.payment_schedule_id}`);
        console.log(`  Enrollment ID: ${p.enrollment_id}`);
        console.log(`  Status: ${p.status}`);
        console.log(`  Amount: ${p.amount}`);
        console.log(`  Refunded Amount: ${p.refunded_amount}`);
        console.log(`  Refund Reason: ${p.refund_reason || 'N/A'}`);
        console.log(`  Refunded At: ${p.refunded_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No refund records found in payments table');
    }

    if (payError) {
      console.error('Error fetching payments:', payError);
    }

    // Check recent audit logs for refund actions
    console.log('\n=== RECENT REFUND AUDIT LOGS ===');
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, details, created_at')
      .eq('tenant_id', tenantId)
      .eq('action', 'payment.refunded')
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditLogs && auditLogs.length > 0) {
      console.log(`Found ${auditLogs.length} recent refund audit logs:\n`);
      auditLogs.forEach(log => {
        console.log(`Audit Log ID: ${log.id}`);
        console.log(`  User ID: ${log.user_id}`);
        console.log(`  Action: ${log.action}`);
        console.log(`  Created At: ${log.created_at}`);
        console.log(`  Details:`, JSON.stringify(log.details, null, 2));
        console.log('');
      });
    } else {
      console.log('❌ No refund audit logs found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRefundStatus();
