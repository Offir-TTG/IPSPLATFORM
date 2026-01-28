import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

interface StripeConfig {
  stripe: Stripe;
  publishableKey: string;
  webhookSecret: string;
  tenantId: string;
  settings: Record<string, any>;
}

/**
 * Get Stripe client with credentials from database
 * This function fetches Stripe configuration from the integrations table
 * for the current tenant and returns an initialized Stripe client.
 *
 * Uses admin client to bypass RLS for cron jobs and server-side operations.
 *
 * @param tenantId - Optional tenant ID. If not provided, uses the first active Stripe integration
 * @returns Promise<StripeConfig> - Stripe client and configuration
 */
export async function getStripeClient(tenantId?: string): Promise<StripeConfig> {
  const supabase = createAdminClient();

  // Query for Stripe integration
  let query = supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'stripe')
    .eq('is_enabled', true);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: integrations, error } = await query.limit(1).single();

  if (error || !integrations) {
    throw new Error('No active Stripe integration found in database');
  }

  const credentials = integrations.credentials || {};

  if (!credentials.secret_key) {
    throw new Error('Stripe secret key not configured in database');
  }

  // Initialize Stripe client
  const stripe = new Stripe(credentials.secret_key, {
    apiVersion: '2023-10-16',
  });

  return {
    stripe,
    publishableKey: credentials.publishable_key || '',
    webhookSecret: credentials.webhook_secret || '',
    tenantId: integrations.tenant_id,
    settings: integrations.settings || {},
  };
}
