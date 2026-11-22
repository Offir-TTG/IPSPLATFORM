import Stripe from 'stripe';
import { loadIntegration } from '@/lib/integrations/store';

interface StripeConfig {
  stripe: Stripe;
  publishableKey: string;
  webhookSecret: string;
  tenantId: string;
  settings: Record<string, any>;
}

/**
 * The Stripe client for one tenant, built from that tenant's own Stripe
 * settings (read server-side, secrets decrypted).
 *
 * A tenant id is required: picking "any" tenant's account could charge a
 * client through someone else's Stripe.
 */
export async function getStripeClient(tenantId: string): Promise<StripeConfig> {
  if (!tenantId) {
    throw new Error('A tenant is required to use Stripe');
  }

  const { data: integration, error } = await loadIntegration(tenantId, 'stripe', { enabledOnly: true });
  if (error || !integration) {
    throw new Error('No active Stripe integration found in database');
  }

  const credentials = integration.credentials || {};
  if (!credentials.secret_key) {
    throw new Error('Stripe secret key not configured in database');
  }

  const stripe = new Stripe(credentials.secret_key, {
    apiVersion: '2023-10-16',
  });

  return {
    stripe,
    publishableKey: credentials.publishable_key || '',
    webhookSecret: credentials.webhook_secret || '',
    tenantId: integration.tenant_id as string,
    settings: integration.settings || {},
  };
}
