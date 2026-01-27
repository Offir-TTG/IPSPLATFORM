/**
 * Check Audit System Status
 *
 * This script checks:
 * 1. If audit tables exist
 * 2. If there are any audit events
 * 3. Sample of recent audit events
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuditStatus() {
  console.log('🔍 Checking Audit System Status...\n');

  try {
    // Check if audit_events table exists
    console.log('1️⃣  Checking if audit_events table exists...');
    const { data: events, error: eventsError } = await supabase
      .from('audit_events')
      .select('id')
      .limit(1);

    if (eventsError) {
      console.error('❌ audit_events table does NOT exist or has errors:');
      console.error('   Error:', eventsError.message);
      console.error('\n   ⚠️  You need to run the audit migration first!');
      console.error('   Run: supabase/migrations/20260126_audit_complete_cleanup_and_recreate.sql');
      return;
    }

    console.log('✅ audit_events table exists\n');

    // Check if audit_sessions table exists
    console.log('2️⃣  Checking if audit_sessions table exists...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('audit_sessions')
      .select('id')
      .limit(1);

    if (sessionsError) {
      console.error('❌ audit_sessions table does NOT exist');
      return;
    }

    console.log('✅ audit_sessions table exists\n');

    // Count total events
    console.log('3️⃣  Counting audit events...');
    const { count, error: countError } = await supabase
      .from('audit_events')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting events:', countError.message);
      return;
    }

    console.log(`✅ Total audit events: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No audit events found in database');
      console.log('   The audit system is set up but has no events yet.');
      console.log('   Events will be logged automatically when users perform actions.\n');
      return;
    }

    // Get sample of recent events
    console.log('4️⃣  Sample of recent audit events:');
    const { data: recentEvents, error: recentError } = await supabase
      .from('audit_events')
      .select('id, event_timestamp, event_type, action, resource_type, user_email')
      .order('event_timestamp', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent events:', recentError.message);
      return;
    }

    if (recentEvents && recentEvents.length > 0) {
      console.log('');
      recentEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.event_timestamp}`);
        console.log(`      Type: ${event.event_type}`);
        console.log(`      Action: ${event.action}`);
        console.log(`      Resource: ${event.resource_type}`);
        console.log(`      User: ${event.user_email || 'System'}`);
        console.log('');
      });
    }

    // Check translations
    console.log('5️⃣  Checking audit translations...');
    const { data: translations, error: translError } = await supabase
      .from('translations')
      .select('translation_key')
      .like('translation_key', 'audit.%')
      .eq('language_code', 'he')
      .limit(10);

    if (translError) {
      console.error('❌ Error checking translations:', translError.message);
    } else {
      console.log(`✅ Found ${translations?.length || 0} audit translations (sample)`);
      if (translations && translations.length > 0) {
        translations.slice(0, 5).forEach(t => {
          console.log(`   - ${t.translation_key}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAuditStatus()
  .then(() => {
    console.log('\n✓ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Check failed:', error);
    process.exit(1);
  });
