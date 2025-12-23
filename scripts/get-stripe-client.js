require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

/**
 * Get Stripe client with credentials from database
 * @param {string} tenantId - Optional tenant ID. If not provided, will use the first active Stripe integration
 * @returns {Promise<{stripe: Stripe, config: object}>}
 */
async function getStripeClient(tenantId = null) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Query for Stripe integration
  let query = supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'stripe')
    .eq('is_enabled', true);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: integrations, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch Stripe integration: ${error.message}`);
  }

  if (!integrations || integrations.length === 0) {
    throw new Error('No active Stripe integration found in database');
  }

  const integration = integrations[0];
  const credentials = integration.credentials || {};

  if (!credentials.secret_key) {
    throw new Error('Stripe secret key not configured in database');
  }

  // Initialize Stripe client
  const stripe = new Stripe(credentials.secret_key, {
    apiVersion: '2023-10-16',
  });

  return {
    stripe,
    config: {
      tenantId: integration.tenant_id,
      publishableKey: credentials.publishable_key,
      webhookSecret: credentials.webhook_secret,
      settings: integration.settings || {},
    },
  };
}

module.exports = { getStripeClient };
