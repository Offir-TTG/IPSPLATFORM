import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface NavigationSection {
  translation_key: string;
  order: number;
  items: NavigationItem[];
}

interface NavigationItem {
  translation_key: string;
  icon: string;
  href: string;
  order: number;
}

const navigationStructure: NavigationSection[] = [
  {
    translation_key: 'admin.nav.overview',
    order: 1,
    items: [
      {
        translation_key: 'admin.nav.dashboard',
        icon: 'dashboard',
        href: '/admin/dashboard',
        order: 1
      }
    ]
  },
  {
    translation_key: 'admin.nav.learning',
    order: 2,
    items: [
      {
        translation_key: 'admin.nav.lms_programs',
        icon: 'programs',
        href: '/admin/lms/programs',
        order: 1
      },
      {
        translation_key: 'admin.nav.lms_courses',
        icon: 'courses',
        href: '/admin/lms/courses',
        order: 2
      },
      {
        translation_key: 'admin.nav.enrollments',
        icon: 'enrollments',
        href: '/admin/enrollments',
        order: 3
      },
      {
        translation_key: 'admin.nav.grading',
        icon: 'grading',
        href: '/admin/grading/scales',
        order: 4
      }
    ]
  },
  {
    translation_key: 'admin.nav.users_access',
    order: 3,
    items: [
      {
        translation_key: 'admin.nav.users',
        icon: 'users',
        href: '/admin/settings/users',
        order: 1
      }
    ]
  },
  {
    translation_key: 'admin.nav.configuration',
    order: 4,
    items: [
      {
        translation_key: 'admin.nav.organization',
        icon: 'organization',
        href: '/admin/settings/organization',
        order: 1
      },
      {
        translation_key: 'admin.nav.languages',
        icon: 'languages',
        href: '/admin/config/languages',
        order: 2
      },
      {
        translation_key: 'admin.nav.translations',
        icon: 'translations',
        href: '/admin/config/translations',
        order: 3
      },
      {
        translation_key: 'admin.nav.settings',
        icon: 'settings',
        href: '/admin/config/settings',
        order: 4
      },
      {
        translation_key: 'admin.nav.theme',
        icon: 'theme',
        href: '/admin/settings/theme',
        order: 5
      },
      {
        translation_key: 'admin.nav.features',
        icon: 'features',
        href: '/admin/config/features',
        order: 6
      },
      {
        translation_key: 'admin.nav.integrations',
        icon: 'integrations',
        href: '/admin/config/integrations',
        order: 7
      },
      {
        translation_key: 'admin.nav.navigation',
        icon: 'navigation',
        href: '/admin/config/navigation',
        order: 8
      },
      {
        translation_key: 'admin.nav.emails',
        icon: 'emails',
        href: '/admin/emails',
        order: 9
      }
    ]
  },
  {
    translation_key: 'admin.nav.business',
    order: 5,
    items: [
      {
        translation_key: 'admin.nav.payments',
        icon: 'payments',
        href: '/admin/payments',
        order: 1
      }
    ]
  },
  {
    translation_key: 'admin.nav.security',
    order: 6,
    items: [
      {
        translation_key: 'admin.nav.audit',
        icon: 'audit',
        href: '/admin/audit',
        order: 1
      }
    ]
  }
];

async function seedNavigationItems() {
  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id');

    if (tenantsError || !tenants || tenants.length === 0) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`\n📦 Seeding navigation for tenant: ${tenant.id}`);

      // Check if navigation items already exist for this tenant
      const { data: existingItems } = await supabase
        .from('navigation_items')
        .select('id')
        .eq('tenant_id', tenant.id)
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        console.log(`⏭️  Navigation items already exist for tenant ${tenant.id}, skipping...`);
        continue;
      }

      // Insert all navigation items for this tenant
      for (const section of navigationStructure) {
        // Insert section (parent item)
        const { data: sectionData, error: sectionError } = await supabase
          .from('navigation_items')
          .insert({
            tenant_id: tenant.id,
            translation_key: section.translation_key,
            parent_id: null,
            order: section.order,
            is_active: true,
            roles: ['admin', 'super_admin']
          })
          .select('id')
          .single();

        if (sectionError) {
          console.error(`❌ Error inserting section ${section.translation_key}:`, sectionError);
          continue;
        }

        console.log(`  ✅ Section: ${section.translation_key}`);

        // Insert items (children)
        for (const item of section.items) {
          const { error: itemError } = await supabase
            .from('navigation_items')
            .insert({
              tenant_id: tenant.id,
              translation_key: item.translation_key,
              icon: item.icon,
              href: item.href,
              parent_id: sectionData.id,
              order: item.order,
              is_active: true,
              roles: ['admin', 'super_admin']
            });

          if (itemError) {
            console.error(`    ❌ Error inserting item ${item.translation_key}:`, itemError);
          } else {
            console.log(`    ✅ Item: ${item.translation_key} (${item.href})`);
          }
        }
      }

      console.log(`\n✅ Completed seeding navigation for tenant: ${tenant.id}`);
    }

    console.log('\n🎉 All navigation items seeded successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

seedNavigationItems();
