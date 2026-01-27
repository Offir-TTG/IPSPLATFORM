/**
 * Apply refund columns migration to payments table
 * Run: npx ts-node scripts/apply-refund-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  try {
    console.log('📝 Applying refund columns migration to payments table...\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260126_add_refund_columns_to_payments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('exec_sql RPC not found, executing directly...\n');

      // Split SQL into statements and execute each
      const statements = migrationSQL.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (!statement.trim()) continue;

        const { error: execError } = await supabase.rpc('query', {
          query_text: statement
        });

        if (execError) {
          console.error('Error executing statement:', execError);
        }
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Verify columns were added
    console.log('\n🔍 Verifying columns...');
    const { data: sample } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log('\nPayments table columns:', columns);

      const hasRefundColumns =
        columns.includes('refunded_amount') &&
        columns.includes('refunded_at') &&
        columns.includes('refund_reason');

      if (hasRefundColumns) {
        console.log('✅ All refund columns present!');
      } else {
        console.log('❌ Some refund columns missing');
      }
    } else {
      console.log('No records in payments table to verify');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
