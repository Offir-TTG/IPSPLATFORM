import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration() {
  console.log('Applying final dashboard migration...\n');

  // Read the migration file
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Migration SQL loaded. Executing via Supabase REST API...\n');

  try {
    // Execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration failed via REST API:', errorText);
      console.log('\n📋 Please copy and execute this SQL manually in Supabase SQL Editor:\n');
      console.log('File location: supabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql');
      console.log('\nOr execute this SQL directly:\n');
      console.log(migrationSQL);
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('\nThe dashboard should now show:');
      console.log('  - All enrollments (active, completed, and pending)');
      console.log('  - Total lessons count in Progress Overview');
      console.log('  - Correct progress percentages');
    }
  } catch (error: any) {
    console.error('❌ Error executing migration:', error.message);
    console.log('\n📋 Please execute this migration manually in Supabase SQL Editor:');
    console.log('\nFile: supabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql\n');
  }
}

applyMigration().catch(console.error);
