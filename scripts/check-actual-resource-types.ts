/**
 * Check what resource types actually exist in audit_events
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkResourceTypes() {
  console.log('🔍 Checking actual resource types in audit_events...\n');

  const { data, error } = await supabase
    .from('audit_events')
    .select('resource_type, action, event_type')
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get unique resource types
  const resourceTypes = [...new Set(data?.map(e => e.resource_type))];

  console.log('Found resource types:');
  resourceTypes.forEach(type => {
    console.log(`  - ${type}`);
  });

  // Get unique actions
  const actions = [...new Set(data?.map(e => e.action))];

  console.log('\nFound actions:');
  actions.forEach(action => {
    console.log(`  - ${action}`);
  });

  // Get unique event types
  const eventTypes = [...new Set(data?.map(e => e.event_type))];

  console.log('\nFound event types:');
  eventTypes.forEach(type => {
    console.log(`  - ${type}`);
  });
}

checkResourceTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
