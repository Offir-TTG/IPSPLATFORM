/**
 * Apply the perfect dashboard function from DASHBOARD_FUNCTION_PERFECT.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyPerfectDashboard() {
  try {
    console.log('🔧 Applying perfect dashboard function...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'DASHBOARD_FUNCTION_PERFECT.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 SQL file loaded successfully');
    console.log('💡 Since direct execution is not available, here is the SQL to run:\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase Dashboard → SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Test with: node scripts/test-dashboard-function.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyPerfectDashboard();
