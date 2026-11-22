/**
 * Prints what the database holds for one client's enrollments: totals,
 * every scheduled payment and every payment record. Read-only.
 *
 *   npx tsx scripts/show-enrollment.ts client@example.com
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true } as any);

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error('Usage: npx tsx scripts/show-enrollment.ts <client email>');
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: user } = await db.from('users').select('id, email, stripe_customer_id').ilike('email', email).maybeSingle();
  if (!user) throw new Error(`No user with email ${email}`);
  console.log(`User ${user.email}  stripe customer: ${user.stripe_customer_id ?? '-'}`);

  const { data: enrollments } = await db
    .from('enrollments')
    .select('id, status, payment_status, total_amount, paid_amount, currency, created_at, products:products!enrollments_product_id_fkey(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  for (const e of enrollments ?? []) {
    const title = (Array.isArray(e.products) ? e.products[0] : (e.products as any))?.title ?? '?';
    console.log(`\n== ${title}  [${e.id}]`);
    console.log(`   status=${e.status}  payment_status=${e.payment_status}  paid ${e.paid_amount} of ${e.total_amount} ${e.currency}`);

    const { data: schedules } = await db
      .from('payment_schedules')
      .select('payment_number, payment_type, amount, scheduled_date, status, retry_count, next_retry_date, last_error, stripe_invoice_id, stripe_payment_intent_id')
      .eq('enrollment_id', e.id)
      .order('payment_number');
    console.log('   Schedule:');
    for (const s of schedules ?? []) {
      console.log(
        `     #${s.payment_number} ${s.payment_type.padEnd(12)} ${String(s.amount).padStart(9)}  due ${String(s.scheduled_date).slice(0, 10)}  ${s.status.padEnd(10)}` +
          (s.retry_count ? ` retries=${s.retry_count}` : '') +
          (s.next_retry_date ? ` next=${String(s.next_retry_date).slice(0, 10)}` : '') +
          (s.stripe_invoice_id ? ` ${s.stripe_invoice_id}` : s.stripe_payment_intent_id ? ` ${s.stripe_payment_intent_id}` : '') +
          (s.last_error ? `\n         last error: ${s.last_error}` : ''),
      );
    }

    const { data: payments } = await db
      .from('payments')
      .select('amount, status, refunded_amount, installment_number, stripe_payment_intent_id, created_at')
      .eq('enrollment_id', e.id)
      .order('created_at');
    console.log('   Payments:');
    for (const p of payments ?? []) {
      console.log(`     ${String(p.amount).padStart(9)}  ${p.status.padEnd(18)} refunded=${p.refunded_amount ?? 0}  #${p.installment_number ?? '-'}  ${p.stripe_payment_intent_id ?? ''}`);
    }
    if (!payments?.length) console.log('     (none)');
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
