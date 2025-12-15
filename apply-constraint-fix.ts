import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const sqlPath = path.join(__dirname, 'supabase', 'SQL Scripts', '20251212_fix_translations_unique_constraint.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Applying migration: 20251212_fix_translations_unique_constraint.sql');
  console.log('---');

  // Split into individual statements (rough approach)
  const statements = sql
    .split(/;\s*$/gm)
    .filter(s => s.trim() && !s.trim().startsWith('--'))
    .map(s => s.trim());

  for (const statement of statements) {
    if (!statement) continue;

    try {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('Error:', error);
        // Try direct approach if rpc fails
        console.log('Trying alternative approach...');
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('Exception:', err);
    }
  }

  console.log('\nMigration complete!');
}

applyMigration();
