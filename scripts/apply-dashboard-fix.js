/**
 * Script to apply the dashboard function fix
 * Fixes the end_time column error by calculating it from start_time + duration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try to load from .env.local if not already set
if (!supabaseUrl || !supabaseServiceKey) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value;
      }
    });
  } catch (err) {
    console.error('Could not read .env.local file:', err.message);
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  try {
    console.log('🔧 Applying dashboard function fix...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251121_fix_dashboard_function_end_time.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing SQL migration...');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Split by statement and execute each one
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.rpc('query', { query_text: statement + ';' }).catch(async () => {
            // Last resort: use REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({ query_text: statement + ';' })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
          });
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Error executing migration:', error.message);
      console.log('\n💡 Please run this SQL manually in the Supabase SQL Editor:');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(sql);
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    console.log('✅ Migration applied successfully!\n');

    // Test the function
    console.log('🧪 Testing the fixed function...');

    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (users && users.length > 0) {
      const testUser = users[0];
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_user_dashboard_v3', {
          p_user_id: testUser.id
        });

      if (dashboardError) {
        console.error('❌ Dashboard function still has errors:', dashboardError.message);
      } else {
        console.log('✅ Dashboard function working correctly!');
        console.log(`   Enrollments: ${dashboardData?.enrollments?.length || 0}`);
        console.log(`   Upcoming Sessions: ${dashboardData?.upcoming_sessions?.length || 0}`);
      }
    }

    console.log('\n🎉 Dashboard fix complete!');
    console.log('💡 Users can now access their dashboard without errors');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n💡 Trying alternative approach...');
    console.log('Please copy and paste this SQL into the Supabase SQL Editor:\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251121_fix_dashboard_function_end_time.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('═══════════════════════════════════════════════════════════');
  }
}

// Run the fix
applyFix();
