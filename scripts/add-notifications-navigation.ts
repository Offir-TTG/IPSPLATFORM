import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNotificationsNavigation() {
  try {
    console.log('Adding notifications navigation item...');

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.id}`);

      // Check if "Communications" section exists
      const { data: commSection, error: commSectionError } = await supabase
        .from('navigation_items')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('translation_key', 'admin.nav.communications')
        .is('parent_id', null)
        .maybeSingle();

      if (commSectionError) {
        console.error('Error checking communications section:', commSectionError);
        continue;
      }

      let communicationsSectionId: string;

      if (!commSection) {
        // Create Communications section
        console.log('Creating Communications section...');

        // Get max order for sections
        const { data: maxOrderData } = await supabase
          .from('navigation_items')
          .select('order')
          .eq('tenant_id', tenant.id)
          .is('parent_id', null)
          .order('order', { ascending: false })
          .limit(1)
          .single();

        const nextOrder = (maxOrderData?.order || 0) + 1;

        const { data: newSection, error: createSectionError } = await supabase
          .from('navigation_items')
          .insert({
            tenant_id: tenant.id,
            translation_key: 'admin.nav.communications',
            icon: null,
            href: null,
            parent_id: null,
            is_active: true,
            order: nextOrder,
          })
          .select('id')
          .single();

        if (createSectionError) {
          console.error('Error creating communications section:', createSectionError);
          continue;
        }

        communicationsSectionId = newSection.id;
        console.log('Created Communications section:', communicationsSectionId);
      } else {
        communicationsSectionId = commSection.id;
        console.log('Communications section already exists:', communicationsSectionId);
      }

      // Check if notifications item already exists
      const { data: existingNotif, error: existingNotifError } = await supabase
        .from('navigation_items')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('translation_key', 'admin.nav.notifications')
        .eq('parent_id', communicationsSectionId)
        .maybeSingle();

      if (existingNotifError) {
        console.error('Error checking existing notifications item:', existingNotifError);
        continue;
      }

      if (existingNotif) {
        console.log('Notifications item already exists, skipping...');
        continue;
      }

      // Create notifications navigation item
      console.log('Creating Notifications navigation item...');

      const { error: createItemError } = await supabase
        .from('navigation_items')
        .insert({
          tenant_id: tenant.id,
          translation_key: 'admin.nav.notifications',
          icon: 'notifications',
          href: '/admin/notifications',
          parent_id: communicationsSectionId,
          is_active: true,
          order: 1,
        });

      if (createItemError) {
        console.error('Error creating notifications item:', createItemError);
        continue;
      }

      console.log('✅ Successfully added notifications navigation item');
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addNotificationsNavigation();
