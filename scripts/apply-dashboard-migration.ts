import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying dashboard migration...\n');

  // Read the migration file
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260119210000_add_total_lessons_to_dashboard.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Migration failed:', error);

      // Try alternative method - split by ; and execute each statement
      console.log('\nTrying alternative method...\n');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        if (!statement) continue;

        console.log(`Executing: ${statement.substring(0, 100)}...`);

        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (stmtError) {
          console.error(`Failed:`, stmtError);
        } else {
          console.log(`✓ Success`);
        }
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }
  } catch (err: any) {
    console.error('Error applying migration:', err.message);
  }
}

applyMigration().catch(console.error);
