/**
 * Prints the signer roles and fields of the DocuSign template used by one
 * enrollment's product. Read-only.
 *
 *   npx tsx scripts/show-docusign-template.ts <enrollment id>
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true } as any);

async function main() {
  const enrollmentId = process.argv[2];
  if (!enrollmentId) throw new Error('Usage: npx tsx scripts/show-docusign-template.ts <enrollment id>');
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: e } = await db
    .from('enrollments')
    .select('tenant_id, docusign_envelope_id, products:products!enrollments_product_id_fkey(title, signature_template_id)')
    .eq('id', enrollmentId)
    .single();
  if (!e) throw new Error('Enrollment not found');
  const product = Array.isArray(e.products) ? e.products[0] : (e.products as any);
  console.log(`Product: ${product?.title}  template: ${product?.signature_template_id}`);

  const { loadIntegration } = await import('../src/lib/integrations/store');
  const { data: integration } = await loadIntegration(e.tenant_id, 'docusign', { enabledOnly: true });
  if (!integration) throw new Error('DocuSign not configured');
  const c = integration.credentials as any;
  const docusign = (await import('docusign-esign')).default as any;
  const api = new docusign.ApiClient();
  api.setOAuthBasePath(String(c.oauth_base_path).replace('https://', ''));
  api.setBasePath(c.base_path);
  const key = String(c.private_key).includes('\\n') ? String(c.private_key).replace(/\\n/g, '\n') : c.private_key;
  const tok = await api.requestJWTUserToken(c.integration_key, c.user_id, ['signature', 'impersonation'], Buffer.from(key), 3600);
  api.addDefaultHeader('Authorization', `Bearer ${tok.body.access_token}`);

  const templates = new docusign.TemplatesApi(api);
  const recips = await templates.listRecipients(c.account_id, product.signature_template_id, { includeTabs: 'true' });
  for (const s of recips.signers ?? []) {
    const tabs = s.tabs ?? {};
    const counts = Object.entries(tabs).map(([k, v]) => `${k}=${(v as any[]).length}`).join(' ');
    console.log(`Template signer role="${s.roleName}" order=${s.routingOrder}  tabs: ${counts || '(none)'}`);
    for (const [k, v] of Object.entries(tabs)) for (const t of v as any[]) console.log(`  ${k}: page ${t.pageNumber} of document ${t.documentId}`);
  }

  if (e.docusign_envelope_id) {
    const envs = new docusign.EnvelopesApi(api);
    const r = await envs.listRecipients(c.account_id, e.docusign_envelope_id, { includeTabs: 'true' });
    for (const s of r.signers ?? []) {
      const counts = Object.entries(s.tabs ?? {}).map(([k, v]) => `${k}=${(v as any[]).length}`).join(' ');
      console.log(`Envelope signer role="${s.roleName}" status=${s.status} embedded=${!!s.clientUserId}  tabs: ${counts || '(none)'}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

