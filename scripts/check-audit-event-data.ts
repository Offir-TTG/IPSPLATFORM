/**
 * Check what data is in the audit_events table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log('Checking audit_events data structure...\n');

  const { data, error } = await supabase
    .from('audit_events')
    .select('*')
    .order('event_timestamp', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No events found');
    return;
  }

  const event = data[0];
  console.log('Event structure:');
  console.log(JSON.stringify(event, null, 2));
  console.log('\n--- Key fields check ---');
  console.log('has old_values:', !!event.old_values);
  console.log('has new_values:', !!event.new_values);
  console.log('has changed_fields:', !!event.changed_fields);
  console.log('event_type:', event.event_type);
  console.log('action:', event.action);

  if (event.changed_fields) {
    console.log('changed_fields:', event.changed_fields);
  }
  if (event.old_values) {
    console.log('old_values keys:', Object.keys(event.old_values));
  }
  if (event.new_values) {
    console.log('new_values keys:', Object.keys(event.new_values));
  }
}

checkData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
