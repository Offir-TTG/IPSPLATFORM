/**
 * Delete the audit_events table and all related objects
 * WARNING: This will permanently delete all audit trail data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteAuditEventsTable() {
  console.log('\n⚠️  WARNING: This will permanently delete the audit_events table and ALL audit trail data!\n');

  // Count existing records
  const { count, error: countError } = await supabase
    .from('audit_events')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('Could not count records (table may not exist or may have access restrictions)');
    console.log('Error:', countError.message);
  } else {
    console.log(`Current audit_events records: ${count || 0}\n`);
  }

  const answer = await askQuestion('Are you sure you want to delete the audit_events table? Type "DELETE" to confirm: ');

  if (answer !== 'DELETE') {
    console.log('\n❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🗑️  Deleting audit_events table...\n');

  // Drop the table using raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'DROP TABLE IF EXISTS audit_events CASCADE;'
  });

  if (error) {
    console.error('❌ Error deleting table:', error.message);
    console.log('\nYou may need to run the SQL migration file directly in the Supabase SQL Editor.');
    rl.close();
    process.exit(1);
  }

  console.log('✅ Successfully deleted audit_events table\n');
  console.log('Note: You may want to also:');
  console.log('  1. Remove the audit_sessions table if it exists');
  console.log('  2. Clean up any related policies, triggers, or functions');
  console.log('  3. Remove audit logging code from your application\n');

  rl.close();
}

deleteAuditEventsTable();
