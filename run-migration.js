require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running migration to add completion_benefit and access_duration fields...\n');

  const sql = fs.readFileSync('supabase/SQL Scripts/add_product_completion_and_access_fields.sql', 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed.startsWith('--') || trimmed.length === 0) continue;
    
    console.log('Executing:', trimmed.substring(0, 100) + '...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: trimmed });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✓ Success\n');
    }
  }
  
  console.log('Migration completed!');
  process.exit(0);
}

runMigration();
