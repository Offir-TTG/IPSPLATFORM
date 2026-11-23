import docusign from 'docusign-esign';
import { createClient } from '@/lib/supabase/server';
import { loadIntegration } from '@/lib/integrations/store';

export interface RecipientInfo {
  email: string;
  name: string;
  recipientId: string;
  routingOrder?: string;
  /** Language of DocuSign's signing screen, e.g. 'he' or 'en'. */
  language?: string;
}

export interface EnvelopeResponse {
  envelopeId: string;
  status: string;
  statusDateTime: string;
}

export interface DocuSignCredentials {
  account_id: string;
  integration_key: string;
  user_id: string;
  private_key: string;
  oauth_base_path: string;
  base_path: string;
}

export interface DocuSignSettings {
  default_template_id?: string;
  auto_send?: boolean;
}

export class DocuSignClient {
  private apiClient: docusign.ApiClient;
  private accountId: string;
  private integrationKey: string;
  private userId: string;
  private privateKey: string;
  private settings: DocuSignSettings;
  /** The account's API address; "demo" means DocuSign's test environment. */
  private basePath: string;

  constructor(credentials: DocuSignCredentials, settings?: DocuSignSettings) {
    this.basePath = credentials.base_path;
    this.accountId = credentials.account_id;
    this.integrationKey = credentials.integration_key;
    this.userId = credentials.user_id;
    this.privateKey = credentials.private_key;
    this.settings = settings || {};

    const oAuthBasePath = credentials.oauth_base_path;
    const basePath = credentials.base_path;

    if (!this.accountId || !this.integrationKey || !this.userId || !this.privateKey) {
      throw new Error('DocuSign credentials are incomplete. Please configure the integration in the admin panel.');
    }

    // Initialize API client
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setOAuthBasePath(oAuthBasePath.replace('https://', ''));
    this.apiClient.setBasePath(basePath);
  }

  /**
   * Authenticate using JWT
   */
  private async authenticate(): Promise<void> {
    try {
      const scopes = ['signature', 'impersonation'];

      // Format private key - replace \n with actual newlines if needed
      let privateKey = this.privateKey;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Request JWT token
      const results = await this.apiClient.requestJWTUserToken(
        this.integrationKey,
        this.userId,
        scopes,
        Buffer.from(privateKey, 'utf8'),
        3600 // 1 hour
      );

      this.apiClient.addDefaultHeader(
        'Authorization',
        `Bearer ${results.body.access_token}`
      );
    } catch (error) {
      console.error('DocuSign authentication failed:', error);
      throw new Error('Failed to authenticate with DocuSign');
    }
  }

  /**
   * Send an envelope using a template
   */
  async sendEnvelopeFromTemplate(
    templateId: string,
    recipient: RecipientInfo,
    emailSubject: string,
    customFields?: Record<string, string>
  ): Promise<EnvelopeResponse> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // The signer goes into the template's own signer slot (the one holding
      // the signature fields). A role name that doesn't match the template
      // adds a second signer with no fields, and DocuSign then asks the signer
      // to "add a field" instead of showing where to sign.
      const templatesApi = new (docusign as any).TemplatesApi(this.apiClient);
      const templateRecipients = await templatesApi.listRecipients(this.accountId, templateId);
      const slot = [...(templateRecipients.signers || [])].sort(
        (a: any, b: any) => Number(a.routingOrder || 1) - Number(b.routingOrder || 1)
      )[0];

      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.templateId = templateId;
      envelopeDefinition.emailSubject = emailSubject;
      if (customFields) {
        const textCustomFields = Object.entries(customFields).map(
          ([name, value]) =>
            docusign.TextCustomField.constructFromObject({ name, value })
        );
        envelopeDefinition.customFields = { textCustomFields };
      }

      const signer: Record<string, unknown> = {
        email: recipient.email,
        name: recipient.name,
        clientUserId: recipient.recipientId,
      };
      // The signer's language sets the language of DocuSign's signing screen.
      if (recipient.language) {
        signer.emailNotification = {
          supportedLanguage: recipient.language,
          emailSubject,
          emailBody: emailSubject,
        };
      }

      let results: any;
      if (!slot || slot.roleName) {
        // Usual case: the template's signer has a role name.
        envelopeDefinition.templateRoles = [
          docusign.TemplateRole.constructFromObject({ ...signer, roleName: slot?.roleName || 'Student' }),
        ];
        envelopeDefinition.status = 'sent';
        results = await envelopesApi.createEnvelope(this.accountId, { envelopeDefinition });
      } else {
        // The template's signer has no role name: create a draft, put the
        // signer into that slot by its id, then send.
        envelopeDefinition.status = 'created';
        const draft = await envelopesApi.createEnvelope(this.accountId, { envelopeDefinition });
        // The slot's id on the new envelope (it can differ from the template's).
        const draftRecipients = await (envelopesApi as any).listRecipients(this.accountId, draft.envelopeId);
        const draftSlot = [...(draftRecipients.signers || [])].sort(
          (a: any, b: any) => Number(a.routingOrder || 1) - Number(b.routingOrder || 1)
        )[0];
        // (missing from our local type file for docusign-esign)
        await (envelopesApi as any).updateRecipients(this.accountId, draft.envelopeId, {
          recipients: {
            signers: [{ ...signer, recipientId: draftSlot?.recipientId ?? slot.recipientId, recipientIdGuid: draftSlot?.recipientIdGuid }],
          },
        });
        await envelopesApi.update(this.accountId, draft.envelopeId, { envelope: { status: 'sent' } });
        results = { ...draft, status: 'sent' };
      }

      return {
        envelopeId: results.envelopeId || '',
        status: results.status || '',
        statusDateTime: results.statusDateTime || '',
      };
    } catch (error) {
      console.error('Failed to send DocuSign envelope:', error);
      throw new Error('Failed to send DocuSign envelope');
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(
        this.accountId,
        envelopeId
      );

      return envelope;
    } catch (error) {
      console.error('Failed to get envelope status:', error);
      throw new Error('Failed to get envelope status');
    }
  }

  /**
   * Get recipient view URL (for embedded signing)
   */
  async getRecipientViewUrl(
    envelopeId: string,
    recipient: RecipientInfo,
    returnUrl: string,
    /** Signing shown in a dialog (iframe) on this origin. */
    frameOrigin?: string
  ): Promise<string> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // DocuSign shows signing inside an iframe only for the sites listed in
      // frameAncestors (ours plus DocuSign's own app host), and posts its
      // messages only to messageOrigins.
      const docusignApps = /demo/i.test(this.basePath || '') ? 'https://apps-d.docusign.com' : 'https://apps.docusign.com';
      const viewRequest = docusign.RecipientViewRequest.constructFromObject({
        returnUrl,
        authenticationMethod: 'email',
        email: recipient.email,
        userName: recipient.name,
        clientUserId: recipient.recipientId,
        ...(frameOrigin ? { frameAncestors: [frameOrigin, docusignApps], messageOrigins: [docusignApps] } : {}),
      });

      const results = await envelopesApi.createRecipientView(
        this.accountId,
        envelopeId,
        { recipientViewRequest: viewRequest }
      );

      return results.url || '';
    } catch (error) {
      console.error('Failed to get recipient view URL:', error);
      throw new Error('Failed to get recipient view URL');
    }
  }

  /**
   * Void an envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      const voidEnvelopeRequest = docusign.Envelope.constructFromObject({
        status: 'voided',
        voidedReason: reason,
      });

      await envelopesApi.update(this.accountId, envelopeId, {
        envelope: voidEnvelopeRequest,
      });
    } catch (error) {
      console.error('Failed to void envelope:', error);
      throw new Error('Failed to void envelope');
    }
  }

  /**
   * Download envelope documents
   */
  async downloadDocuments(envelopeId: string): Promise<Buffer> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const documents = await envelopesApi.getDocument(
        this.accountId,
        envelopeId,
        'combined'
      );

      return documents as Buffer;
    } catch (error) {
      console.error('Failed to download documents:', error);
      throw new Error('Failed to download documents');
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<Array<{ templateId: string; name: string }>> {
    await this.authenticate();

    try {
      const templatesApi = new (docusign as any).TemplatesApi(this.apiClient);
      const templates = await templatesApi.listTemplates(this.accountId);

      return (templates.envelopeTemplates || []).map((template: any) => ({
        templateId: template.templateId || '',
        name: template.name || '',
      }));
    } catch (error) {
      console.error('Failed to list templates:', error);
      throw new Error('Failed to list templates');
    }
  }
}

/**
 * Get DocuSign client with credentials from database
 */
export async function getDocuSignClient(): Promise<DocuSignClient> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[getDocuSignClient] Failed to get user:', userError);
      throw new Error('Authentication required. Please ensure you are logged in.');
    }

    // Get tenant_id from tenant_users relationship
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (tenantError || !tenantUsers) {
      console.error('[getDocuSignClient] Failed to get tenant:', tenantError);
      throw new Error('No active tenant found for user. Please contact support.');
    }

    const tenantId = tenantUsers.tenant_id;

    // Query integrations filtered by tenant_id
    const { data: integration, error } = await loadIntegration(tenantId, 'docusign', { enabledOnly: true });

    if (error || !integration) {
      console.error('[getDocuSignClient] Integration query error:', error);
      throw new Error('DocuSign integration is not enabled or not configured for this tenant');
    }

    const credentials = integration.credentials as DocuSignCredentials;
    const settings = integration.settings as DocuSignSettings;

    if (!credentials.account_id || !credentials.integration_key || !credentials.user_id || !credentials.private_key) {
      throw new Error('DocuSign credentials are incomplete. Please configure the integration in the admin panel.');
    }

    return new DocuSignClient(credentials, settings);
  } catch (error) {
    console.error('[getDocuSignClient] Failed to get DocuSign client:', error);
    throw error;
  }
}

/**
 * Get DocuSign client by tenant ID (for unauthenticated flows like enrollment wizard)
 * Uses admin client to bypass RLS
 */
export async function getDocuSignClientByTenantId(tenantId: string): Promise<DocuSignClient> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = createAdminClient();

    // Query integrations filtered by tenant_id using admin client
    const { data: integration, error } = await loadIntegration(tenantId, 'docusign', { enabledOnly: true });

    if (error || !integration) {
      console.error('[getDocuSignClientByTenantId] Integration query error:', error);
      throw new Error('DocuSign integration is not enabled or not configured for this tenant');
    }

    const credentials = integration.credentials as DocuSignCredentials;
    const settings = integration.settings as DocuSignSettings;

    if (!credentials.account_id || !credentials.integration_key || !credentials.user_id || !credentials.private_key) {
      throw new Error('DocuSign credentials are incomplete. Please configure the integration in the admin panel.');
    }

    return new DocuSignClient(credentials, settings);
  } catch (error) {
    console.error('[getDocuSignClientByTenantId] Failed to get DocuSign client:', error);
    throw error;
  }
}

/**
 * Get DocuSign client with specific credentials (for testing)
 */
export function createDocuSignClient(credentials: DocuSignCredentials, settings?: DocuSignSettings): DocuSignClient {
  return new DocuSignClient(credentials, settings);
}
