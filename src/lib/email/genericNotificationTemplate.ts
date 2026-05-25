import type { SupabaseClient } from '@supabase/supabase-js';

export const GENERIC_NOTIFICATION_TEMPLATE_KEY = 'notification.generic';

// Email schedules are locked to the generic-notification template so
// admins compose a single title + message instead of wrestling with
// per-template variable lists. This resolves the template's id for a
// given tenant (tenant-specific row preferred, global row fallback).
export async function resolveGenericNotificationTemplateId(
  admin: SupabaseClient,
  tenantId: string,
): Promise<string | null> {
  const { data: tenantRow } = await admin
    .from('email_templates')
    .select('id')
    .eq('template_key', GENERIC_NOTIFICATION_TEMPLATE_KEY)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (tenantRow?.id) return tenantRow.id;

  const { data: globalRow } = await admin
    .from('email_templates')
    .select('id')
    .eq('template_key', GENERIC_NOTIFICATION_TEMPLATE_KEY)
    .is('tenant_id', null)
    .maybeSingle();
  return globalRow?.id ?? null;
}
