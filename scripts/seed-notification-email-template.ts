/**
 * Seed notification.generic email template into the database
 * This makes it available in the email template management page
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedNotificationTemplate() {
  console.log('\n🌱 Seeding notification.generic email template...\n');

  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name');

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`📋 Found ${tenants?.length || 0} tenants\n`);

    for (const tenant of tenants || []) {
      console.log(`\n🏢 Processing tenant: ${tenant.name} (${tenant.id})`);

      // Check if template already exists for this tenant
      const { data: existingTemplate } = await supabase
        .from('email_templates')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('template_key', 'notification.generic')
        .single();

      if (existingTemplate) {
        console.log('   ℹ️  Template already exists, skipping...');
        continue;
      }

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .insert({
          tenant_id: tenant.id,
          template_key: 'notification.generic',
          template_name: 'Generic Notification',
          template_category: 'system',
          description: 'Generic template for in-app notifications sent via email',
          variables: [
            { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
            { name: 'notificationTitle', description: 'Notification title from admin', example: 'New Assignment Posted', required: true, type: 'string' },
            { name: 'notificationMessage', description: 'Notification message from admin', example: 'A new assignment has been posted...', required: true, type: 'string' },
            { name: 'priority', description: 'Notification priority', example: 'urgent', required: true, type: 'string' },
            { name: 'category', description: 'Notification category', example: 'lesson', required: true, type: 'string' },
            { name: 'actionUrl', description: 'Link to relevant action', example: 'https://...', required: false, type: 'url' },
            { name: 'actionLabel', description: 'Action button label', example: 'View Details', required: false, type: 'string' },
            { name: 'organizationName', description: 'Organization name', example: 'IPS Platform', required: true, type: 'string' },
          ],
          is_active: true,
          is_system: true,
        })
        .select()
        .single();

      if (templateError) {
        console.error('   ❌ Error creating template:', templateError);
        continue;
      }

      console.log('   ✅ Created template');

      // Create English version
      const { error: enVersionError } = await supabase
        .from('email_template_versions')
        .insert({
          template_id: template.id,
          language_code: 'en',
          version: 1,
          subject: '{{notificationTitle}}',
          body_html: `
<div style="padding: 20px;">
  {{#if (eq priority "urgent")}}
  <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0; color: #991b1b; font-weight: 600; display: flex; align-items: center;">
      <span style="font-size: 20px; margin-right: 8px;">⚠️</span> Urgent Notification
    </p>
  </div>
  {{else if (eq priority "high")}}
  <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0; color: #92400e; font-weight: 600; display: flex; align-items: center;">
      <span style="font-size: 20px; margin-right: 8px;">🔔</span> High Priority
    </p>
  </div>
  {{/if}}

  <h2 style="color: #1f2937; margin-bottom: 8px;">{{notificationTitle}}</h2>

  <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">Hello {{userName}},</p>

  <div style="background: #f9fafb; border-left: 4px solid {{primaryColor}}; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; color: #374151; white-space: pre-wrap;">{{notificationMessage}}</p>
  </div>

  {{#if actionUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{actionUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
      {{#if actionLabel}}{{actionLabel}}{{else}}View Details{{/if}}
    </a>
  </div>
  {{/if}}

  <p style="text-align: center; color: #9ca3af; font-size: 13px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
    {{organizationName}}<br/>
    This is an automated notification from your learning platform.
  </p>
</div>
          `,
          body_text: `
{{#if (eq priority "urgent")}}⚠️ URGENT NOTIFICATION{{else if (eq priority "high")}}🔔 HIGH PRIORITY{{/if}}

{{notificationTitle}}

Hello {{userName}},

{{notificationMessage}}

{{#if actionUrl}}
{{#if actionLabel}}{{actionLabel}}{{else}}View Details{{/if}}: {{actionUrl}}
{{/if}}

---
{{organizationName}}
This is an automated notification from your learning platform.
          `,
          is_current: true,
        });

      if (enVersionError) {
        console.error('   ❌ Error creating English version:', enVersionError);
        continue;
      }

      console.log('   ✅ Created English version');

      // Create Hebrew version
      const { error: heVersionError } = await supabase
        .from('email_template_versions')
        .insert({
          template_id: template.id,
          language_code: 'he',
          version: 1,
          subject: '{{notificationTitle}}',
          body_html: `
<div style="padding: 20px; direction: rtl;">
  {{#if (eq priority "urgent")}}
  <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0; color: #991b1b; font-weight: 600; display: flex; align-items: center;">
      <span style="font-size: 20px; margin-left: 8px;">⚠️</span> התראה דחופה
    </p>
  </div>
  {{else if (eq priority "high")}}
  <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <p style="margin: 0; color: #92400e; font-weight: 600; display: flex; align-items: center;">
      <span style="font-size: 20px; margin-left: 8px;">🔔</span> עדיפות גבוהה
    </p>
  </div>
  {{/if}}

  <h2 style="color: #1f2937; margin-bottom: 8px;">{{notificationTitle}}</h2>

  <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">שלום {{userName}},</p>

  <div style="background: #f9fafb; border-right: 4px solid {{primaryColor}}; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; color: #374151; white-space: pre-wrap;">{{notificationMessage}}</p>
  </div>

  {{#if actionUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{actionUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
      {{#if actionLabel}}{{actionLabel}}{{else}}צפה בפרטים{{/if}}
    </a>
  </div>
  {{/if}}

  <p style="text-align: center; color: #9ca3af; font-size: 13px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
    {{organizationName}}<br/>
    זוהי התראה אוטומטית מפלטפורמת הלמידה שלך.
  </p>
</div>
          `,
          body_text: `
{{#if (eq priority "urgent")}}⚠️ התראה דחופה{{else if (eq priority "high")}}🔔 עדיפות גבוהה{{/if}}

{{notificationTitle}}

שלום {{userName}},

{{notificationMessage}}

{{#if actionUrl}}
{{#if actionLabel}}{{actionLabel}}{{else}}צפה בפרטים{{/if}}: {{actionUrl}}
{{/if}}

---
{{organizationName}}
זוהי התראה אוטומטית מפלטפורמת הלמידה שלך.
          `,
          is_current: true,
        });

      if (heVersionError) {
        console.error('   ❌ Error creating Hebrew version:', heVersionError);
        continue;
      }

      console.log('   ✅ Created Hebrew version');
    }

    console.log('\n✅ Notification template seeding complete!\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

seedNotificationTemplate();
